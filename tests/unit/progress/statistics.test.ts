import { describe, expect, it } from "vitest";
import {
  buildDailyStatisticsUpdate,
  computeDailyStreak,
  previousDay,
  startOfDay,
} from "@/progress/statistics";

describe("progress/statistics", () => {
  it("accumulates daily study metrics", () => {
    const updated = buildDailyStatisticsUpdate(
      null,
      {
        studyTimeMs: 120_000,
        cardsCompleted: 1,
        atomsCompleted: 0,
        reviewsCompleted: 0,
        wasCorrect: true,
        masteryAfter: 55,
      },
      1
    );

    expect(updated.studyTimeMs).toBe(120_000);
    expect(updated.cardsCompleted).toBe(1);
    expect(updated.accuracy).toBe(100);
    expect(updated.dailyStreak).toBe(1);
  });

  it("computes running accuracy across multiple cards", () => {
    const first = buildDailyStatisticsUpdate(
      null,
      {
        studyTimeMs: 60_000,
        cardsCompleted: 1,
        atomsCompleted: 0,
        reviewsCompleted: 0,
        wasCorrect: true,
        masteryAfter: 50,
      },
      1
    );

    const second = buildDailyStatisticsUpdate(
      {
        userId: "user" as never,
        date: "2026-07-31",
        studyTimeMs: first.studyTimeMs,
        cardsCompleted: first.cardsCompleted,
        atomsCompleted: first.atomsCompleted,
        reviewsCompleted: first.reviewsCompleted,
        accuracy: first.accuracy,
        averageFocus: null,
        averageMastery: first.averageMastery,
        dailyStreak: first.dailyStreak,
        activityLevel: first.activityLevel,
      },
      {
        studyTimeMs: 60_000,
        cardsCompleted: 1,
        atomsCompleted: 0,
        reviewsCompleted: 0,
        wasCorrect: false,
        masteryAfter: 45,
      },
      1
    );

    expect(second.cardsCompleted).toBe(2);
    expect(second.accuracy).toBe(50);
  });

  it("extends streak when studying on consecutive days", () => {
    const yesterday = {
      userId: "user" as never,
      date: "2026-07-30",
      studyTimeMs: 60_000,
      cardsCompleted: 3,
      atomsCompleted: 0,
      reviewsCompleted: 0,
      accuracy: 80,
      averageFocus: null,
      averageMastery: 50,
      dailyStreak: 2,
      activityLevel: 3,
    };

    expect(computeDailyStreak(null, true, yesterday)).toBe(3);
  });

  it("normalizes dates to UTC day boundaries", () => {
    const date = new Date("2026-07-31T15:45:00.000Z");
    expect(startOfDay(date).toISOString()).toBe("2026-07-31T00:00:00.000Z");
    expect(previousDay(date).toISOString()).toBe("2026-07-30T00:00:00.000Z");
  });
});
