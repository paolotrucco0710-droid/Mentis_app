import type { Image, KnowledgeSource } from "@/domain/entities";
import { KnowledgeSourceType } from "@/domain/enums";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/storage";
import {
  buildOcrImageCacheKey,
  estimateModelCost,
  mapWithConcurrency,
  readCacheResult,
  runChatCompletion,
  UsageTracker,
  writeCacheResult,
} from "./optimization";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text ?? "";
}

async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
  imageHash: string,
  tracker: UsageTracker
): Promise<string> {
  const cacheKey = buildOcrImageCacheKey({
    imageHash,
    model: env.aiVisionModel,
  });
  const cached = await readCacheResult<string>(cacheKey);
  if (cached) {
    tracker.recordCacheHit();
    return cached.value;
  }

  tracker.recordCacheMiss();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await runChatCompletion(
    {
      model: env.aiVisionModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Estrai tutto il testo didattico da questa immagine. Mantieni titoli, elenchi ed equazioni. Non aggiungere commenti.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 4096,
    },
    tracker
  );

  const text = response.choices[0]?.message?.content ?? "";
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const estimatedCostUsd = estimateModelCost(
    env.aiVisionModel,
    inputTokens,
    outputTokens
  );

  await writeCacheResult({
    cacheKey,
    kind: "ocr_image",
    contentHash: imageHash,
    model: env.aiVisionModel,
    result: text,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
  });

  return text;
}

export async function extractDocumentText(
  knowledgeSource: KnowledgeSource,
  images: Image[],
  tracker: UsageTracker
): Promise<string> {
  const storage = getStorageProvider();
  const parts: string[] = [];

  if (knowledgeSource.sourceType === KnowledgeSourceType.Pdf) {
    const pdfImage = images.find(
      (image) => image.mimeType === "application/pdf"
    );
    if (!pdfImage) {
      throw new Error("PDF non trovato nello storage.");
    }
    const buffer = await storage.read(pdfImage.storageKey);
    const text = await extractTextFromPdf(buffer);
    if (text.trim().length > 50) {
      return text;
    }
    parts.push(text);
  }

  const pageImages = images
    .filter((image) => image.mimeType.startsWith("image/"))
    .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));

  const ocrResults = await mapWithConcurrency(
    pageImages,
    env.aiOcrBatchSize,
    async (image) => {
      const buffer = await storage.read(image.storageKey);
      const text = await extractTextFromImage(
        buffer,
        image.mimeType,
        image.hash,
        tracker
      );
      return {
        pageNumber: image.pageNumber,
        text: text.trim(),
      };
    }
  );

  for (const result of ocrResults) {
    if (result.text) {
      parts.push(`--- Pagina ${result.pageNumber ?? "?"} ---\n${result.text}`);
    }
  }

  const combined = parts.join("\n\n").trim();
  if (!combined) {
    throw new Error("Impossibile estrarre testo dal materiale caricato.");
  }

  return combined;
}
