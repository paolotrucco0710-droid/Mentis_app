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
}): Image {
  return {
    id: input.id as ImageId,
    knowledgeSourceId: "00000000-0000-4000-8000-000000000201" as KnowledgeSourceId,
    ownerId: "00000000-0000-4000-8000-000000000001" as UserId,
    storageKey: `images/${input.id}.png`,
    hash: "hash",
    mimeType: "image/png",
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

describe("enrichKnowledgeWithImages", () => {
  it("returns knowledge unchanged when no images were uploaded", () => {
    const knowledge = makeKnowledge();
    const enriched = enrichKnowledgeWithImages(knowledge, []);

    expect(enriched).toEqual(knowledge);
  });

  it("links an image to the atom on the same page", () => {
    const knowledge = makeKnowledge();
    const imageId = randomUUID();
    const images = [makeImage({ id: imageId, pageNumber: 1 })];

    const enriched = enrichKnowledgeWithImages(knowledge, images);

    expect(enriched.atoms[0]?.images).toEqual([
      {
        imageId,
        caption: "Figura: Concetto 1",
        description: knowledge.atoms[0]?.summary,
        referencedConcepts: knowledge.atoms[0]?.keywords.slice(0, 4),
      },
    ]);
  });

  it("assigns page-specific images to matching atoms", () => {
    const knowledge = makeKnowledge(2);
    const firstImageId = randomUUID();
    const secondImageId = randomUUID();
    const images = [
      makeImage({ id: firstImageId, pageNumber: 1 }),
      makeImage({ id: secondImageId, pageNumber: 2 }),
    ];

    const enriched = enrichKnowledgeWithImages(knowledge, images);

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(firstImageId);
    expect(enriched.atoms[1]?.images[0]?.imageId).toBe(secondImageId);
  });

  it("preserves valid image references already present in the knowledge JSON", () => {
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
    const enriched = enrichKnowledgeWithImages(
      knowledge,
      [makeImage({ id: preservedImageId }), makeImage({ id: otherImageId })]
    );

    expect(enriched.atoms[0]?.images).toEqual(knowledge.atoms[0]?.images);
  });

  it("falls back to the first atom when a single image cannot be page-matched", () => {
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
    const enriched = enrichKnowledgeWithImages(
      knowledge,
      [makeImage({ id: imageId, pageNumber: 1 })]
    );

    expect(enriched.atoms[0]?.images[0]?.imageId).toBe(imageId);
    expect(enriched.atoms[1]?.images).toEqual([]);
  });

  it("uses the uploaded filename as caption when available", () => {
    const knowledge = makeKnowledge();
    const imageId = randomUUID();
    const enriched = enrichKnowledgeWithImages(knowledge, [
      makeImage({
        id: imageId,
        pageNumber: 1,
        caption: "schema-fotosintesi.png",
      }),
    ]);

    expect(enriched.atoms[0]?.images[0]?.caption).toBe("schema-fotosintesi.png");
  });
});
