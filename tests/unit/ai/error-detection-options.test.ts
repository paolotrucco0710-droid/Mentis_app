import { describe, expect, it } from "vitest";
import { buildErrorDetectionContent, buildTrueFalseContent } from "@/ai/error-detection-options";

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

    expect(content).not.toBeNull();
    expect(content!.flawedText).toContain("stessa cosa");
    expect(content!.flawedText).not.toMatch(/^confondere/i);
  });

  it("strips Pensare che prefixes from misconceptions", () => {
    const content = buildErrorDetectionContent({
      title: "Signorie cittadine",
      summary:
        "Le Signorie cittadine emersero in Italia intorno al 1300, spesso tramite l'impadronimento violento del potere.",
      explanation: "Il potere era concentrato in un signore.",
      misconceptions: [
        "Pensare che tutte le Signorie siano nate da un'unica modalità di acquisizione del potere.",
      ],
      commonMistakes: [],
      definitions: [],
      counterExamples: [],
    });

    expect(content).not.toBeNull();
    expect(content!.flawedText).toMatch(/tutte le Signorie/i);
    expect(content!.flawedText).not.toMatch(/^pensare che/i);
  });

  it("builds true/false statements from misconceptions", () => {
    const content = buildTrueFalseContent({
      title: "Signorie cittadine",
      summary: "Le Signorie cittadine emersero intorno al 1300.",
      explanation: "Il potere era concentrato in un signore.",
      misconceptions: [
        "Pensare che tutte le Signorie siano nate da un'unica modalità di acquisizione del potere.",
      ],
      commonMistakes: [],
      definitions: [],
      counterExamples: [],
    });

    expect(content.correctAnswer).toBe(false);
    expect(content.statement).toMatch(/tutte le Signorie/i);
    expect(content.statement).not.toMatch(/^pensare che/i);
  });

  it("builds different statements for true/false and error detection", () => {
    const atom = {
      title: "Signorie cittadine",
      summary: "Le Signorie cittadine emersero intorno al 1300.",
      explanation: "Il potere era concentrato in un signore.",
      misconceptions: [
        "Pensare che tutte le Signorie siano nate da un'unica modalità di acquisizione del potere.",
      ],
      commonMistakes: [
        "Confondere le Signorie cittadine con le repubbliche medievali.",
      ],
      definitions: [],
      counterExamples: [],
    };

    const trueFalse = buildTrueFalseContent(atom);
    const errorDetection = buildErrorDetectionContent(atom, {
      excludeStatements: [trueFalse.statement],
    });

    expect(trueFalse.correctAnswer).toBe(false);
    expect(errorDetection).not.toBeNull();
    expect(errorDetection!.flawedText).not.toBe(trueFalse.statement);
    expect(errorDetection!.flawedText).toContain("stessa cosa");
  });

  it("returns null instead of synthetic flawed text when sources are weak", () => {
    const content = buildErrorDetectionContent({
      title: "Turchi Selgiuchidi e Gerusalemme",
      summary:
        "Verso la fine dell'XI secolo, i turchi selgiuchidi presero il controllo di Gerusalemme.",
      explanation: "Ostacolarono i pellegrini cristiani.",
      misconceptions: [],
      commonMistakes: [],
      definitions: [],
      counterExamples: [],
    });

    expect(content).toBeNull();
  });
});
