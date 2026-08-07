import {
  AnalyticsEvents,
  trackAnalyticsEvent,
  trackFunnelMilestoneAsync,
} from "@/analytics";
import { findAtomById } from "@/db/repositories/atoms";
import { findCardById } from "@/db/repositories/cards";
import { upsertDailyStatistics } from "@/db/repositories/daily-statistics";
import { createSessionEvent } from "@/db/repositories/session-events";
import { recordSessionAnswer } from "@/db/repositories/study-sessions";
import { prisma } from "@/db/client";
import type { DbTx } from "@/db/transaction";
import { PROGRESS_TRANSACTION_OPTIONS } from "@/db/transaction-options";
import { assertSessionReadyForStudy } from "@/session";
import {
  findUserAtomState,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import {
  findUserCardState,
  upsertUserCardState,
} from "@/db/repositories/user-card-states";
import { findDailyStatistics } from "@/db/repositories/daily-statistics";
import type { SubjectId, UserId } from "@/domain/ids";
import { SessionEventOutcome, SessionEventType, UserAtomLearningState } from "@/domain/enums";
import { getNextFeedItem } from "@/engine/feed-engine";
import { estimateNextReviewAt } from "@/engine/scheduler";
import { MASTERY_STABLE_THRESHOLD } from "@/engine/constants";
import { scheduleReviewForAtom } from "@/review";
import { mergeRunningAverage } from "@/lib/math";
import { ProgressEngineError } from "./errors";
import { applyMasteryUpdate, computeMasteryUpdate } from "./mastery";
import {
  buildDailyStatisticsUpdate,
  computeDailyStreak,
  previousDay,
  startOfDay,
} from "./statistics";
import type { RecordCardResponseInput, RecordCardResponseResult } from "./types";
import { unlockAtomsUnlockedByPrerequisite } from "./unlock";

export async function recordCardResponse(
  input: RecordCardResponseInput
): Promise<RecordCardResponseResult> {
  const session = await assertSessionReadyForStudy(
    input.userId,
    input.sessionId
  );

  const [card, atom] = await Promise.all([
    findCardById(input.cardId),
    findAtomById(input.atomId),
  ]);

  if (!card || card.id !== input.cardId) {
    throw new ProgressEngineError("Card non trovata.", "CARD_NOT_FOUND", 404);
  }

  if (!atom || atom.id !== input.atomId || card.atomId !== atom.id) {
    throw new ProgressEngineError("Atom non trovato.", "ATOM_NOT_FOUND", 404);
  }

  if (!session.subjectId || atom.subjectId !== session.subjectId) {
    throw new ProgressEngineError(
      "Il contenuto non appartiene alla sessione di studio.",
      "CONTENT_SESSION_MISMATCH",
      409
    );
  }

  const now = new Date();
  const existingAtomState =
    (await findUserAtomState(input.userId, input.atomId)) ??
    (await upsertUserAtomState({
      userId: input.userId,
      atomId: input.atomId,
      currentStage: UserAtomLearningState.Available,
    }));

  const masteryBefore = existingAtomState.mastery;
  const masteryUpdate = computeMasteryUpdate({
    card,
    atomState: existingAtomState,
    outcome: input.outcome,
    isCorrect: input.isCorrect,
    responseTimeMs: input.responseTimeMs,
  });

  const atomPatch = applyMasteryUpdate(existingAtomState, masteryUpdate);
  const nextReviewAt = estimateNextReviewAt(
    {
      ...existingAtomState,
      ...atomPatch,
      lastViewedAt: now,
    },
    now
  );

  const wasCorrect = masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped;
  const wasReview =
    existingAtomState.currentStage === UserAtomLearningState.Review;
  const atomMastered =
    masteryBefore < MASTERY_STABLE_THRESHOLD &&
    atomPatch.mastery >= MASTERY_STABLE_THRESHOLD;

  const {
    atomState,
    cardState,
    sessionEvent,
    updatedSession,
  } = await prisma.$transaction(async (tx) => {
    const atomState = await upsertUserAtomState(
      {
        userId: input.userId,
        atomId: input.atomId,
        ...atomPatch,
        lastViewedAt: now,
        nextReviewAt,
        averageResponseTimeMs: mergeRunningAverage(
          existingAtomState.averageResponseTimeMs,
          existingAtomState.exposureCount,
          input.responseTimeMs
        ),
        totalStudyTimeMs:
          existingAtomState.totalStudyTimeMs + (input.durationMs ?? 0),
        lastAlgorithmUsed: "progress-v1",
      },
      tx
    );

    const existingCardState = await findUserCardState(
      input.userId,
      input.cardId,
      tx
    );
    const cardState = await upsertUserCardState(
      {
        userId: input.userId,
        cardId: input.cardId,
        viewCount: (existingCardState?.viewCount ?? 0) + 1,
        correctAnswerCount:
          (existingCardState?.correctAnswerCount ?? 0) +
          (masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped ? 1 : 0),
        wrongAnswerCount:
          (existingCardState?.wrongAnswerCount ?? 0) +
          (!masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped ? 1 : 0),
        averageResponseTimeMs: mergeRunningAverage(
          existingCardState?.averageResponseTimeMs ?? null,
          existingCardState?.viewCount ?? 0,
          input.responseTimeMs
        ),
        lastAnsweredAt: now,
        skipped: masteryUpdate.wasSkipped,
      },
      tx
    );

    const sessionEvent = await createSessionEvent(
      {
        sessionId: input.sessionId,
        type: resolveSessionEventType(input.outcome, masteryUpdate.wasCorrect),
        atomId: input.atomId,
        cardId: input.cardId,
        durationMs: input.durationMs ?? null,
        outcome: input.outcome,
        declaredConfidence: input.declaredConfidence ?? null,
        responseTimeMs: input.responseTimeMs ?? null,
        feedPosition: input.feedPosition ?? null,
        timestamp: now,
      },
      tx
    );

    const updatedSession = await recordSessionAnswer(
      {
        id: input.sessionId,
        wasCorrect,
        wasReview,
        atomMastered: atomState.mastery >= MASTERY_STABLE_THRESHOLD,
      },
      tx
    );

    await updateDailyStatistics(
      {
        userId: input.userId,
        now,
        durationMs: input.durationMs ?? 0,
        wasCorrect,
        masteryAfter: atomState.mastery,
        wasReview,
        atomMastered,
      },
      tx
    );

    return {
      atomState,
      cardState,
      sessionEvent,
      updatedSession,
    };
  }, PROGRESS_TRANSACTION_OPTIONS);

  const unlockedAtomIds = await unlockAtomsUnlockedByPrerequisite({
    userId: input.userId,
    prerequisiteAtomId: input.atomId,
  });

  await scheduleReviewForAtom({
    userId: input.userId,
    atomId: input.atomId,
    atomState,
    now,
  });

  void trackAnalyticsEvent({
    userId: input.userId,
    name: AnalyticsEvents.StudyCardAnswered,
    category: "learning",
    source: "engine",
    properties: {
      sessionId: input.sessionId,
      cardId: input.cardId,
      atomId: input.atomId,
      outcome: input.outcome,
      isCorrect: input.isCorrect,
      masteryDelta: atomState.mastery - masteryBefore,
    },
  });
  void trackFunnelMilestoneAsync({
    userId: input.userId,
    name: AnalyticsEvents.FunnelFirstCardAnswered,
    category: "funnel",
    source: "engine",
    properties: { cardId: input.cardId },
  });

  const result: RecordCardResponseResult = {
    sessionEventId: sessionEvent.id,
    atomState,
    cardState,
    masteryBefore,
    masteryAfter: atomState.mastery,
    masteryDelta: atomState.mastery - masteryBefore,
    unlockedAtomIds,
    subjectProgress: null,
  };

  if (input.includeNextFeed && updatedSession.subjectId) {
    result.nextFeed = await getNextFeedItem({
      userId: input.userId,
      subjectId: updatedSession.subjectId as SubjectId,
      sessionId: input.sessionId,
      session: updatedSession,
      ...(input.knowledgeSourceId
        ? { knowledgeSourceId: input.knowledgeSourceId }
        : {}),
    });
  }

  return result;
}

async function updateDailyStatistics(
  input: {
    userId: UserId;
    now: Date;
    durationMs: number;
    wasCorrect: boolean;
    masteryAfter: number;
    wasReview: boolean;
    atomMastered: boolean;
  },
  tx: DbTx
): Promise<void> {
  const today = startOfDay(input.now);
  const yesterday = previousDay(input.now);
  const [existingToday, existingYesterday] = await Promise.all([
    findDailyStatistics(input.userId, today),
    findDailyStatistics(input.userId, yesterday),
  ]);

  const streak = computeDailyStreak(existingToday, true, existingYesterday);
  const update = buildDailyStatisticsUpdate(
    existingToday,
    {
      studyTimeMs: input.durationMs,
      cardsCompleted: 1,
      atomsCompleted: input.atomMastered ? 1 : 0,
      reviewsCompleted: input.wasReview && input.wasCorrect ? 1 : 0,
      wasCorrect: input.wasCorrect,
      masteryAfter: input.masteryAfter,
    },
    streak
  );

  await upsertDailyStatistics(
    {
      userId: input.userId,
      date: today,
      ...update,
    },
    tx
  );
}

function resolveSessionEventType(
  outcome: SessionEventOutcome,
  wasCorrect: boolean
): SessionEventType {
  if (outcome === SessionEventOutcome.Skipped) {
    return SessionEventType.Skip;
  }

  if (wasCorrect) {
    return SessionEventType.CorrectAnswer;
  }

  if (outcome === SessionEventOutcome.Failure) {
    return SessionEventType.WrongAnswer;
  }

  return SessionEventType.CloseCard;
}
