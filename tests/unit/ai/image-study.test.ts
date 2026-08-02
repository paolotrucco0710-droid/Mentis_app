import { describe, expect, it } from "vitest";
import {
  isUploadSourcePageImage,
  shouldCreateImageExplainCard,
} from "@/ai/image-study";

describe("image-study", () => {
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
