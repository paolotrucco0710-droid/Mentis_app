import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { enrichKnowledgeWithImages } from "@/ai/enrich-images";
import { normalizeKnowledgeJson } from "@/ai/normalize";
import type { Image } from "@/domain/entities/image";
import type { ImageId, KnowledgeSourceId, UserId } from "@/domain/ids";
import { makeMvpKnowledgeJson } from "../../helpers/mvp-knowledge";

function makeImage(input: {
  id: string;
  pageNumber?: number | null;
  caption?: string | null;
  storageKey?: string;
}): Image {
  const id = input.id as ImageId;
  return {
    id,
    knowledgeSourceId: "00000000-0000-4000-8000-000000000201" as KnowledgeSourceId,
    ownerId: "00000000-0000-4000-8000-000000000001" as UserId,
    storageKey:
      input.storageKey ??
      `00000000-0000-4000-8000-000000000201/figures/p001-f01.jpg`,
    hash: "hash",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    width: 800,
    height: 600,
    pageNumber: input.pageNumber ?? 1,
    caption: input.caption ?? null,
    createdAt: new Date("2026-07-31T10:00:00.000Z"),
    deletedAt: null,
  };
}

function makeKnowledge(atomCount = 1) {
  const extracted = makeMvpKnowledgeJson();
  extracted.atoms = Array.from({ length: atomCount }, (_, index) => ({
    ...extracted.atoms[0]!,
    id: randomUUID(),
    title: `Concetto ${index + 1}`,
    pageReferences: [index + 1],
    images: [],
  }));

  return normalizeKnowledgeJson(
    extracted,
    "00000000-0000-4000-8000-000000000201"
  );
}

function studyCaption(label: string): string {
  return `Illustrazione: ${label}`;
}

describe("enrichKnowledgeWithImages", () => {
  it("returns knowledge unchanged when no images were uploaded", async () => {
    const knowledge = makeKnowledge();
    const enriched = await enrichKnowledgeWithImages(knowledge, []);

    expect(enriched).toEqual(knowledge);
  });

  it("links a study illustration to the atom on the same page", async () => {
    const knowledge = makeKnowledge();
    const imageId = randomUUID();
    const images = [
      makeImage({
        id: imageId,
        pageNumber: 1,
        caption: studyCaption("Concetto 1"),
      }),
    ];

    const enriched = await enrichKnowledgeWithImages(knowledge, images);

    expect(enriched.atoms[0]?.images).toEqual([
      {
        imageId,
        caption: studyCaption("Concetto 1"),
        description: knowledge.atoms[0]?.summary,
        referencedConcepts: knowledge.atoms[0]?.keywords.slice(0, 4),
      },
    ]);
  });

  it("ignores upload page photos used only for OCR", async () => {
    const knowledge = makeKnowledge();
    const imageId = randomUUID();
    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 1,
        caption: "IMG_20260802_122407.jpg",
        storageKey: "00000000-0000-4000-8000-000000000201/pages/001.jpg",
      }),
    ]);

    expect(enriched.atoms[0]?.images).toEqual([]);
  });

  it("assigns page-specific illustrations to matching atoms", async () => {
    const knowledge = makeKnowledge(2);
    const firstImageId = randomUUID();
    const secondImageId = randomUUID();
    const images = [
      makeImage({
        id: firstImageId,
        pageNumber: 1,
        caption: studyCaption("Concetto 1"),
      }),
      makeImage({
        id: secondImageId,
        pageNumber: 2,
        caption: studyCaption("Concetto 2"),
      }),
    ];

    const enriched = await enrichKnowledgeWithImages(knowledge, images);

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(firstImageId);
    expect(enriched.atoms[1]?.images[0]?.imageId).toBe(secondImageId);
  });

  it("preserves valid image references already present in the knowledge JSON", async () => {
    const knowledge = makeKnowledge();
    const preservedImageId = randomUUID();
    knowledge.atoms[0] = {
      ...knowledge.atoms[0]!,
      images: [
        {
          imageId: preservedImageId,
          caption: "Schema esistente",
          description: "Descrizione esistente",
          referencedConcepts: ["fotosintesi"],
        },
      ],
    };

    const otherImageId = randomUUID();
    const enriched = await enrichKnowledgeWithImages(
      knowledge,
      [
        makeImage({
          id: preservedImageId,
          caption: "Schema esistente",
        }),
        makeImage({
          id: otherImageId,
          caption: studyCaption("Altro schema"),
        }),
      ]
    );

    expect(enriched.atoms[0]?.images).toEqual(knowledge.atoms[0]?.images);
  });

  it("does not assign unmatched upload photos to atoms", async () => {
    const knowledge = makeKnowledge(2);
    knowledge.atoms[0] = {
      ...knowledge.atoms[0]!,
      pageReferences: [3],
    };
    knowledge.atoms[1] = {
      ...knowledge.atoms[1]!,
      pageReferences: [4],
    };

    const imageId = randomUUID();
    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 1,
        caption: "IMG_20260802_122407.jpg",
        storageKey: "00000000-0000-4000-8000-000000000201/pages/001.jpg",
      }),
    ]);

    expect(enriched.atoms[0]?.images).toEqual([]);
    expect(enriched.atoms[1]?.images).toEqual([]);
  });

  it("uses descriptive captions when available", async () => {
    const knowledge = makeKnowledge();
    const imageId = randomUUID();
    const caption = "Schema della fotosintesi clorofilliana";
    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 1,
        caption,
      }),
    ]);

    expect(enriched.atoms[0]?.images[0]?.caption).toBe(caption);
  });

  it("links the nearest page illustration when exact page references do not match", async () => {
    const knowledge = makeKnowledge();
    knowledge.atoms[0] = {
      ...knowledge.atoms[0]!,
      pageReferences: [4],
    };
    const imageId = randomUUID();

    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 2,
        caption: studyCaption("Vicina"),
      }),
    ]);

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(imageId);
  });

  it("distributes remaining illustrations across atoms in chapter order", async () => {
    const knowledge = makeKnowledge(3);
    const firstImageId = randomUUID();
    const secondImageId = randomUUID();
    const thirdImageId = randomUUID();

    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: firstImageId,
        pageNumber: 9,
        caption: studyCaption("Figura 1"),
      }),
      makeImage({
        id: secondImageId,
        pageNumber: 10,
        caption: studyCaption("Figura 2"),
      }),
      makeImage({
        id: thirdImageId,
        pageNumber: 11,
        caption: studyCaption("Figura 3"),
      }),
    ]);

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(firstImageId);
    expect(enriched.atoms[1]?.images[0]?.imageId).toBe(secondImageId);
    expect(enriched.atoms[2]?.images[0]?.imageId).toBe(thirdImageId);
  });

  it("links illustrations by semantic similarity when pages do not match", async () => {
    const knowledge = makeKnowledge();
    knowledge.atoms[0] = {
      ...knowledge.atoms[0]!,
      title: "Fotosintesi clorofilliana",
      summary: "Processo con cui le piante trasformano la luce in energia chimica.",
      keywords: ["fotosintesi", "clorofilla", "piante"],
      pageReferences: [8],
    };

    const imageId = randomUUID();
    const enriched = await enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 2,
        caption: "Schema della fotosintesi clorofilliana nelle piante verdi",
      }),
    ]);

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(imageId);
  });
});
