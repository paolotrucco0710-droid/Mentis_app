import type { SessionEvent, StudySession } from "@/domain/entities";
import { SessionEventType } from "@/domain/enums";
import type { SessionMetrics } from "./types";

export function computeSessionMetrics(input: {
  session: StudySession;
  events: SessionEvent[];
  endedAt?: Date | null;
}): SessionMetrics {
  const { session, events } = input;
  const endedAt = input.endedAt ?? session.endedAt ?? new Date();
  const activeDurationMs = computeActiveDurationMs(
    session.startedAt,
    endedAt,
    events
  );

  const totalAnswers = session.correctAnswerCount + session.errorCount;
  const accuracy =
    totalAnswers > 0
      ? Math.round((session.correctAnswerCount / totalAnswers) * 100)
      : 0;

  const pauseStats = computePauseStats(events, endedAt);
  const cardsPerMinute =
    activeDurationMs > 0
      ? Math.round((session.cardsViewed / activeDurationMs) * 60_000 * 10) / 10
      : 0;

  const focusScore = computeFocusScore({
    events,
    accuracy,
    pauseCount: pauseStats.pauseCount,
    cardsViewed: session.cardsViewed,
  });

  const fatigueScore = computeFatigueScore({
    activeDurationMs,
    errorCount: session.errorCount,
    cardsViewed: session.cardsViewed,
    pauseCount: pauseStats.pauseCount,
  });

  return {
    accuracy: accuracy as SessionMetrics["accuracy"],
    activeDurationMs,
    pauseCount: pauseStats.pauseCount,
    totalPauseMs: pauseStats.totalPauseMs,
    cardsPerMinute,
    focusScore: focusScore as SessionMetrics["focusScore"],
    fatigueScore: fatigueScore as SessionMetrics["fatigueScore"],
  };
}

function computeActiveDurationMs(
  startedAt: Date,
  endedAt: Date,
  events: SessionEvent[]
): number {
  const totalMs = Math.max(endedAt.getTime() - startedAt.getTime(), 0);
  return Math.max(totalMs - computePauseStats(events, endedAt).totalPauseMs, 0);
}

function computePauseStats(events: SessionEvent[], limit: Date): {
  pauseCount: number;
  totalPauseMs: number;
} {
  let pauseCount = 0;
  let totalPauseMs = 0;
  let pauseStartedAt: Date | null = null;

  for (const event of events) {
    if (event.timestamp > limit) {
      break;
    }

    if (event.type === SessionEventType.Pause) {
      pauseCount += 1;
      pauseStartedAt = event.timestamp;
      continue;
    }

    if (event.type === SessionEventType.Resume && pauseStartedAt) {
      totalPauseMs += Math.max(
        event.timestamp.getTime() - pauseStartedAt.getTime(),
        0
      );
      pauseStartedAt = null;
    }
  }

  if (pauseStartedAt) {
    totalPauseMs += Math.max(limit.getTime() - pauseStartedAt.getTime(), 0);
  }

  return { pauseCount, totalPauseMs };
}

function computeFocusScore(input: {
  events: SessionEvent[];
  accuracy: number;
  pauseCount: number;
  cardsViewed: number;
}): number {
  const responseTimes = input.events
    .map((event) => event.responseTimeMs)
    .filter((value): value is number => value !== null && value > 0);

  let score = 50 + input.accuracy * 0.35;

  if (responseTimes.length > 0) {
    const average =
      responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length;
    if (average <= 5_000) {
      score += 15;
    } else if (average >= 20_000) {
      score -= 10;
    }
  }

  score -= Math.min(input.pauseCount * 4, 20);

  if (input.cardsViewed >= 5) {
    score += 5;
  }

  return clamp(Math.round(score), 0, 100);
}

function computeFatigueScore(input: {
  activeDurationMs: number;
  errorCount: number;
  cardsViewed: number;
  pauseCount: number;
}): number {
  const minutes = input.activeDurationMs / 60_000;
  let score = Math.min(minutes * 4, 35);

  if (input.cardsViewed > 0) {
    score += (input.errorCount / input.cardsViewed) * 40;
  }

  score += Math.min(input.pauseCount * 6, 18);

  return clamp(Math.round(score), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
