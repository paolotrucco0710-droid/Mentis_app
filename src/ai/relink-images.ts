import { enrichKnowledgeWithImages } from "@/ai/enrich-images";
import {
  extractFiguresFromPageImages,
  mergeKnowledgeSourceImages,
} from "@/ai/extract-figures";
import { shouldCreateImageExplainCard } from "@/ai/image-study";
import { buildImageExplainCardFields } from "@/ai/image-explain-card-builder";
import { getImageIdFromPayload } from "@/components/feed/card-utils";
import { findAtomsByKnowledgeSourceId } from "@/db/repositories/atoms";
import { findCardsByAtomIds } from "@/db/repositories/cards";
import { findImagesByKnowledgeSourceId } from "@/db/repositories/uploads";
import { CardType } from "@/domain/enums";
import type { KnowledgeJson, KnowledgeJsonAtomImage } from "@/domain/knowledge";
import type { AtomId, ImageId, KnowledgeSourceId, UserId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";
import { UsageTracker } from "@/ai/optimization";

export async function relinkImagesForKnowledgeSource(
  knowledgeSourceId: KnowledgeSourceId,
  options?: { ownerId?: UserId }
): Promise<{ atomsUpdated: number; cardsCreated: number; cardsRemoved: number }> {
  let images = await findImagesByKnowledgeSourceId(knowledgeSourceId);
  const atoms = await findAtomsByKnowledgeSourceId(knowledgeSourceId);
  if (atoms.length === 0) {
    return { atomsUpdated: 0, cardsCreated: 0, cardsRemoved: 0 };
  }

  if (options?.ownerId) {
    const tracker = new UsageTracker();
    const figureImages = await extractFiguresFromPageImages({
      knowledgeSourceId,
      ownerId: options.ownerId,
      pageImages: images,
      existingImages: images,
      tracker,
    });
    images = mergeKnowledgeSourceImages(images, figureImages);
  }

  const imageById = new Map(images.map((image) => [image.id, image]));
  const existingCards = await findCardsByAtomIds(atoms.map((atom) => atom.id));
  let cardsRemoved = 0;

  for (const card of existingCards) {
    if (card.type !== CardType.ImageExplain) {
      continue;
    }

    const imageId = getImageIdFromPayload(card.payload);
    const image = imageId ? imageById.get(imageId as ImageId) : undefined;
    const atom = atoms.find((entry) => entry.id === card.atomId);
    const reference = atom?.images[0];

    if (
      !shouldCreateImageExplainCard(image ?? { caption: reference?.caption ?? null }, reference)
    ) {
      await prisma.card.delete({ where: { id: card.id } });
      cardsRemoved += 1;
    }
  }

  if (images.length === 0) {
    return { atomsUpdated: 0, cardsCreated: 0, cardsRemoved };
  }

  const knowledge: KnowledgeJson = {
    metadata: {
      documentId: knowledgeSourceId,
      title: "",
      subject: "",
      language: "it",
      estimatedReadingTimeMinutes: 0,
      estimatedStudyTimeMinutes: 0,
      chapterNumber: null,
      sourcePages: images.length,
      generatedAt: new Date().toISOString(),
      version: env.knowledgeJsonVersion,
    },
    atoms: atoms.map((atom) => ({
      id: atom.id,
      title: atom.title,
      summary: atom.summary,
      explanation: atom.explanation,
      importance: atom.importance,
      difficulty: atom.difficulty,
      prerequisites: atom.prerequisites,
      learningObjectives: atom.learningObjectives,
      keywords: atom.keywords,
      aliases: atom.aliases,
      formulas: atom.formulas,
      definitions: atom.definitions,
      examples: atom.examples,
      counterExamples: atom.counterExamples,
      commonMistakes: atom.commonMistakes,
      misconceptions: atom.misconceptions,
      applications: atom.applications,
      historicalContext: atom.historicalContext,
      notes: atom.notes,
      images: atom.images as KnowledgeJsonAtomImage[],
      tables: atom.tables,
      diagrams: atom.diagrams,
      equations: atom.equations,
      citations: atom.citations,
      pageReferences: atom.pageReferences,
      confidence: atom.confidence,
    })),
  };

  const enriched = enrichKnowledgeWithImages(knowledge, images);
  let atomsUpdated = 0;
  let cardsCreated = 0;
  const refreshedCards = await findCardsByAtomIds(atoms.map((atom) => atom.id));

  for (const atom of enriched.atoms) {
    const original = atoms.find((entry) => entry.id === atom.id);
    const imageReference = atom.images[0];

    const nextImages = imageReference?.imageId ? [imageReference] : [];
    const previousImageId = original?.images[0]?.imageId;
  const nextImageId = nextImages[0]?.imageId;

    if (previousImageId !== nextImageId) {
      await prisma.atom.update({
        where: { id: atom.id },
        data: {
          images: nextImages as unknown as Prisma.InputJsonValue,
        },
      });
      atomsUpdated += 1;
    }

    if (!imageReference?.imageId) {
      continue;
    }

    const image = imageById.get(imageReference.imageId as ImageId);
    if (
      !shouldCreateImageExplainCard(image ?? { caption: imageReference.caption }, imageReference)
    ) {
      continue;
    }

    const hasCard = refreshedCards.some(
      (card) =>
        card.atomId === atom.id && card.type === CardType.ImageExplain
    );

    if (!hasCard) {
      const imageCard = buildImageExplainCardFields(
        atom.id as AtomId,
        atom,
        imageReference
      );
      await prisma.card.create({
        data: {
          atomId: atom.id as AtomId,
          type: CardType.ImageExplain,
          order: 6,
          ...imageCard,
          aiVersion: env.aiPromptVersion,
        },
      });
      cardsCreated += 1;
    }
  }

  return { atomsUpdated, cardsCreated, cardsRemoved };
}
