import { describe, expect, it } from "vitest";
import { UserAtomLearningState } from "@/domain/enums";
import { estimateNextReviewAt, isReviewDue } from "@/engine/scheduler";
import { makeUserAtomState } from "../../helpers/fixtures";

describe("engine/scheduler", () => {
  it("returns null when the atom has never been exposed", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const state = makeUserAtomState({ exposureCount: 0 });

    expect(estimateNextReviewAt(state, now)).toBeNull();
  });

  it("schedules a future review for exposed atoms", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const state = makeUserAtomState({
      exposureCount: 3,
      mastery: 60,
      streak: 2,
      estimatedDecay: 0.2,
    });

    const nextReview = estimateNextReviewAt(state, now);
    expect(nextReview).not.toBeNull();
    expect(nextReview!.getTime()).toBeGreaterThan(now.getTime());
  });

  it("detects review due from nextReviewAt", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const due = makeUserAtomState({
      nextReviewAt: new Date("2026-07-30T10:00:00.000Z"),
      currentStage: UserAtomLearningState.Learning,
    });

    expect(isReviewDue(due, now)).toBe(true);
  });

  it("detects review due from review learning stage", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const review = makeUserAtomState({
      nextReviewAt: null,
      currentStage: UserAtomLearningState.Review,
    });

    expect(isReviewDue(review, now)).toBe(true);
  });
});
