import { describe, expect, it } from "vitest";
import {
  buildImageLabelingTask,
  buildImageLabelPrompt,
} from "@/ai/image-label-regions";
import { buildImageExplainCardFields } from "@/ai/image-explain-card-builder";
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

describe("image-explain-card-builder", () => {
  it("prefers tap-zone payload when labeling data is available", () => {
    const fields = buildImageExplainCardFields(
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

    const payload = fields.payload as {
      mode?: string;
      regions?: unknown[];
      correctRegionId?: string;
    };

    expect(payload.mode).toBe("tap-zone");
    expect(payload.regions?.length).toBeGreaterThanOrEqual(2);
    expect(payload.correctRegionId).toBeTruthy();
  });
});
