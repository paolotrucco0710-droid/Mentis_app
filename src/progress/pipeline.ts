import { findAtomById, findAtomsBySubjectId } from "@/db/repositories/atoms";
import { findCardById } from "@/db/repositories/cards";
import { upsertDailyStatistics } from "@/db/repositories/daily-statistics";
import { createSessionEvent } from "@/db/repositories/session-events";
import { recordSessionAnswer } from "@/db/repositories/study-sessions";
import { assertSessionReadyForStudy } from "@/session";
import {
  findUserAtomState,
  findUserAtomStatesByUserId,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import {
  findUserCardState,
  upsertUserCardState,
} from "@/db/repositories/user-card-states";
import { findDailyStatistics } from "@/db/repositories/notifications";
import type { Progress } from "@/domain/entities/progress";
import { ProgressScopeType } from "@/domain/entities/progress";
import { SessionEventOutcome, SessionEventType } from "@/domain/enums";
import { UserAtomLearningState } from "@/domain/enums";
import type { SubjectId, UserId } from "@/domain/ids";
import { estimateNextReviewAt } from "@/engine/scheduler";
import { MASTERY_STABLE_THRESHOLD } from "@/engine/constants";
import { getProgress } from "./aggregation";
import { ProgressEngineError } from "./errors";
import { applyMasteryUpdate, computeMasteryUpdate } from "./mastery";
import {
  buildDailyStatisticsUpdate,
  computeDailyStreak,
  previousDay,
  startOfDay,
} from "./statistics";
import type { RecordCardResponseInput, RecordCardResponseResult } from "./types";
import { unlockDependentAtoms } from "./unlock";

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

  const atomState = await upsertUserAtomState({
    userId: input.userId,
    atomId: input.atomId,
    ...atomPatch,
    lastViewedAt: now,
    nextReviewAt,
    averageResponseTimeMs: mergeAverageResponseTime(
      existingAtomState.averageResponseTimeMs,
      input.responseTimeMs
    ),
    totalStudyTimeMs:
      existingAtomState.totalStudyTimeMs + (input.durationMs ?? 0),
    lastAlgorithmUsed: "progress-v1",
  });

  const existingCardState = await findUserCardState(input.userId, input.cardId);
  const cardState = await upsertUserCardState({
    userId: input.userId,
    cardId: input.cardId,
    viewCount: (existingCardState?.viewCount ?? 0) + 1,
    correctAnswerCount:
      (existingCardState?.correctAnswerCount ?? 0) +
      (masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped ? 1 : 0),
    wrongAnswerCount:
      (existingCardState?.wrongAnswerCount ?? 0) +
      (!masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped ? 1 : 0),
    averageResponseTimeMs: mergeAverageResponseTime(
      existingCardState?.averageResponseTimeMs ?? null,
      input.responseTimeMs
    ),
    lastAnsweredAt: now,
    skipped: masteryUpdate.wasSkipped,
  });

  const sessionEvent = await createSessionEvent({
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
  });

  await recordSessionAnswer({
    id: input.sessionId,
    wasCorrect: masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped,
    wasReview:
      existingAtomState.currentStage === UserAtomLearningState.Review,
    atomMastered: atomState.mastery >= MASTERY_STABLE_THRESHOLD,
  });

  await updateDailyStatistics({
    userId: input.userId,
    now,
    durationMs: input.durationMs ?? 0,
    wasCorrect: masteryUpdate.wasCorrect && !masteryUpdate.wasSkipped,
    masteryAfter: atomState.mastery,
    wasReview:
      existingAtomState.currentStage === UserAtomLearningState.Review,
    atomMastered:
      masteryBefore < MASTERY_STABLE_THRESHOLD &&
      atomState.mastery >= MASTERY_STABLE_THRESHOLD,
  });

  const subjectAtoms = await findAtomsBySubjectId(atom.subjectId);
  const allStates = await findUserAtomStatesByUserId(input.userId);
  const userAtomStates = new Map(allStates.map((state) => [state.atomId, state]));
  userAtomStates.set(atomState.atomId, atomState);
  const unlockedAtomIds = await unlockDependentAtoms({
    userId: input.userId,
    atoms: subjectAtoms,
    userAtomStates,
  });

  let subjectProgress: Progress | null = null;
  if (session.subjectId) {
    subjectProgress = await getProgress({
      userId: input.userId,
      scopeType: ProgressScopeType.Subject,
      scopeId: session.subjectId,
    });
  } else {
    subjectProgress = await getProgress({
      userId: input.userId,
      scopeType: ProgressScopeType.Subject,
      scopeId: atom.subjectId as SubjectId,
    });
  }

  return {
    sessionEventId: sessionEvent.id,
    atomState,
    cardState,
    masteryBefore,
    masteryAfter: atomState.mastery,
    masteryDelta: atomState.mastery - masteryBefore,
    unlockedAtomIds,
    subjectProgress,
  };
}

async function updateDailyStatistics(input: {
  userId: UserId;
  now: Date;
  durationMs: number;
  wasCorrect: boolean;
  masteryAfter: number;
  wasReview: boolean;
  atomMastered: boolean;
}): Promise<void> {
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

  await upsertDailyStatistics({
    userId: input.userId,
    date: today,
    ...update,
  });
}

function mergeAverageResponseTime(
  current: number | null,
  responseTimeMs?: number
): number | null {
  if (responseTimeMs === undefined) {
    return current;
  }

  if (current === null) {
    return responseTimeMs;
  }

  return Math.round((current + responseTimeMs) / 2);
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
