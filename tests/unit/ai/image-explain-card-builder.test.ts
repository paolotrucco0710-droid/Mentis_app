import { describe, expect, it } from "vitest";
import {
  buildImageConnectionCorrectAnswer,
  buildImageExplainQuiz,
} from "@/ai/image-explain-card-builder";
import type { AtomId } from "@/domain/ids";

const atomId = "00000000-0000-4000-8000-000000000101" as AtomId;

const marcoAurelioAtom = {
  id: atomId,
  title: "Marco Aurelio",
  summary:
    "Marco Aurelio è conosciuto come imperatore-filosofo e autore delle 'Meditazioni'.",
  explanation:
    "Le Meditazioni sono un testo fondamentale dello stoicismo.",
  definitions: [
    "Marco Aurelio fu un imperatore romano autore delle 'Meditazioni'.",
  ],
  keywords: ["Meditazioni", "stoicismo"],
  examples: [],
  misconceptions: [
    "Le 'Meditazioni' furono scritte da un altro imperatore.",
    "Marco Aurelio fu un imperatore noto per la sua guerra contro i Persiani.",
  ],
  quizDistractors: [],
  counterExamples: [],
  commonMistakes: [],
  prerequisites: [],
  importance: 4,
  difficulty: 2,
  learningObjectives: ["understand"],
  aliases: [],
  formulas: [],
  applications: [],
  historicalContext: null,
  notes: null,
  images: [],
  tables: [],
  diagrams: [],
  equations: [],
  citations: [],
  pageReferences: [],
  confidence: 0.9,
};

describe("image-explain-card-builder", () => {
  it("builds a caption-based correct answer for image connection cards", () => {
    const answer = buildImageConnectionCorrectAnswer("Marco Aurelio", {
      imageId: "00000000-0000-4000-8000-000000000201",
      caption: "Statua equestre di Marco Aurelio",
      description:
        "L'illustrazione «Statua equestre di Marco Aurelio» supporta la comprensione di Marco Aurelio.",
      referencedConcepts: ["statua", "imperatore"],
    });

    expect(answer).toContain("Statua equestre di Marco Aurelio");
    expect(answer).toContain("Marco Aurelio");
  });

  it("keeps quiz options aligned with the image connection question", () => {
    const quiz = buildImageExplainQuiz(atomId, marcoAurelioAtom, {
      imageId: "00000000-0000-4000-8000-000000000201",
      caption: "Statua equestre di Marco Aurelio",
      description:
        "L'illustrazione «Statua equestre di Marco Aurelio» supporta la comprensione di Marco Aurelio.",
      referencedConcepts: ["statua", "imperatore"],
    });

    expect(quiz).not.toBeNull();
    expect(quiz!.question).toBe(
      'Cosa collega l\'illustrazione «Statua equestre di Marco Aurelio» a "Marco Aurelio"?'
    );

    const correct = quiz!.options[quiz!.correctOptionIndex];
    expect(correct).toContain("Statua equestre di Marco Aurelio");
    expect(correct).not.toContain("Meditazioni");
  });
});
