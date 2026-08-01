import { describe, expect, it } from "vitest";
import {
  asDeclarativeQuizOption,
  buildQuizOptions,
} from "@/ai/quiz-options";

describe("buildQuizOptions", () => {
  it("uses summary as the correct quiz answer", () => {
    const quiz = buildQuizOptions(
      {
        id: "atom-001",
        title: "Reconquista",
        summary: "Arretramento musulmano dalla Penisola Iberica.",
        quizDistractors: [
          "La Reconquista fu un'unica campagna pianificata.",
          "Il termine Reconquista nacque nel IX secolo.",
          "La Reconquista interessò solo la Catalogna.",
        ],
      },
      (items) => items
    );

    expect(quiz.options).toContain(quiz.options[quiz.correctOptionIndex]);
    expect(quiz.options[quiz.correctOptionIndex]).toBe(
      "Arretramento musulmano dalla Penisola Iberica."
    );
    expect(quiz.options).not.toContain("Affermazione non corretta");
  });

  it("filters meta-phrased distractors", () => {
    expect(
      asDeclarativeQuizOption("Pensare che la battaglia fosse tra cristiani e musulmani.")
    ).toBeNull();
    expect(
      asDeclarativeQuizOption(
        "La battaglia di Roncevaux oppose cristiani baschi a Carlo Magno."
      )
    ).not.toBeNull();
  });
});
