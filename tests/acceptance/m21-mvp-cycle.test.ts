import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { persistKnowledgeGraph } from "@/ai/persist";
import { registerUser } from "@/auth";
import { createSubjectForUser } from "@/course";
import { findCardsByAtomId } from "@/db/repositories/cards";
import { updateKnowledgeSourceStatus } from "@/db/repositories/knowledge-sources";
import { findUserAtomState } from "@/db/repositories/user-atom-states";
import { CardType, KnowledgeSourceProcessingStatus, SessionEventOutcome } from "@/domain/enums";
import type { AtomId, SubjectId, UserId } from "@/domain/ids";
import { getNextFeedItem } from "@/engine";
import { getReviewQueue } from "@/review";
import { recordCardResponse } from "@/progress";
import { openSession } from "@/session";
import { processChapterUpload } from "@/upload";
import {
  MVP_REQUIRED_CARD_TYPES,
  makeMvpKnowledgeJson,
} from "../helpers/mvp-knowledge";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

describe.skipIf(!hasDatabase)("acceptance/m21-mvp-cycle", () => {
  const prisma = new PrismaClient();
  let userId: UserId;
  let subjectId: SubjectId;
  const testEmail = `mvp.acceptance.${Date.now()}@mentis.test`;

  beforeAll(async () => {
    await prisma.$connect();
    const auth = await registerUser(
      {
        firstName: "MVP",
        lastName: "Acceptance",
        email: testEmail,
        password: "password-sicura-123",
      },
      { userAgent: "vitest", ipAddress: "127.0.0.1" }
    );
    userId = auth.user.id;

    const subject = await createSubjectForUser(userId, {
      name: "Biologia MVP",
      color: "#16A34A",
      icon: "leaf",
    });
    subjectId = subject.id;
  });

  afterAll(async () => {
    if (!hasDatabase) {
      return;
    }

    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("completes the fundamental MVP learning cycle", async () => {
    const upload = await processChapterUpload({
      userId,
      subjectId,
      title: "Fotosintesi",
      language: "it",
      files: [
        {
          buffer: MINIMAL_PNG,
          mimeType: "image/png",
          originalName: "fotosintesi.png",
          sizeBytes: MINIMAL_PNG.length,
        },
      ],
    });

    const knowledge = makeMvpKnowledgeJson({
      imageId: upload.images[0]?.id,
    });

    const persisted = await persistKnowledgeGraph({
      knowledge,
      knowledgeSourceId: upload.knowledgeSource.id,
      subjectId,
    });

    expect(persisted.atomCount).toBe(1);
    expect(persisted.cardCount).toBeGreaterThanOrEqual(6);

    const atomId = knowledge.atoms[0].id as AtomId;
    const cards = await findCardsByAtomId(atomId);
    const cardTypes = cards.map((card) => card.type);

    for (const requiredType of MVP_REQUIRED_CARD_TYPES) {
      if (requiredType === CardType.ImageExplain && !upload.images[0]?.id) {
        continue;
      }
      expect(cardTypes).toContain(requiredType);
    }

    await updateKnowledgeSourceStatus(
      upload.knowledgeSource.id,
      KnowledgeSourceProcessingStatus.Completed,
      new Date()
    );

    const session = await openSession(userId, { subjectId });
    let completedCards = 0;
    let masteryAfter = 0;

    for (let step = 0; step < 12; step++) {
      const feed = await getNextFeedItem({
        userId,
        subjectId,
        sessionId: session.id,
      });

      if (!feed.item) {
        break;
      }

      const response = await recordCardResponse({
        userId,
        sessionId: session.id,
        cardId: feed.item.card.id,
        atomId: feed.item.atomId,
        outcome:
          feed.item.card.type === CardType.Quiz
            ? SessionEventOutcome.Success
            : SessionEventOutcome.Neutral,
        isCorrect: feed.item.card.type === CardType.Quiz ? true : undefined,
        feedPosition: feed.item.position,
        responseTimeMs: 1_500,
        durationMs: 2_000,
      });

      masteryAfter = response.masteryAfter;
      completedCards += 1;
    }

    expect(completedCards).toBeGreaterThan(0);
    expect(masteryAfter).toBeGreaterThan(0);

    const atomState = await findUserAtomState(userId, atomId);
    expect(atomState?.exposureCount).toBeGreaterThan(0);

    const reviewQueue = await getReviewQueue({
      userId,
      subjectId,
      syncBeforeRead: true,
    });

    expect(reviewQueue.items.length).toBeGreaterThan(0);
    expect(reviewQueue.items.some((item) => item.atomId === atomId)).toBe(true);
  });
});
