import { enrichKnowledgeWithImages } from "@/ai/enrich-images";
import { findAtomsByKnowledgeSourceId } from "@/db/repositories/atoms";
import { findCardsByAtomIds } from "@/db/repositories/cards";
import { findImagesByKnowledgeSourceId } from "@/db/repositories/uploads";
import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson, KnowledgeJsonAtomImage } from "@/domain/knowledge";
import type { AtomId, KnowledgeSourceId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";

export async function relinkImagesForKnowledgeSource(
  knowledgeSourceId: KnowledgeSourceId
): Promise<{ atomsUpdated: number; cardsCreated: number }> {
  const images = await findImagesByKnowledgeSourceId(knowledgeSourceId);
  if (images.length === 0) {
    return { atomsUpdated: 0, cardsCreated: 0 };
  }

  const atoms = await findAtomsByKnowledgeSourceId(knowledgeSourceId);
  if (atoms.length === 0) {
    return { atomsUpdated: 0, cardsCreated: 0 };
  }

  const existingCards = await findCardsByAtomIds(atoms.map((atom) => atom.id));
  const hasImageCards = existingCards.some(
    (card) => card.type === CardType.ImageExplain
  );
  const hasLinkedImages = atoms.some((atom) => atom.images[0]?.imageId);

  if (hasImageCards && hasLinkedImages) {
    return { atomsUpdated: 0, cardsCreated: 0 };
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

  for (const atom of enriched.atoms) {
    const original = atoms.find((entry) => entry.id === atom.id);
    const imageReference = atom.images[0];
    if (!imageReference?.imageId) {
      continue;
    }

    const previousImageId = original?.images[0]?.imageId;
    if (previousImageId !== imageReference.imageId) {
      await prisma.atom.update({
        where: { id: atom.id },
        data: {
          images: atom.images as unknown as Prisma.InputJsonValue,
        },
      });
      atomsUpdated += 1;
    }

    const hasCard = existingCards.some(
      (card) =>
        card.atomId === atom.id && card.type === CardType.ImageExplain
    );

    if (!hasCard) {
      await prisma.card.create({
        data: {
          atomId: atom.id as AtomId,
          type: CardType.ImageExplain,
          order: 6,
          cognitiveObjective: CognitiveObjective.Comprehension,
          prompt: imageReference.caption ?? `Concetto visivo: ${atom.title}`,
          text: imageReference.description ?? atom.summary,
          explanation: atom.explanation,
          correctFeedback: "Ottima osservazione.",
          estimatedDurationSeconds: 40,
          payload: {
            imageId: imageReference.imageId,
          } as Prisma.InputJsonValue,
          aiVersion: env.aiPromptVersion,
        },
      });
      cardsCreated += 1;
    }
  }

  return { atomsUpdated, cardsCreated };
}
