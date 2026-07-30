import type { Image, KnowledgeSource } from "@/domain/entities";
import { KnowledgeSourceType } from "@/domain/enums";
import { getOpenAIClient } from "./client";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/storage";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text ?? "";
}

async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const client = getOpenAIClient();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await client.chat.completions.create({
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
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function extractDocumentText(
  knowledgeSource: KnowledgeSource,
  images: Image[]
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

  for (const image of pageImages) {
    const buffer = await storage.read(image.storageKey);
    const text = await extractTextFromImage(buffer, image.mimeType);
    if (text.trim()) {
      parts.push(`--- Pagina ${image.pageNumber ?? "?"} ---\n${text}`);
    }
  }

  const combined = parts.join("\n\n").trim();
  if (!combined) {
    throw new Error("Impossibile estrarre testo dal materiale caricato.");
  }

  return combined;
}
