import { createImage } from "@/db/repositories/uploads";
import type {
  FigureRegionType,
  Image,
  NormalizedBoundingBox,
} from "@/domain/entities/image";
import { FIGURE_PIPELINE_VERSION } from "@/domain/entities/image";
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

export const FIGURE_DETECTION_PROMPT_VERSION = "v4";
export const MIN_DETECTION_CONFIDENCE = 0.65;
export const MIN_CROP_DIMENSION_PX = 200;
export const CROP_PADDING_RATIO = 0.065;
export const MIN_CROP_PADDING_PX = 12;
export const MAX_REGIONS_PER_PAGE = 12;
export const FIGURE_JPEG_QUALITY = 92;

const MIN_BBOX_AREA_RATIO = 0.001;
const MAX_BBOX_AREA_RATIO = 0.95;
const MIN_BBOX_ASPECT_RATIO = 0.12;
const MAX_BBOX_ASPECT_RATIO = 8;
const MIN_BBOX_DIMENSION = 0.01;

const regionTypeSchema = z.enum([
  "photo",
  "map",
  "diagram",
  "chart",
  "table",
  "timeline",
  "illustration",
  "other",
]);

const rawFigureDetectionSchema = z.object({
  regions: z
    .array(
      z.object({
        type: regionTypeSchema,
        caption: z.string(),
        description: z.string(),
        top: z.number(),
        left: z.number(),
        bottom: z.number(),
        right: z.number(),
        confidence: z.number(),
        containsText: z.boolean(),
      })
    )
    .max(MAX_REGIONS_PER_PAGE),
});

export interface FigureRegionDetection {
  type: FigureRegionType;
  caption: string;
  description: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
  confidence: number;
  containsText: boolean;
}

