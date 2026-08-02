import { describe, expect, it } from "vitest";
import { buildErrorDetectionContent } from "@/ai/error-detection-options";

describe("buildErrorDetectionContent", () => {
  it("converts confound mistakes into declarative flawed statements", () => {
    const content = buildErrorDetectionContent({
      title: "Regno delle Asturie",
      summary:
        "Il Regno delle Asturie fu il primo regno cristiano nella Penisola Iberica.",
      explanation: "Si formò nel 718.",
      misconceptions: [],
      commonMistakes: [
        "Confondere il Regno delle Asturie con altri regni cristiani successivi.",
      ],
      definitions: [
        "Il Regno delle Asturie fu il primo regno cristiano nella Penisola Iberica.",
      ],
      counterExamples: [],
    });

    expect(content.flawedText).toContain("stessa cosa");
    expect(content.flawedText).not.toMatch(/^confondere/i);
  });

  it("prefers misconceptions when they are declarative", () => {
    const content = buildErrorDetectionContent({
      title: "Reconquista",
      summary: "Processo di arretramento musulmano.",
      explanation: "Durò secoli.",
      misconceptions: [
        "La Reconquista fu un'unica campagna militare pianificata fin dall'inizio.",
      ],
      commonMistakes: [],
      definitions: [],
      counterExamples: [],
    });

    expect(content.flawedText).toContain("unica campagna");
    expect(content.correction).toBe("Processo di arretramento musulmano.");
  });
});
