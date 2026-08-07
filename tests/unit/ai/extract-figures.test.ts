import { describe, expect, it } from "vitest";
import {
  isValidFigureCrop,
  normalizeBoundingBox,
  toPixelBoundingBox,
} from "@/ai/extract-figures";

describe("extract-figures parsing", () => {
  it("accepts pixel coordinates from the vision model", async () => {
    const normalized = normalizeBoundingBox(
      { top: 120, left: 300, bottom: 900, right: 1500 },
      2000,
      1600
    );

    expect(normalized).not.toBeNull();
    const pixels = toPixelBoundingBox(normalized!, 2000, 1600);
    expect(pixels).toEqual({
      left: 300,
      top: 120,
      width: 1200,
      height: 780,
    });
  });

  it("rejects near full-page crops", () => {
    const box = normalizeBoundingBox(
      { top: 0.02, left: 0.02, bottom: 0.98, right: 0.98 },
      1000,
      1400
    );

    expect(box).not.toBeNull();
    expect(isValidFigureCrop(box!, 1000, 1400)).toBe(false);
    expect(toPixelBoundingBox(box!, 1000, 1400)).toBeNull();
  });

  it("rejects narrow text-column strips", () => {
    const box = normalizeBoundingBox(
      { top: 0.1, left: 0.45, bottom: 0.9, right: 0.55 },
      2000,
      3000
    );

    expect(box).not.toBeNull();
    expect(isValidFigureCrop(box!, 2000, 3000)).toBe(false);
    expect(toPixelBoundingBox(box!, 2000, 3000)).toBeNull();
  });

  it("accepts well-proportioned illustration crops", () => {
    const box = normalizeBoundingBox(
      { top: 0.15, left: 0.1, bottom: 0.65, right: 0.75 },
      1200,
      1600
    );

    expect(box).not.toBeNull();
    expect(isValidFigureCrop(box!, 1200, 1600)).toBe(true);
    expect(toPixelBoundingBox(box!, 1200, 1600)).toEqual({
      left: 120,
      top: 240,
      width: 780,
      height: 800,
    });
  });
});