export type PixelBoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function normalizeBoundingBox(
  box: Pick<FigureRegionDetection, "top" | "left" | "bottom" | "right">,
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

export function isSanityValidBoundingBox(bbox: NormalizedBoundingBox): boolean {
  const widthFrac = bbox.right - bbox.left;
  const heightFrac = bbox.bottom - bbox.top;
  const areaRatio = widthFrac * heightFrac;

  if (areaRatio < MIN_BBOX_AREA_RATIO || areaRatio > MAX_BBOX_AREA_RATIO) {
    return false;
  }

  if (widthFrac < MIN_BBOX_DIMENSION || heightFrac < MIN_BBOX_DIMENSION) {
    return false;
  }

  const aspect = widthFrac / heightFrac;
  if (aspect < MIN_BBOX_ASPECT_RATIO || aspect > MAX_BBOX_ASPECT_RATIO) {
    return false;
  }

  return true;
}

export function applyCropPadding(
  bbox: NormalizedBoundingBox,
  pageWidth: number,
  pageHeight: number
): NormalizedBoundingBox {
  const widthFrac = bbox.right - bbox.left;
  const heightFrac = bbox.bottom - bbox.top;
  const padX = Math.max(
    widthFrac * CROP_PADDING_RATIO,
    MIN_CROP_PADDING_PX / Math.max(pageWidth, 1)
  );
  const padY = Math.max(
    heightFrac * CROP_PADDING_RATIO,
    MIN_CROP_PADDING_PX / Math.max(pageHeight, 1)
  );

  return {
    top: Math.max(0, bbox.top - padY),
    left: Math.max(0, bbox.left - padX),
    bottom: Math.min(1, bbox.bottom + padY),
    right: Math.min(1, bbox.right + padX),
  };
}

export function toPixelBoundingBox(
  bbox: NormalizedBoundingBox,
  pageWidth: number,
  pageHeight: number,
  padded = true
): PixelBoundingBox | null {
  if (!isSanityValidBoundingBox(bbox)) {
    return null;
  }

  const effective = padded
    ? applyCropPadding(bbox, pageWidth, pageHeight)
    : bbox;

  const left = Math.floor(Math.max(0, effective.left) * pageWidth);
  const top = Math.floor(Math.max(0, effective.top) * pageHeight);
  const right = Math.ceil(Math.min(1, effective.right) * pageWidth);
  const bottom = Math.ceil(Math.min(1, effective.bottom) * pageHeight);
  const width = right - left;
  const height = bottom - top;

  if (width < 1 || height < 1) {
    return null;
  }

  return { left, top, width, height };
}

export function shouldUseFullPageFallback(input: {
  confidence: number;
  pixelBox: PixelBoundingBox | null;
  normalized: NormalizedBoundingBox | null;
}): boolean {
  if (!input.normalized || !isSanityValidBoundingBox(input.normalized)) {
    return true;
  }

  if (input.confidence < MIN_DETECTION_CONFIDENCE) {
    return true;
  }

  if (!input.pixelBox) {
    return true;
  }

  if (
    input.pixelBox.width < MIN_CROP_DIMENSION_PX ||
    input.pixelBox.height < MIN_CROP_DIMENSION_PX
  ) {
    return true;
  }

  return false;
}

async function loadOrientedBuffer(buffer: Buffer): Promise<{
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

function parseFigureDetection(content: string): FigureRegionDetection[] {
  try {
    const payload = JSON.parse(content) as unknown;
    const parsed = rawFigureDetectionSchema.parse(payload);

    return parsed.regions
      .map((region) => ({
        type: region.type,
        caption: region.caption.trim().slice(0, 120),
        description: region.description.trim().slice(0, 400),
        top: region.top,
        left: region.left,
        bottom: region.bottom,
        right: region.right,
        confidence: region.confidence,
        containsText: region.containsText,
      }))
      .filter(
        (region) =>
          region.caption.length >= 3 &&
          region.description.length >= 12 &&
          region.confidence >= 0 &&
          region.confidence <= 1
      );
  } catch {
    return [];
  }
}

async function detectFigureRegionsOnPage(
  buffer: Buffer,
  mimeType: string,
  imageHash: string,
  tracker: UsageTracker
): Promise<FigureRegionDetection[]> {
  const cacheKey = buildFigureDetectionCacheKey({
    imageHash,
    model: env.aiVisionModel,
    promptVersion: FIGURE_DETECTION_PROMPT_VERSION,
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
Identifica le regioni visive didattiche: foto, mappe, diagrammi, grafici, tavole, timeline, illustrazioni.

Per ogni regione restituisci JSON:
{
  "regions": [
    {
      "type": "photo|map|diagram|chart|table|timeline|illustration|other",
      "caption": "didascalia breve in italiano",
      "description": "descrizione didattica di 1-2 frasi",
      "top": 0.0,
      "left": 0.0,
      "bottom": 1.0,
      "right": 1.0,
      "confidence": 0.0,
      "containsText": false
    }
  ]
}

Regole:
- Coordinate top/left/bottom/right normalizzate tra 0.0 e 1.0 sull'immagine fornita.
- Ritaglia la regione visiva principale, non intere colonne di testo.
- confidence riflette quanto sei sicuro del bbox (0-1).
- containsText=true se la regione include didascalie o testo integrato rilevante.
- Se non ci sono illustrazioni didattiche, restituisci {"regions":[]}.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 1800,
    },
    tracker
  );

  const content = response.choices[0]?.message?.content ?? '{"regions":[]}';
  const regions = parseFigureDetection(content);
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

  return regions;
}

function pageAlreadyHasFigures(
  pageNumber: number,
  existingImages: Image[]
): boolean {
  return existingImages.some(
    (image) =>
      image.pageNumber === pageNumber &&
      (isFigureStorageKey(image.storageKey) || image.fallbackToFullPage)
  );
}

async function createFallbackFigureImage(input: {
  knowledgeSourceId: KnowledgeSourceId;
  ownerId: UserId;
  pageImage: Image;
  detection: FigureRegionDetection;
  normalized: NormalizedBoundingBox;
  pageNumber: number;
}): Promise<Image> {
  return createImage({
    knowledgeSourceId: input.knowledgeSourceId,
    ownerId: input.ownerId,
    storageKey: input.pageImage.storageKey,
    masterStorageKey: null,
    hash: input.pageImage.hash,
    mimeType: input.pageImage.mimeType,
    sizeBytes: input.pageImage.sizeBytes,
    width: input.pageImage.width,
    height: input.pageImage.height,
    pageNumber: input.pageNumber,
    caption: input.detection.caption,
    sourcePageImageId: input.pageImage.id,
    bboxNormalized: input.normalized,
    detectionConfidence: input.detection.confidence,
    pipelineVersion: FIGURE_PIPELINE_VERSION,
    fallbackToFullPage: true,
    regionType: input.detection.type,
    containsText: input.detection.containsText,
  });
}

async function createCroppedFigureImage(input: {
  knowledgeSourceId: KnowledgeSourceId;
  ownerId: UserId;
  pageImage: Image;
  masterBuffer: Buffer;
  pixelBox: PixelBoundingBox;
  detection: FigureRegionDetection;
  normalized: NormalizedBoundingBox;
  pageNumber: number;
  figureIndex: number;
}): Promise<Image> {
  const storage = getStorageProvider();
  const cropped = await sharp(input.masterBuffer, { failOn: "none" })
    .extract(input.pixelBox)
    .jpeg({ quality: FIGURE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  const croppedMeta = await sharp(cropped).metadata();
  const storageKey = buildFigureStorageKey(
    input.knowledgeSourceId,
    input.pageNumber,
    input.figureIndex,
    "jpg"
  );
  const stored = await storage.save(storageKey, cropped, "image/jpeg");

  return createImage({
    knowledgeSourceId: input.knowledgeSourceId,
    ownerId: input.ownerId,
    storageKey: stored.storageKey,
    hash: hashBuffer(cropped),
    mimeType: "image/jpeg",
    sizeBytes: cropped.length,
    width: croppedMeta.width ?? input.pixelBox.width,
    height: croppedMeta.height ?? input.pixelBox.height,
    pageNumber: input.pageNumber,
    caption: input.detection.caption,
    sourcePageImageId: input.pageImage.id,
    bboxNormalized: input.normalized,
    detectionConfidence: input.detection.confidence,
    pipelineVersion: FIGURE_PIPELINE_VERSION,
    fallbackToFullPage: false,
    regionType: input.detection.type,
    containsText: input.detection.containsText,
  });
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

      const normalizedRaw = await storage.read(pageImage.storageKey);
      const masterKey = pageImage.masterStorageKey ?? pageImage.storageKey;
      const masterRaw = await storage.read(masterKey);

      let normalizedPage: Awaited<ReturnType<typeof loadOrientedBuffer>>;
      let masterPage: Awaited<ReturnType<typeof loadOrientedBuffer>>;

      try {
        [normalizedPage, masterPage] = await Promise.all([
          loadOrientedBuffer(normalizedRaw),
          loadOrientedBuffer(masterRaw),
        ]);
      } catch {
        return [];
      }

      const {
        buffer: normalizedBuffer,
        width: normalizedWidth,
        height: normalizedHeight,
      } = normalizedPage;
      const { buffer: masterBuffer, width: masterWidth, height: masterHeight } =
        masterPage;

      if (
        normalizedWidth === 0 ||
        normalizedHeight === 0 ||
        masterWidth === 0 ||
        masterHeight === 0
      ) {
        return [];
      }

      let detections: FigureRegionDetection[] = [];

      try {
        detections = await detectFigureRegionsOnPage(
          normalizedBuffer,
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
          normalizedWidth,
          normalizedHeight
        );

        if (!normalized) {
          continue;
        }

        const pixelBox = toPixelBoundingBox(
          normalized,
          masterWidth,
          masterHeight
        );

        if (
          shouldUseFullPageFallback({
            confidence: detection.confidence,
            pixelBox,
            normalized,
          })
        ) {
          pageFigures.push(
            await createFallbackFigureImage({
              knowledgeSourceId,
              ownerId,
              pageImage,
              detection,
              normalized,
              pageNumber,
            })
          );
          continue;
        }

        try {
          pageFigures.push(
            await createCroppedFigureImage({
              knowledgeSourceId,
              ownerId,
              pageImage,
              masterBuffer,
              pixelBox: pixelBox!,
              detection,
              normalized,
              pageNumber,
              figureIndex: index + 1,
            })
          );
        } catch {
          pageFigures.push(
            await createFallbackFigureImage({
              knowledgeSourceId,
              ownerId,
              pageImage,
              detection,
              normalized,
              pageNumber,
            })
          );
        }
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
  return images.filter(
    (image) => isFigureStorageKey(image.storageKey) || image.fallbackToFullPage
  );
}
