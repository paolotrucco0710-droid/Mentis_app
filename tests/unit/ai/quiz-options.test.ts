import { describe, expect, it } from "vitest";
import {
  asDeclarativeQuizOption,
  balanceQuizAnswerLength,
  buildQuizOptions,
  isCompleteQuizSentence,
  selectBalancedDistractors,
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

  it("never truncates the correct answer mid-sentence", () => {
    const balanced = balanceQuizAnswerLength(
      "La cultura laica inizia a svilupparsi nel Medioevo con le scuole cittadine e la traduzione dei testi sacri in volgare.",
      [
        "I laici non avevano accesso alla cultura fino al XV secolo.",
        "La cultura laica si sviluppò solo nel Rinascimento.",
        "Le scuole cittadine erano esclusivamente per i nobili.",
      ]
    );

    expect(balanced).not.toMatch(/\b(con|alle|e|da)\.$/i);
    expect(isCompleteQuizSentence(balanced)).toBe(true);
  });

  it("prefers a shorter complete alternative when the main answer is much longer", () => {
    const balanced = balanceQuizAnswerLength(
      "La cultura laica inizia a svilupparsi nel Medioevo con le scuole cittadine e la traduzione dei testi sacri in volgare.",
      [
        "I laici non avevano accesso alla cultura fino al XV secolo.",
        "La cultura laica si sviluppò solo nel Rinascimento.",
        "Le scuole cittadine erano esclusivamente per i nobili.",
      ],
      [
        "La cultura laica nasce nel Medioevo con scuole cittadine e testi in volgare.",
      ]
    );

    expect(balanced).toBe(
      "La cultura laica nasce nel Medioevo con scuole cittadine e testi in volgare."
    );
  });

  it("picks distractors with length close to the correct answer", () => {
    const distractors = selectBalancedDistractors(
      [
        "I laici non avevano accesso alla cultura fino al XV secolo.",
        "La cultura laica si sviluppò solo nel Rinascimento.",
        "Le scuole cittadine erano esclusivamente per i nobili.",
        "Le scuole cittadine erano esclusivamente per i nobili e per la classe dominante cittadina.",
      ],
      "La cultura laica nasce nel Medioevo con scuole cittadine e testi in volgare.",
      3,
      "Fallback generico."
    );

    expect(distractors).toContain(
      "Le scuole cittadine erano esclusivamente per i nobili e per la classe dominante cittadina."
    );
    expect(distractors.every(isCompleteQuizSentence)).toBe(true);
  });

  it("does not truncate the correct quiz option in buildQuizOptions", () => {
    const quiz = buildQuizOptions(
      {
        id: "atom-002",
        title: "Cultura laica nel Medioevo",
        summary:
          "La cultura laica inizia a svilupparsi nel Medioevo con le scuole cittadine e la traduzione dei testi sacri in volgare.",
        definitions: [
          "La cultura laica inizia a svilupparsi nel Medioevo con le scuole cittadine e la traduzione dei testi sacri in volgare.",
          "La cultura laica nasce nel Medioevo con scuole cittadine e testi in volgare.",
        ],
        quizDistractors: [
          "I laici non avevano accesso alla cultura fino al XV secolo.",
          "La cultura laica si sviluppò solo nel Rinascimento.",
          "Le scuole cittadine erano esclusivamente per i nobili.",
        ],
      },
      (items) => items
    );

    expect(quiz.options[quiz.correctOptionIndex]).toBe(
      "La cultura laica nasce nel Medioevo con scuole cittadine e testi in volgare."
    );
    expect(
      quiz.options.every((option) => isCompleteQuizSentence(option))
    ).toBe(true);
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
