import { describe, expect, it } from "vitest";
import {
  normalizeBoundingBox,
  toPixelBoundingBox,
} from "@/ai/extract-figures";
import {
  isFigureStorageKey,
  isPageSourceImage,
  isPageSourceStorageKey,
  isStudyIllustrationImage,
  isUploadSourcePageImage,
  shouldCreateImageExplainCard,
} from "@/ai/image-study";

describe("image-study storage paths", () => {
  it("treats page storage keys as OCR source pages", () => {
    expect(isPageSourceStorageKey("abc/pages/001.jpg")).toBe(true);
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

describe("image-study captions", () => {
  it("treats camera upload filenames as OCR source pages", () => {
    expect(isUploadSourcePageImage({ caption: "IMG_20260802_122407.jpg" })).toBe(
      true
    );
    expect(isUploadSourcePageImage({ caption: "DSC_0042.jpg" })).toBe(true);
    expect(isUploadSourcePageImage({ caption: null })).toBe(true);
  });

  it("accepts descriptive captions as study illustrations", () => {
    expect(
      isUploadSourcePageImage({
        caption: "Illustrazione della corte medievale",
      })
    ).toBe(false);
  });

  it("does not create image explain cards for upload page photos", () => {
    expect(
      shouldCreateImageExplainCard(
        { caption: "IMG_20260802_122407.jpg" },
        {
          caption: "Figura: Signorie cittadine",
          description: "Le signorie cittadine emersero intorno al 1300.",
        }
      )
    ).toBe(false);
  });

  it("creates image explain cards only with meaningful captions and descriptions", () => {
    expect(
      shouldCreateImageExplainCard(
        { caption: "Corte medievale sotto gli archi" },
        {
          caption: "Corte medievale sotto gli archi",
          description: "Rappresentazione di una signoria cittadina.",
        }
      )
    ).toBe(true);
  });
});

describe("extract-figures bounding boxes", () => {
  it("converts pixel coordinates to normalized boxes", () => {
    const box = normalizeBoundingBox(
      { top: 80, left: 200, bottom: 480, right: 800 },
      1000,
      800
    );

    expect(box).toEqual({
      top: 0.1,
      left: 0.2,
      bottom: 0.6,
      right: 0.8,
    });
  });

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
