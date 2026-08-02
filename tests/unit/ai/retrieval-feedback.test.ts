import { describe, expect, it } from "vitest";
import {
  buildHeuristicRetrievalFeedback,
  normalizeUserAnswer,
} from "@/ai/retrieval-feedback";

const baseInput = {
  mode: "blurting" as const,
  atomTitle: "Reconquista",
  atomSummary: "Arretramento musulmano dalla Penisola Iberica.",
  atomExplanation: "Processo lungo di riconquista cristiana della Spagna.",
  prompt: "Cosa ricordi sulla Reconquista?",
  referencePoints: [
    "Arretramento musulmano dalla Penisola Iberica",
    "Processo lungo nel Medioevo",
  ],
};

describe("normalizeUserAnswer", () => {
  it("trims whitespace and caps length", () => {
    expect(normalizeUserAnswer("  ciao mondo  ")).toBe("ciao mondo");
    expect(normalizeUserAnswer("a".repeat(3_000)).length).toBe(2_500);
  });
});

describe("buildHeuristicRetrievalFeedback", () => {
  it("marks short blurting answers as incomplete", () => {
    const feedback = buildHeuristicRetrievalFeedback({
      ...baseInput,
      userAnswer: "breve",
    });

    expect(feedback.source).toBe("heuristic");
    expect(feedback.isCorrect).toBe(false);
    expect(feedback.summary).toContain("troppo breve");
  });

  it("rewards answers that mention reference points", () => {
    const feedback = buildHeuristicRetrievalFeedback({
      ...baseInput,
      userAnswer:
        "La Reconquista fu un arretramento musulmano dalla Penisola Iberica nel Medioevo.",
    });

    expect(feedback.score).toBeGreaterThanOrEqual(60);
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.strengths.length).toBeGreaterThan(0);
  });

  it("uses a higher length threshold for feynman mode", () => {
    const feedback = buildHeuristicRetrievalFeedback({
      ...baseInput,
      mode: "feynman",
      userAnswer: "Spiego il concetto.",
    });

    expect(feedback.isCorrect).toBe(false);
    expect(feedback.suggestion).toContain("esempio");
  });
});
