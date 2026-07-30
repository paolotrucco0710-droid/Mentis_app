import type { DailyStatistics } from "@/domain/entities";

export interface DailyStatisticsDelta {
  studyTimeMs: number;
  cardsCompleted: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  wasCorrect: boolean;
  masteryAfter: number;
}

export function buildDailyStatisticsUpdate(
  existing: DailyStatistics | null,
  delta: DailyStatisticsDelta,
  streak: number
): {
  studyTimeMs: number;
  cardsCompleted: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  accuracy: number;
  averageMastery: number;
  dailyStreak: number;
  activityLevel: number;
} {
  const cardsCompleted = (existing?.cardsCompleted ?? 0) + delta.cardsCompleted;
  const correctCards =
    (existing?.accuracy ?? 0) * (existing?.cardsCompleted ?? 0) / 100 +
    (delta.wasCorrect ? 1 : 0);
  const accuracy =
    cardsCompleted > 0 ? Math.round((correctCards / cardsCompleted) * 100) : 0;

  const previousAverage = existing?.averageMastery ?? delta.masteryAfter;
  const previousCount = existing?.cardsCompleted ?? 0;
  const averageMastery = Math.round(
    (previousAverage * previousCount + delta.masteryAfter) /
      Math.max(previousCount + 1, 1)
  );

  return {
    studyTimeMs: (existing?.studyTimeMs ?? 0) + delta.studyTimeMs,
    cardsCompleted,
    atomsCompleted: (existing?.atomsCompleted ?? 0) + delta.atomsCompleted,
    reviewsCompleted: (existing?.reviewsCompleted ?? 0) + delta.reviewsCompleted,
    accuracy,
    averageMastery,
    dailyStreak: streak,
    activityLevel: Math.min(cardsCompleted, 100),
  };
}

export function computeDailyStreak(
  existing: DailyStatistics | null,
  studiedToday: boolean,
  yesterday: DailyStatistics | null
): number {
  if (!studiedToday) {
    return existing?.dailyStreak ?? 0;
  }

  if (existing && existing.cardsCompleted > 0) {
    return existing.dailyStreak;
  }

  if (yesterday && yesterday.cardsCompleted > 0) {
    return yesterday.dailyStreak + 1;
  }

  return 1;
}

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function previousDay(date: Date): Date {
  const previous = new Date(date);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return startOfDay(previous);
}
