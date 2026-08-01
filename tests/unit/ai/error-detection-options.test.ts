import { describe, expect, it } from "vitest";
import {
  buildErrorDetectionContent,
  normalizeErrorDetectionStatement,
} from "@/ai/error-detection-options";

describe("ai/error-detection-options", () => {
  it("converts meta-phrased mistakes into declarative false statements", () => {
    expect(
      normalizeErrorDetectionStatement(
        "Pensare che il termine 'Reconquista' fosse usato fin dall'inizio delle campagne cristiane"
      )
    ).toBe(
      "Il termine 'Reconquista' fu usato fin dall'inizio delle campagne cristiane."
    );
  });

  it("prefers dedicated errorDetectionStatement when provided", () => {
    const content = buildErrorDetectionContent({
      id: "atom-1",
      title: "Reconquista",
      summary: "Arretramento musulmano nella Penisola Iberica.",
      explanation: "Processo lungo e non coordinato.",
      definitions: [
        "La Reconquista è il graduale arretramento del dominio musulmano.",
      ],
      errorDetectionStatement:
        "Il termine Reconquista fu usato già nel IX secolo dalle campagne cristiane.",
      errorDetectionCorrection:
        "Il termine Reconquista fu promosso nel XVI secolo per fini propagandistici.",
    });

    expect(content.text).toBe(
      "Il termine Reconquista fu usato già nel IX secolo dalle campagne cristiane."
    );
    expect(content.hasError).toBe(true);
    expect(content.correction).toContain("XVI secolo");
  });

  it("falls back to quiz distractors instead of commonMistakes meta-phrases", () => {
    const content = buildErrorDetectionContent({
      id: "atom-2",
      title: "Regno delle Asturie",
      summary: "Primo regno cristiano nel nord della Penisola Iberica.",
      explanation: "Si formò nel 718.",
      definitions: [
        "Il Regno delle Asturie fu il primo regno cristiano a consolidarsi nel nord.",
      ],
      commonMistakes: [
        "Pensare che il Regno delle Asturie fosse fondato nel XV secolo.",
      ],
      quizDistractors: [
        "Il Regno delle Asturie fu fondato nel XV secolo come parte della Reconquista.",
      ],
    });

    expect(content.text).toBe(
      "Il Regno delle Asturie fu fondato nel XV secolo come parte della Reconquista."
    );
    expect(content.hasError).toBe(true);
  });
});
