import { describe, expect, it } from "vitest";
import {
  asDeclarativeQuizOption,
  balanceQuizAnswerLength,
  buildQuizOptions,
} from "@/ai/quiz-options";

describe("buildQuizOptions", () => {
  it("prefers a definition over the longer summary as the correct answer", () => {
    const quiz = buildQuizOptions(
      {
        id: "atom-001",
        title: "Curriculum Studi Umanistici",
        summary:
          "Il curriculum degli studi umanistici si basava su retorica, grammatica, dialettica e musica, con latino e greco.",
        definitions: [
          "Gli studi umanistici si fondavano su retorica, grammatica e latino.",
        ],
        quizDistractors: [
          "Le scuole umanistiche erano esclusivamente religiose e gestite da ordini monastici.",
          "Il curriculum umanistico si basava principalmente su matematica e scienze naturali.",
          "L'accesso all'università non richiedeva la conoscenza del latino o del greco.",
        ],
      },
      (items) => items
    );

    expect(quiz.options[quiz.correctOptionIndex]).toBe(
      "Gli studi umanistici si fondavano su retorica, grammatica e latino."
    );
  });

  it("keeps the correct answer length close to the distractors", () => {
    const balanced = balanceQuizAnswerLength(
      "Il curriculum degli studi umanistici si basava su retorica, grammatica, dialettica e musica, con latino e greco.",
      [
        "Le scuole umanistiche erano esclusivamente religiose e gestite da ordini monastici.",
        "Il curriculum umanistico si basava principalmente su matematica e scienze naturali.",
        "L'accesso all'università non richiedeva la conoscenza del latino o del greco.",
      ]
    );

    const distractorAverage =
      [
        "Le scuole umanistiche erano esclusivamente religiose e gestite da ordini monastici.",
        "Il curriculum umanistico si basava principalmente su matematica e scienze naturali.",
        "L'accesso all'università non richiedeva la conoscenza del latino o del greco.",
      ].reduce((total, value) => total + value.length, 0) / 3;

    expect(balanced.length).toBeLessThanOrEqual(distractorAverage * 1.3);
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
