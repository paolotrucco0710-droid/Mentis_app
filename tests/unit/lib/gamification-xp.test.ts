import { describe, expect, it } from "vitest";
import { computeDailyXp } from "@/lib/gamification/xp";

describe("gamification/xp", () => {
  it("combines cards and mastered atoms into daily XP", () => {
    expect(
      computeDailyXp({
        studyTimeMs: 600_000,
        cardsCompleted: 8,
        atomsCompleted: 2,
        reviewsCompleted: 0,
        accuracy: 80,
        averageMastery: 40,
        dailyGoalMinutes: 30,
        dailyGoalProgressPercent: 50,
      })
    ).toBe(130);
  });
});
