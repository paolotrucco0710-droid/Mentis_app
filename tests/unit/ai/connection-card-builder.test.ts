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
    expect(buildConnectionQuestion("Fotosintesi", "Cloroplasto")).toContain(
      "Fotosintesi"
    );
    expect(buildConnectionQuestion("Fotosintesi", "Cloroplasto")).toContain(
      "Cloroplasto"
    );
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
    expect(payload.question).toContain("Fotosintesi");
  });
});
