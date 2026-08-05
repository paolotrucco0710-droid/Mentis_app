import { describe, expect, it } from "vitest";
import {
  buildHeuristicRetrievalFeedback,
  normalizeUserAnswer,
  parseRetrievalFeedbackContent,
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
    expect(feedback.summary).toContain("Troppo breve");
  });

  it("rewards answers that mention reference points", () => {
    const feedback = buildHeuristicRetrievalFeedback({
      ...baseInput,
      userAnswer:
        "La Reconquista fu un arretramento musulmano dalla Penisola Iberica nel Medioevo.",
    });

    expect(feedback.score).toBeGreaterThanOrEqual(72);
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.summary).toContain("Ottimo");
  });

  it("does not mark vague answers as correct when only a few words overlap", () => {
    const feedback = buildHeuristicRetrievalFeedback({
      ...baseInput,
      atomTitle: "Ruolo Intellettuali Umanisti",
      referencePoints: [
        "Gli intellettuali umanisti erano figure laiche (notai, cancellieri) che promossero la cultura classica e una nuova visione della vita, acquisendo rilevanza sociale.",
        "Gli intellettuali umanisti, come notai e cancellieri, acquisirono un ruolo sociale importante, distaccandosi dall'egemonia ecclesiastica.",
      ],
      userAnswer:
        "gli intellettuali umanisti diventarono il centro della firenze medioevale",
    });

    expect(feedback.isCorrect).toBe(false);
    expect(feedback.strengths).toHaveLength(0);
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

describe("parseRetrievalFeedbackContent", () => {
  it("accepts correct answers with empty suggestion and gaps", () => {
    const feedback = parseRetrievalFeedbackContent(
      JSON.stringify({
        isCorrect: true,
        score: 88,
        strengths: [],
        gaps: [],
        suggestion: "",
        summary: "Hai colto bene l'idea centrale.",
      })
    );

    expect(feedback.source).toBe("ai");
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.suggestion).toBe("");
    expect(feedback.gaps).toEqual([]);
  });

  it("coerces string strengths and gaps from the model", () => {
    const feedback = parseRetrievalFeedbackContent(
      JSON.stringify({
        isCorrect: false,
        score: "42",
        strengths: "Hai citato il periodo storico.",
        gaps: "Manca il legame con la Penisola Iberica.",
        suggestion: "Aggiungi dove avvenne il processo.",
        summary: "Parzialmente corretto.",
      })
    );

    expect(feedback.score).toBe(42);
    expect(feedback.strengths).toEqual(["Hai citato il periodo storico."]);
    expect(feedback.gaps).toEqual(["Manca il legame con la Penisola Iberica."]);
  });
});
