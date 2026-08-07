import { describe, expect, it } from "vitest";
import {
  buildConnectionCardCreateInput,
  buildConnectionCorrectAnswer,
  buildConnectionOptions,
  buildConnectionQuestion,
} from "@/ai/connection-card-builder";
import { CardType } from "@/domain/enums";
import type { AtomId } from "@/domain/ids";

const atomA = "00000000-0000-4000-8000-000000000101" as AtomId;
const atomB = "00000000-0000-4000-8000-000000000102" as AtomId;

function makeAtom(
  overrides: Partial<KnowledgeJsonAtom> & Pick<KnowledgeJsonAtom, "id" | "title">
): KnowledgeJsonAtom {
  return {
    summary: "",
    explanation: "",
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
    ...overrides,
  };
}

type KnowledgeJsonAtom = {
  id: AtomId;
  title: string;
  summary: string;
  explanation: string;
  definitions: string[];
  keywords: string[];
  examples: string[];
  misconceptions: string[];
  quizDistractors: string[];
  counterExamples: string[];
  commonMistakes: string[];
  prerequisites: AtomId[];
  importance: number;
  difficulty: number;
  learningObjectives: string[];
  aliases: string[];
  formulas: string[];
  applications: string[];
  historicalContext: string | null;
  notes: string | null;
  images: [];
  tables: [];
  diagrams: [];
  equations: [];
  citations: [];
  pageReferences: [];
  confidence: number;
};

describe("connection-card-builder", () => {
  it("builds a prerequisite connection question", () => {
    expect(buildConnectionQuestion("Fotosintesi", "Cloroplasto")).toBe(
      "Quale affermazione descrive meglio il rapporto tra «Cloroplasto» e «Fotosintesi»?"
    );
  });

  it("builds natural options from atom summaries instead of fixed title templates", () => {
    const prerequisite = makeAtom({
      id: atomB,
      title: "Politica culturale di Augusto",
      summary:
        "Augusto usò la cultura come strumento di controllo politico dell'impero.",
      explanation:
        "La propaganda e la censura furono parte integrante della politica augustea.",
    });
    const atom = makeAtom({
      id: atomA,
      title: "Censura letteraria",
      summary:
        "La censura letteraria limitò le opere pubblicate nel primo impero romano.",
      explanation:
        "Nacque nel clima creato dalla politica culturale di Augusto.",
      prerequisites: [atomB],
    });

    const quiz = buildConnectionOptions(atom, prerequisite);

    expect(quiz).not.toBeNull();
    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options[quiz.correctOptionIndex]).toMatch(/Augusto|cultura|censura/i);
    expect(
      quiz?.options.every((option) =>
        option.includes("prepara le basi per capire")
      )
    ).toBe(false);
    expect(
      quiz?.options.every((option) =>
        option.includes("sono lo stesso concetto con nomi diversi")
      )
    ).toBe(false);
  });

  it("prefers cross-referenced explanation sentences for the correct answer", () => {
    const correct = buildConnectionCorrectAnswer(
      makeAtom({
        id: atomA,
        title: "Censura letteraria",
        summary: "Limitò le opere pubblicate nel primo impero.",
        explanation:
          "Nacque nel clima creato dalla politica culturale di Augusto.",
        prerequisites: [atomB],
      }),
      makeAtom({
        id: atomB,
        title: "Politica culturale di Augusto",
        summary: "Augusto controllò la cultura come strumento politico.",
        explanation: "Includeva propaganda e controllo dei testi.",
      })
    );

    expect(correct).toMatch(/politica culturale|augusto|censura/i);
    expect(correct).not.toBe(
      "Politica culturale di Augusto prepara le basi per capire Censura letteraria."
    );
  });

  it("avoids nonsensical connection options for related concepts", () => {
    const quiz = buildConnectionOptions(
      makeAtom({
        id: atomA,
        title: "Impero cinese",
        summary: "L'Impero cinese centralizzò il potere.",
        explanation: "Si sviluppò sulla civiltà cinese.",
        prerequisites: [atomB],
      }),
      makeAtom({
        id: atomB,
        title: "Civiltà cinese",
        summary: "La civiltà cinese gettò le basi culturali.",
        explanation: "Antica tradizione prima dell'impero.",
      })
    );

    expect(quiz).not.toBeNull();
    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options[quiz.correctOptionIndex]).toMatch(/civiltà cinese/i);
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
      makeAtom({
        id: atomA,
        title: "Fotosintesi",
        summary: "Processo di produzione di glucosio.",
        explanation: "Avviene nei cloroplasti.",
        prerequisites: [atomB],
      }),
      makeAtom({
        id: atomB,
        title: "Cloroplasto",
        summary: "Organulo dove avviene la fotosintesi.",
        explanation: "Contiene clorofilla.",
      })
    );

    expect(quiz).not.toBeNull();
    expect(quiz?.options).toHaveLength(4);
    expect(quiz?.options[quiz.correctOptionIndex]).toMatch(/fotosintesi|cloroplast/i);
  });

  it("persists a connection card payload for dependent atoms", () => {
    const card = buildConnectionCardCreateInput(
      atomA,
      makeAtom({
        id: atomA,
        title: "Fotosintesi",
        summary: "Processo di produzione di glucosio.",
        explanation: "Avviene nei cloroplasti.",
        prerequisites: [atomB],
      }),
      makeAtom({
        id: atomB,
        title: "Cloroplasto",
        summary: "Organulo dove avviene la fotosintesi.",
        explanation: "Contiene clorofilla.",
      }),
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
