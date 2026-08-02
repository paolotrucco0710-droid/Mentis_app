import { describe, expect, it } from "vitest";

describe("extract-figures parsing", () => {
  it("accepts pixel coordinates from the vision model", async () => {
    const { normalizeBoundingBox, toPixelBoundingBox } = await import(
      "@/ai/extract-figures"
    );

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
});
