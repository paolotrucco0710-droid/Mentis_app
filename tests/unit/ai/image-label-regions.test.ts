import { describe, expect, it } from "vitest";
import {
  buildImageLabelingTask,
  buildImageLabelPrompt,
} from "@/ai/image-label-regions";
import {
  buildImageExplainCardFields,
  buildImageExplainQuiz,
} from "@/ai/image-explain-card-builder";
import { buildQuizOptions } from "@/ai/quiz-options";
import { deterministicShuffle } from "@/ai/deterministic-shuffle";
import type { AtomId } from "@/domain/ids";

const atomId = "00000000-0000-4000-8000-000000000101" as AtomId;

describe("image-label-regions", () => {
  it("builds tap zones when multiple concepts are available", () => {
    const task = buildImageLabelingTask(
      atomId,
      {
        title: "Cloroplasto",
        summary: "Organulo della fotosintesi.",
        explanation: "Contiene la clorofilla.",
        definitions: ["Organello verde delle cellule vegetali."],
        keywords: ["clorofilla", "fotosintesi", "stroma"],
        examples: [],
        misconceptions: [],
        quizDistractors: [],
        counterExamples: [],
        commonMistakes: [],
        images: [],
      },
      {
        imageId: "00000000-0000-4000-8000-000000000201",
        caption: "Schema del cloroplasto",
        description: "Schema con stroma, tilacoidi e clorofilla.",
        referencedConcepts: ["clorofilla", "stroma", "tilacoidi"],
      }
    );

    expect(task).not.toBeNull();
    expect(task?.regions.length).toBeGreaterThanOrEqual(2);
    expect(task?.correctRegionId).toBeTruthy();
    expect(
      task?.regions.some((region) => region.label.toLowerCase().includes("clorof"))
    ).toBe(true);
  });

  it("returns null when there are not enough labels", () => {
    const task = buildImageLabelingTask(
      atomId,
      {
        title: "Solo",
        summary: "Un concetto.",
        explanation: "Spiegazione.",
        definitions: [],
        keywords: [],
        examples: [],
        misconceptions: [],
        quizDistractors: [],
        counterExamples: [],
        commonMistakes: [],
        images: [],
      },
      {
        imageId: "00000000-0000-4000-8000-000000000201",
        caption: "Figura",
        description: "Descrizione abbastanza lunga.",
        referencedConcepts: [],
      }
    );

    expect(task).toBeNull();
  });

  it("builds a tap prompt for the target label", () => {
    expect(buildImageLabelPrompt("clorofilla")).toContain("clorofilla");
  });
});

const atom = {
  title: "Cloroplasto",
  summary: "Organulo della fotosintesi.",
  explanation: "Contiene la clorofilla.",
  definitions: [
    "Organello verde delle cellule vegetali.",
    "Contiene clorofilla e svolge la fotosintesi.",
  ],
  examples: ["Le foglie contengono molti cloroplasti."],
  keywords: ["clorofilla", "fotosintesi", "stroma"],
  misconceptions: ["Il cloroplasto è presente in tutte le cellule animali."],
  quizDistractors: [
    "Il cloroplasto produce energia solo di notte.",
    "La clorofilla si trova nel nucleo.",
    "I cloroplasti sono tipici delle cellule animali.",
  ],
  counterExamples: [],
  commonMistakes: [],
  images: [],
};

const imageReference = {
  imageId: "00000000-0000-4000-8000-000000000201",
  caption: "Schema del cloroplasto",
  description: "Schema con stroma, tilacoidi e clorofilla.",
  referencedConcepts: ["clorofilla", "stroma", "tilacoidi"],
};

describe("image-explain-card-builder", () => {
  it("uses quiz payload for image explain cards until real bbox labeling ships", () => {
    const primaryQuiz = buildQuizOptions(
      { id: atomId, ...atom },
      deterministicShuffle
    );
    const primaryCorrect =
      primaryQuiz.options[primaryQuiz.correctOptionIndex] ?? atom.summary;

    const fields = buildImageExplainCardFields(
      atomId,
      atom,
      imageReference,
      primaryCorrect
    );

    expect(fields).not.toBeNull();

    const payload = fields!.payload as {
      mode?: string;
      question?: string;
      options?: string[];
      correctOptionIndex?: number;
    };

    expect(payload.mode).toBe("quiz");
    expect(payload.options?.length).toBeGreaterThanOrEqual(2);
    expect(payload.correctOptionIndex).toBeGreaterThanOrEqual(0);
    expect(payload.question).toContain("Schema del cloroplasto");
  });

  it("does not duplicate the primary quiz options on the image card", () => {
    const primaryQuiz = buildQuizOptions(
      { id: atomId, ...atom },
      deterministicShuffle
    );
    const primaryCorrect =
      primaryQuiz.options[primaryQuiz.correctOptionIndex] ?? atom.summary;

    const imageQuiz = buildImageExplainQuiz(
      atomId,
      atom,
      imageReference,
      primaryCorrect
    );

    expect(imageQuiz).not.toBeNull();
    expect(imageQuiz!.options).not.toEqual(primaryQuiz.options);
    expect(imageQuiz!.question).not.toBe(primaryQuiz.question);
  });
});
