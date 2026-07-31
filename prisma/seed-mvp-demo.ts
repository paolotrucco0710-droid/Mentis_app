import { PrismaClient } from "@prisma/client";
import { persistKnowledgeGraph } from "../src/ai/persist";
import { findOrCreateDefaultCourse } from "../src/course/helpers";
import {
  KnowledgeSourceProcessingStatus,
  KnowledgeSourceType,
} from "../src/domain/enums";
import type { KnowledgeJson } from "../src/domain/knowledge";
import type { KnowledgeSourceId, SubjectId, UserId } from "../src/domain/ids";
import { getStorageProvider } from "../src/storage";
import {
  MVP_ATOM_ID,
  MVP_DEMO_KNOWLEDGE_SOURCE_ID,
  makeMvpKnowledgeJson,
} from "../tests/helpers/mvp-knowledge";

const MVP_DEMO_IMAGE_ID = "00000000-0000-4000-8000-000000000301";
const MVP_DEMO_CHAPTER_ID = "00000000-0000-4000-8000-000000000401";

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export async function seedMvpDemo(
  prisma: PrismaClient,
  userId: UserId,
  subjectId: SubjectId
): Promise<void> {
  const existingAtoms = await prisma.atom.count({
    where: { id: MVP_ATOM_ID },
  });

  if (existingAtoms > 0) {
    return;
  }

  const storage = getStorageProvider();
  const storageKey = `mvp-demo/${MVP_DEMO_KNOWLEDGE_SOURCE_ID}/page-1.png`;
  const stored = await storage.save(storageKey, MINIMAL_PNG, "image/png");

  await prisma.knowledgeSource.upsert({
    where: { id: MVP_DEMO_KNOWLEDGE_SOURCE_ID },
    update: {},
    create: {
      id: MVP_DEMO_KNOWLEDGE_SOURCE_ID,
      userId,
      subjectId,
      title: "Capitolo demo MVP",
      sourceType: KnowledgeSourceType.Photograph,
      pageCount: 1,
      language: "it",
      fileSizeBytes: BigInt(MINIMAL_PNG.length),
      fileHash: stored.hash,
      processingStatus: KnowledgeSourceProcessingStatus.Uploaded,
    },
  });

  await prisma.image.upsert({
    where: { id: MVP_DEMO_IMAGE_ID },
    update: {},
    create: {
      id: MVP_DEMO_IMAGE_ID,
      knowledgeSourceId: MVP_DEMO_KNOWLEDGE_SOURCE_ID,
      ownerId: userId,
      storageKey: stored.storageKey,
      hash: stored.hash,
      mimeType: stored.mimeType,
      sizeBytes: BigInt(stored.sizeBytes),
      width: 1,
      height: 1,
      pageNumber: 1,
      caption: "Schema demo MVP",
    },
  });

  const course = await findOrCreateDefaultCourse(userId, subjectId);

  await prisma.chapter.upsert({
    where: { id: MVP_DEMO_CHAPTER_ID },
    update: {
      atomCount: 1,
    },
    create: {
      id: MVP_DEMO_CHAPTER_ID,
      courseId: course.id,
      subjectId,
      knowledgeSourceId: MVP_DEMO_KNOWLEDGE_SOURCE_ID,
      title: "Capitolo demo MVP",
      chapterNumber: 1,
      displayOrder: 0,
      atomCount: 1,
    },
  });

  const knowledge = makeMvpKnowledgeJson({
    imageId: MVP_DEMO_IMAGE_ID,
    atomId: MVP_ATOM_ID,
  }) as KnowledgeJson;

  const { atomCount, cardCount } = await persistKnowledgeGraph({
    knowledge,
    knowledgeSourceId: MVP_DEMO_KNOWLEDGE_SOURCE_ID as KnowledgeSourceId,
    subjectId,
  });

  await prisma.knowledgeSource.update({
    where: { id: MVP_DEMO_KNOWLEDGE_SOURCE_ID },
    data: {
      processingStatus: KnowledgeSourceProcessingStatus.Completed,
      processedAt: new Date(),
    },
  });

  await prisma.chapter.update({
    where: { id: MVP_DEMO_CHAPTER_ID },
    data: { atomCount },
  });

  console.log(
    `MVP demo seed: ${atomCount} atomi, ${cardCount} card nel capitolo demo.`
  );
}
