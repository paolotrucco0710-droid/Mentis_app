import { describe, expect, it } from "vitest";
import { toPixelBoundingBox } from "@/ai/extract-figures";
import {
  isFigureStorageKey,
  isPageSourceImage,
  isPageSourceStorageKey,
  isStudyIllustrationImage,
} from "@/ai/image-study";

describe("image-study storage paths", () => {
  it("treats page storage keys as OCR source pages", () => {
    expect(
      isPageSourceStorageKey("abc/pages/001.jpg")
    ).toBe(true);
    expect(
      isPageSourceImage({
        storageKey: "abc/pages/001.jpg",
        caption: "Illustrazione della corte",
      })
    ).toBe(true);
  });

  it("treats extracted figures as study illustrations", () => {
    expect(isFigureStorageKey("abc/figures/p001-f01.jpg")).toBe(true);
    expect(
      isStudyIllustrationImage({
        storageKey: "abc/figures/p001-f01.jpg",
        caption: "Corte medievale",
      })
    ).toBe(true);
  });
});

describe("extract-figures bounding boxes", () => {
  it("converts normalized boxes to pixel crops", () => {
    const box = toPixelBoundingBox(
      { top: 0.1, left: 0.2, bottom: 0.6, right: 0.8 },
      1000,
      800
    );

    expect(box).toEqual({
      left: 200,
      top: 80,
      width: 600,
      height: 400,
    });
  });

  it("rejects boxes that are too small", () => {
    expect(
      toPixelBoundingBox(
        { top: 0.1, left: 0.1, bottom: 0.12, right: 0.12 },
        1000,
        800
      )
    ).toBeNull();
  });
});
