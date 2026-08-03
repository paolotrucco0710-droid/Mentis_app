import { describe, expect, it } from "vitest";
import {
  findHeuristicSemanticImageLinks,
  parseSemanticImageLinks,
  scoreSemanticImageMatch,
  selectGreedySemanticLinks,
} from "@/ai/link-images-semantically";
import type { KnowledgeJsonAtom } from "@/domain/knowledge/knowledge-json";
import type { Image } from "@/domain/entities/image";
import type { ImageId, KnowledgeSourceId, UserId } from "@/domain/ids";

function makeAtom(overrides: Partial<KnowledgeJsonAtom> = {}): KnowledgeJsonAtom {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Fotosintesi",
    summary: "Processo con cui le piante convertono la luce in energia.",
    explanation: "La fotosintesi avviene nei cloroplasti.",
    importance: 3,
    difficulty: 2,
    prerequisites: [],
    learningObjectives: [],
    keywords: ["fotosintesi", "clorofilla"],
    aliases: [],
    formulas: [],
    definitions: [],
    examples: [],
    counterExamples: [],
    commonMistakes: [],
    misconceptions: [],
    applications: [],
    historicalContext: null,
    notes: null,
    images: [],
    tables: [],
    diagrams: [],
    equations: [],
    citations: [],
    pageReferences: [2],
    confidence: 0.9,
    ...overrides,
  };
}

function makeImage(caption: string): Image {
  return {
    id: "00000000-0000-4000-8000-000000000201" as ImageId,
    knowledgeSourceId: "00000000-0000-4000-8000-000000000301" as KnowledgeSourceId,
    ownerId: "00000000-0000-4000-8000-000000000001" as UserId,
    storageKey: "source/figures/p002-f01.jpg",
    hash: "hash",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    width: 800,
    height: 600,
    pageNumber: 2,
    caption,
    createdAt: new Date("2026-07-31T10:00:00.000Z"),
    deletedAt: null,
  };
}

describe("link-images-semantically", () => {
  it("scores higher matches for overlapping concept and caption terms", () => {
    const atom = makeAtom();
    const strong = makeImage("Schema della fotosintesi clorofilliana");
    const weak = makeImage("Battaglia di Lepanto e marina militare");

    expect(scoreSemanticImageMatch(atom, strong)).toBeGreaterThan(
      scoreSemanticImageMatch(atom, weak)
    );
  });

  it("parses semantic link JSON from the model", () => {
    const links = parseSemanticImageLinks(
      JSON.stringify({
        links: [
          { atomIndex: 0, imageIndex: 1, confidence: 0.91 },
          { atomIndex: 1, imageIndex: 0, confidence: 0.42 },
        ],
      })
    );

    expect(links).toEqual([
      { atomIndex: 0, imageIndex: 1, confidence: 0.91 },
      { atomIndex: 1, imageIndex: 0, confidence: 0.42 },
    ]);
  });

  it("selects one-to-one semantic links greedily by confidence", () => {
    const selected = selectGreedySemanticLinks([
      { atomIndex: 0, imageIndex: 0, confidence: 0.7 },
      { atomIndex: 0, imageIndex: 1, confidence: 0.95 },
      { atomIndex: 1, imageIndex: 0, confidence: 0.8 },
    ]);

    expect(selected).toEqual([
      { atomIndex: 0, imageIndex: 1, confidence: 0.95 },
      { atomIndex: 1, imageIndex: 0, confidence: 0.8 },
    ]);
  });

  it("finds heuristic semantic links for related atoms and captions", () => {
    const links = findHeuristicSemanticImageLinks(
      [{ atom: makeAtom(), atomIndex: 0 }],
      [
        {
          image: makeImage("Fotosintesi clorofilliana nelle piante verdi"),
          imageIndex: 0,
        },
      ]
    );

    expect(links).toHaveLength(1);
    expect(links[0]?.imageIndex).toBe(0);
  });
});
