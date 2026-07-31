import { describe, expect, it } from "vitest";
import { computeOverdueHours, computeReviewPriority } from "@/review/priority";
import { makeAtom, makeUserAtomState } from "../../helpers/fixtures";

describe("review/priority", () => {
  it("increases priority for overdue reviews", () => {
    const now = new Date("2026-07-31T12:00:00.000Z");
    const overdue = makeUserAtomState({
      nextReviewAt: new Date("2026-07-30T12:00:00.000Z"),
      mastery: 50,
    });
    const upcoming = makeUserAtomState({
      nextReviewAt: new Date("2026-08-01T12:00:00.000Z"),
      mastery: 50,
    });

    const overduePriority = computeReviewPriority({
      atom: makeAtom(),
      state: overdue,
      now,
      scheduledAt: overdue.nextReviewAt!,
    });
    const upcomingPriority = computeReviewPriority({
      atom: makeAtom(),
      state: upcoming,
      now,
      scheduledAt: upcoming.nextReviewAt!,
    });

    expect(overduePriority).toBeGreaterThan(upcomingPriority);
  });

  it("computes overdue hours for past review dates", () => {
    const now = new Date("2026-07-31T12:00:00.000Z");
    const hours = computeOverdueHours(
      new Date("2026-07-30T00:00:00.000Z"),
      now
    );
    expect(hours).toBeGreaterThan(30);
  });
});
