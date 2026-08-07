import { describe, expect, it } from "vitest";
import {
  applyCropPadding,
  isSanityValidBoundingBox,
  MIN_CROP_DIMENSION_PX,
  normalizeBoundingBox,
  shouldUseFullPageFallback,
  toPixelBoundingBox,
} from "@/ai/extract-figures";

describe("figure-pipeline-v4", () => {
  it("accepts pixel coordinates from the vision model", () => {
    const normalized = normalizeBoundingBox(
      { top: 120, left: 300, bottom: 900, right: 1500 },
      2000,
      1600
    );

    expect(normalized).not.toBeNull();
    const pixels = toPixelBoundingBox(normalized!, 2000, 1600);
    expect(pixels).not.toBeNull();
    expect(pixels!.width).toBeGreaterThan(1000);
    expect(pixels!.height).toBeGreaterThan(700);
  });

  it("rejects degenerate full-page boxes via sanity checks", () => {
    const box = normalizeBoundingBox(
      { top: 0.01, left: 0.01, bottom: 0.99, right: 0.99 },
      1000,
      1400
    );

    expect(box).not.toBeNull();
    expect(isSanityValidBoundingBox(box!)).toBe(false);
  });

  it("accepts wide map-like regions that v3 rejected", () => {
    const box = normalizeBoundingBox(
      { top: 0.15, left: 0.08, bottom: 0.75, right: 0.92 },
      1200,
      1600
    );

    expect(box).not.toBeNull();
    expect(isSanityValidBoundingBox(box!)).toBe(true);
    expect(toPixelBoundingBox(box!, 3200, 4200)).not.toBeNull();
  });

  it("expands validated crops with ratio and pixel padding", () => {
    const box = normalizeBoundingBox(
      { top: 0.2, left: 0.2, bottom: 0.6, right: 0.8 },
      1000,
      1000
    );

    expect(box).not.toBeNull();
    const padded = applyCropPadding(box!, 1000, 1000);
    expect(padded.top).toBeLessThan(box!.top);
    expect(padded.bottom).toBeGreaterThan(box!.bottom);
    expect(padded.left).toBeLessThan(box!.left);
    expect(padded.right).toBeGreaterThan(box!.right);
  });

  it("falls back when confidence is low", () => {
    const normalized = normalizeBoundingBox(
      { top: 0.2, left: 0.2, bottom: 0.6, right: 0.8 },
      1000,
      1000
    );

    expect(
      shouldUseFullPageFallback({
        confidence: 0.5,
        pixelBox: toPixelBoundingBox(normalized!, 3000, 3000),
        normalized,
      })
    ).toBe(true);
  });

  it("falls back when crop would be too small on master", () => {
    const normalized = normalizeBoundingBox(
      { top: 0.1, left: 0.1, bottom: 0.35, right: 0.35 },
      1000,
      1000
    );

    const pixelBox = toPixelBoundingBox(normalized!, 400, 400);
    expect(pixelBox).not.toBeNull();
    expect(pixelBox!.width).toBeLessThan(MIN_CROP_DIMENSION_PX);

    expect(
      shouldUseFullPageFallback({
        confidence: 0.95,
        pixelBox,
        normalized,
      })
    ).toBe(true);
  });

  it("allows high-confidence crops large enough for study", () => {
    const normalized = normalizeBoundingBox(
      { top: 0.15, left: 0.1, bottom: 0.65, right: 0.75 },
      1200,
      1600
    );

    expect(
      shouldUseFullPageFallback({
        confidence: 0.9,
        pixelBox: toPixelBoundingBox(normalized!, 3200, 4200),
        normalized,
      })
    ).toBe(false);
  });
});
