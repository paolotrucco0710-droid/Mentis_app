import { createImage } from "@/db/repositories/uploads";
import type { Image } from "@/domain/entities/image";
import type { KnowledgeSourceId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import {
  buildFigureStorageKey,
  getStorageProvider,
  hashBuffer,
} from "@/storage";
import sharp from "sharp";
import { z } from "zod";
import { isFigureStorageKey, isPageSourceImage } from "./image-study";
import {
  buildFigureDetectionCacheKey,
  estimateModelCost,
  mapWithConcurrency,
  readCacheResult,
  runChatCompletion,
  UsageTracker,
  writeCacheResult,
} from "./optimization";

const MIN_FIGURE_AREA_RATIO = 0.04;
const MAX_FIGURE_AREA_RATIO = 0.72;
const MIN_FIGURE_ASPECT_RATIO = 0.3;
const MAX_FIGURE_ASPECT_RATIO = 1 / MIN_FIGURE_ASPECT_RATIO;
const MIN_FIGURE_DIMENSION_PX = 48;

const rawFigureDetectionSchema = z.object({
  figures: z
    .array(
      z.object({
        caption: z.string(),
        description: z.string(),
        top: z.number(),
        left: z.number(),
        bottom: z.number(),
        right: z.number(),
      })
    )
    .max(3),
});

export interface FigureDetection {
  caption: string;
  description: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export type NormalizedBoundingBox = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export type PixelBoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function normalizeBoundingBox(
  box: Pick<FigureDetection, "top" | "left" | "bottom" | "right">,
  pageWidth: number,
  pageHeight: number
): NormalizedBoundingBox | null {
  let { top, left, bottom, right } = box;

  const maxCoord = Math.max(
    Math.abs(top),
    Math.abs(left),
    Math.abs(bottom),
    Math.abs(right)
  );

  if (maxCoord > 1) {
    if (pageWidth <= 0 || pageHeight <= 0) {
      return null;
    }

    top = top / pageHeight;
    left = left / pageWidth;
    bottom = bottom / pageHeight;
    right = right / pageWidth;
  }

  top = Math.max(0, Math.min(1, top));
  left = Math.max(0, Math.min(1, left));
  bottom = Math.max(0, Math.min(1, bottom));
  right = Math.max(0, Math.min(1, right));

  if (bottom <= top || right <= left) {
    return null;
  }

  return { top, left, bottom, right };
}

export function isValidFigureCrop(
  bbox: NormalizedBoundingBox,
  pageWidth: number,
  pageHeight: number
): boolean {
  const widthFrac = bbox.right - bbox.left;
  const heightFrac = bbox.bottom - bbox.top;
  const areaRatio = widthFrac * heightFrac;

  if (areaRatio > MAX_FIGURE_AREA_RATIO) {
    return false;
  }

  const pixelWidth = widthFrac * pageWidth;
  const pixelHeight = heightFrac * pageHeight;
  if (pixelWidth <= 0 || pixelHeight <= 0) {
    return false;
  }

  const aspect = pixelWidth / pixelHeight;
  if (aspect < MIN_FIGURE_ASPECT_RATIO || aspect > MAX_FIGURE_ASPECT_RATIO) {
    return false;
  }

  return true;
}

export function toPixelBoundingBox(
  bbox: NormalizedBoundingBox,
  pageWidth: number,
  pageHeight: number
): PixelBoundingBox | null {
  if (!isValidFigureCrop(bbox, pageWidth, pageHeight)) {
    return null;
  }

  const left = Math.floor(Math.max(0, bbox.left) * pageWidth);
  const top = Math.floor(Math.max(0, bbox.top) * pageHeight);
  const right = Math.ceil(Math.min(1, bbox.right) * pageWidth);
  const bottom = Math.ceil(Math.min(1, bbox.bottom) * pageHeight);
  const width = right - left;
  const height = bottom - top;

  if (width < MIN_FIGURE_DIMENSION_PX || height < MIN_FIGURE_DIMENSION_PX) {
    return null;
  }

  const areaRatio = (width * height) / (pageWidth * pageHeight);
  if (areaRatio < MIN_FIGURE_AREA_RATIO) {
    return null;
  }

  return { left, top, width, height };
}

async function loadOrientedPageBuffer(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  const oriented = await sharp(buffer, { failOn: "none" }).rotate().toBuffer();
  const metadata = await sharp(oriented).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  return { buffer: oriented, width, height };
}

function parseFigureDetection(content: string): FigureDetection[] {
  try {
    const payload = JSON.parse(content) as unknown;
    const parsed = rawFigureDetectionSchema.parse(payload);

    return parsed.figures
      .map((figure) => ({
        caption: figure.caption.trim().slice(0, 120),
        description: figure.description.trim().slice(0, 400),
        top: figure.top,
        left: figure.left,
        bottom: figure.bottom,
        right: figure.right,
      }))
      .filter(
        (figure) =>
          figure.caption.length >= 3 && figure.description.length >= 12
      );
  } catch {
    return [];
  }
}

async function detectFiguresOnPage(
  buffer: Buffer,
  mimeType: string,
  imageHash: string,
  tracker: UsageTracker
) {
  const cacheKey = buildFigureDetectionCacheKey({
    imageHash,
    model: env.aiVisionModel,
  });
  const cached = await readCacheResult<string>(cacheKey);
  if (cached) {
    tracker.recordCacheHit();
    return parseFigureDetection(cached.value);
  }

  tracker.recordCacheMiss();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await runChatCompletion(
    {
      model: env.aiVisionModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analizza questa pagina di libro scolastico in italiano.
Identifica SOLO illustrazioni didattiche utili allo studio: dipinti, mappe, diagrammi, grafici, tavole, foto storiche, schemi.
NON includere:
- blocchi o colonne di testo
- margini o bordi della pagina
- la pagina intera o più del 60% della pagina
- decorazioni minime senza valore didattico

Il riquadro deve aderire strettamente all'illustrazione, con margini minimi attorno.

Per ogni illustrazione restituisci JSON:
{
  "figures": [
    {
      "caption": "didascalia breve in italiano",
      "description": "descrizione didattica di 1-2 frasi",
      "top": 0.0,
      "left": 0.0,
      "bottom": 1.0,
      "right": 1.0
    }
  ]
}

Le coordinate top/left/bottom/right devono essere normalizzate tra 0.0 e 1.0 (frazione dell'immagine), NON in pixel.
Esempio: un riquadro al centro può essere top=0.2, left=0.55, bottom=0.75, right=0.95.
Massimo 3 figure. Se non ci sono illustrazioni didattiche, restituisci {"figures":[]}.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 1200,
    },
    tracker
  );

  const content = response.choices[0]?.message?.content ?? '{"figures":[]}';
  const figures = parseFigureDetection(content);
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;

  await writeCacheResult({
    cacheKey,
    kind: "ocr_image",
    contentHash: imageHash,
    model: env.aiVisionModel,
    result: content,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateModelCost(
      env.aiVisionModel,
      inputTokens,
      outputTokens
    ),
  });

  return figures;
}

function pageAlreadyHasFigures(
  pageNumber: number,
  existingImages: Image[]
): boolean {
  return existingImages.some(
    (image) =>
      isFigureStorageKey(image.storageKey) && image.pageNumber === pageNumber
  );
}

export async function extractFiguresFromPageImages(input: {
  knowledgeSourceId: KnowledgeSourceId;
  ownerId: UserId;
  pageImages: Image[];
  existingImages?: Image[];
  tracker: UsageTracker;
}): Promise<Image[]> {
  const {
    knowledgeSourceId,
    ownerId,
    pageImages,
    existingImages = [],
    tracker,
  } = input;

  const candidates = pageImages
    .filter(
      (image) =>
        image.mimeType.startsWith("image/") && isPageSourceImage(image)
    )
    .sort((left, right) => (left.pageNumber ?? 0) - (right.pageNumber ?? 0));

  if (candidates.length === 0) {
    return [];
  }

  const storage = getStorageProvider();
  const created: Image[] = [];

  const results = await mapWithConcurrency(
    candidates,
    env.aiOcrBatchSize,
    async (pageImage) => {
      const pageNumber = pageImage.pageNumber ?? 1;
      if (pageAlreadyHasFigures(pageNumber, existingImages)) {
        return [];
      }

      const rawBuffer = await storage.read(pageImage.storageKey);
      let orientedPage: Awaited<ReturnType<typeof loadOrientedPageBuffer>>;

      try {
        orientedPage = await loadOrientedPageBuffer(rawBuffer);
      } catch {
        return [];
      }

      const { buffer, width: pageWidth, height: pageHeight } = orientedPage;

      if (pageWidth === 0 || pageHeight === 0) {
        return [];
      }

      let detections: FigureDetection[] = [];

      try {
        detections = await detectFiguresOnPage(
          buffer,
          pageImage.mimeType,
          pageImage.hash,
          tracker
        );
      } catch {
        return [];
      }

      if (detections.length === 0) {
        return [];
      }

      const pageFigures: Image[] = [];

      for (let index = 0; index < detections.length; index += 1) {
        const detection = detections[index]!;
        const normalized = normalizeBoundingBox(
          detection,
          pageWidth,
          pageHeight
        );
        if (!normalized) {
          continue;
        }

        const pixelBox = toPixelBoundingBox(
          normalized,
          pageWidth,
          pageHeight
        );

        if (!pixelBox) {
          continue;
        }

        const cropped = await sharp(buffer, { failOn: "none" })
          .extract(pixelBox)
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();

        const croppedMeta = await sharp(cropped).metadata();
        const storageKey = buildFigureStorageKey(
          knowledgeSourceId,
          pageNumber,
          index + 1,
          "jpg"
        );
        const stored = await storage.save(storageKey, cropped, "image/jpeg");
        const saved = await createImage({
          knowledgeSourceId,
          ownerId,
          storageKey: stored.storageKey,
          hash: hashBuffer(cropped),
          mimeType: "image/jpeg",
          sizeBytes: cropped.length,
          width: croppedMeta.width ?? pixelBox.width,
          height: croppedMeta.height ?? pixelBox.height,
          pageNumber,
          caption: detection.caption.trim(),
        });

        pageFigures.push(saved);
      }

      return pageFigures;
    }
  );

  for (const pageFigures of results) {
    created.push(...pageFigures);
  }

  return created;
}

export function mergeKnowledgeSourceImages(
  existingImages: Image[],
  figureImages: Image[]
): Image[] {
  if (figureImages.length === 0) {
    return existingImages;
  }

  const byId = new Map<string, Image>();
  for (const image of existingImages) {
    byId.set(image.id, image);
  }
  for (const image of figureImages) {
    byId.set(image.id, image);
  }

  return [...byId.values()].sort(
    (left, right) => (left.pageNumber ?? 0) - (right.pageNumber ?? 0)
  );
}

export function listFigureImages(images: Image[]): Image[] {
  return images.filter((image) => isFigureStorageKey(image.storageKey));
}
