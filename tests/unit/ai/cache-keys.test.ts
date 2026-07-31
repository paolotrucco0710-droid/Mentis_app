import { describe, expect, it } from "vitest";
import {
  buildCacheKey,
  buildExtractionCacheKey,
  buildOcrImageCacheKey,
  cacheKindFromKey,
  hashText,
} from "@/ai/optimization/cache-keys";

describe("ai/optimization/cache-keys", () => {
  it("builds stable cache keys for identical inputs", () => {
    const left = buildCacheKey(["a", "b", "c"]);
    const right = buildCacheKey(["a", "b", "c"]);
    expect(left).toBe(right);
    expect(left).toHaveLength(64);
  });

  it("builds distinct OCR and extraction keys", () => {
    const ocr = buildOcrImageCacheKey({
      imageHash: "hash-1",
      model: "gpt-4o-mini",
    });
    const extraction = buildExtractionCacheKey({
      textHash: "hash-1",
      promptVersion: "1.0.0",
      parserVersion: "1.0.0",
      model: "gpt-4o-mini",
    });

    expect(ocr).not.toBe(extraction);
  });

  it("hashes text deterministically", () => {
    expect(hashText("mentis")).toBe(hashText("mentis"));
    expect(hashText("mentis")).not.toBe(hashText("other"));
  });

  it("defaults cache kind to extraction for hashed keys", () => {
    const key = buildExtractionCacheKey({
      textHash: "abc",
      promptVersion: "1",
      parserVersion: "1",
      model: "gpt-4o-mini",
    });
    expect(cacheKindFromKey(key)).toBe("extraction");
  });
});
