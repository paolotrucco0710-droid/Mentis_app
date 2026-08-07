import { describe, expect, it } from "vitest";
import {
  buildConnectionCardCreateInput,
  buildConnectionOptions,
  buildConnectionQuestion,
} from "@/ai/connection-card-builder";
import { CardType } from "@/domain/enums";
import type { AtomId } from "@/domain/ids";

const atomA = "00000000-0000-4000-8000-000000000101" as AtomId;
const atomB = "00000000-0000-4000-8000-000000000102" as AtomId;

describe("connection-card-builder", () => {
  it("builds a prerequisite connection question", () => {
    expect(buildConnectionQuestion("Fotosintesi", "Cloroplasto")).toBe(
      "Quale affermazione descrive meglio il rapporto tra «Cloroplasto» e «Fotosintesi»?"
    );
  });

  it("avoids nonsensical connection options for related concepts", () => {
    const quiz = buildConnectionOptions(
      {
        id: atomA,
        title: "Impero cinese",
        summary: "L'Impero cinese centralizzò il potere.",
        explanation: "Si sviluppò sulla civiltà cinese.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
        quizDistractors: [],
        counterExamples: [],
        commonMistakes: [],
        prerequisites: [atomB],
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
      },
      {
        id: atomB,
        title: "Civiltà cinese",
        summary: "La civiltà cinese gettò le basi culturali.",
        explanation: "Antica tradizione prima dell'impero.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
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
      }
    );

    expect(quiz).not.toBeNull();
    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options[quiz.correctOptionIndex]).toBe(
      "Civiltà cinese prepara le basi per capire Impero cinese."
    );
    expect(
      quiz?.options.some((option) => option.includes("esempio applicato"))
    ).toBe(false);
    expect(
      quiz?.options.some((option) =>
        option.includes("non hanno un legame diretto")
      )
    ).toBe(false);
  });

  it("creates multiple-choice options with one correct prerequisite link", () => {
    const quiz = buildConnectionOptions(
      {
        id: atomA,
        title: "Fotosintesi",
        summary: "Processo di produzione di glucosio.",
        explanation: "Avviene nei cloroplasti.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
        quizDistractors: [],
        counterExamples: [],
        commonMistakes: [],
        prerequisites: [atomB],
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
      },
      {
        id: atomB,
        title: "Cloroplasto",
        summary: "Organulo dove avviene la fotosintesi.",
        explanation: "Contiene clorofilla.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
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
      }
    );

    expect(quiz).not.toBeNull();
    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options[quiz.correctOptionIndex]).toContain("Cloroplasto");
  });

  it("persists a connection card payload for dependent atoms", () => {
    const card = buildConnectionCardCreateInput(
      atomA,
      {
        id: atomA,
        title: "Fotosintesi",
        summary: "Processo di produzione di glucosio.",
        explanation: "Avviene nei cloroplasti.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
        quizDistractors: [],
        counterExamples: [],
        commonMistakes: [],
        prerequisites: [atomB],
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
      },
      {
        id: atomB,
        title: "Cloroplasto",
        summary: "Organulo dove avviene la fotosintesi.",
        explanation: "Contiene clorofilla.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
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
      },
      7
    );

    expect(card?.type).toBe(CardType.Connection);
    const payload = card?.payload as {
      relatedAtomId?: string;
      question?: string;
    };
    expect(payload.relatedAtomId).toBe(atomB);
    expect(payload.question).toBe(
      "Quale affermazione descrive meglio il rapporto tra «Cloroplasto» e «Fotosintesi»?"
    );
  });
});
