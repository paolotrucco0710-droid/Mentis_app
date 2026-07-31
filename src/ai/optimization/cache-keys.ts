import { createHash } from "node:crypto";
import type { AIResultCacheKind } from "./types";

export function buildCacheKey(parts: string[]): string {
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

export function buildOcrImageCacheKey(input: {
  imageHash: string;
  model: string;
}): string {
  return buildCacheKey(["ocr_image", input.imageHash, input.model]);
}

export function buildExtractionCacheKey(input: {
  textHash: string;
  promptVersion: string;
  parserVersion: string;
  model: string;
}): string {
  return buildCacheKey([
    "extraction",
    input.textHash,
    input.promptVersion,
    input.parserVersion,
    input.model,
  ]);
}

export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function cacheKindFromKey(cacheKey: string): AIResultCacheKind {
  if (cacheKey.startsWith("ocr_image")) {
    return "ocr_image";
  }
  if (cacheKey.startsWith("ocr_document")) {
    return "ocr_document";
  }
  return "extraction";
}
