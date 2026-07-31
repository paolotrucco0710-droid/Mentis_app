import { describe, expect, it } from "vitest";
import { computeForgetProbability } from "@/engine/decay";
import { makeUserAtomState } from "../../helpers/fixtures";

describe("engine/decay", () => {
  it("returns higher forget probability when mastery is low", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const lowMastery = makeUserAtomState({ mastery: 10 });
    const highMastery = makeUserAtomState({ mastery: 90 });

    expect(computeForgetProbability(lowMastery, now)).toBeGreaterThan(
      computeForgetProbability(highMastery, now)
    );
  });

  it("returns lower forget probability for untouched atoms", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const fresh = makeUserAtomState({
      exposureCount: 0,
      lastViewedAt: null,
      estimatedDecay: 0,
      mastery: 0,
      wrongAnswerCount: 0,
      streak: 0,
    });
    const exposed = makeUserAtomState({
      exposureCount: 5,
      lastViewedAt: new Date("2020-01-01T00:00:00.000Z"),
      estimatedDecay: 0.5,
      mastery: 20,
    });

    expect(computeForgetProbability(fresh, now)).toBeLessThan(
      computeForgetProbability(exposed, now)
    );
  });

  it("clamps probability between 0 and 1", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const extreme = makeUserAtomState({
      mastery: 0,
      estimatedDecay: 1,
      wrongAnswerCount: 99,
      exposureCount: 1,
      streak: 0,
      lastViewedAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    const value = computeForgetProbability(extreme, now);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });
});
