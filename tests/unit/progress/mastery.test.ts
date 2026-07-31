import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { SessionEventOutcome } from "@/domain/enums";
import {
  applyMasteryUpdate,
  computeMasteryUpdate,
  computeReviewOutcomePatch,
} from "@/progress/mastery";
import { makeCard, makeUserAtomState } from "../../helpers/fixtures";

describe("progress/mastery", () => {
  it("increases mastery on correct quiz answers", () => {
    const atomState = makeUserAtomState({ mastery: 40 });
    const card = makeCard({ type: CardType.Quiz });
    const update = computeMasteryUpdate({
      card,
      atomState,
      outcome: SessionEventOutcome.Success,
      isCorrect: true,
      responseTimeMs: 3000,
    });

    const patched = applyMasteryUpdate(atomState, update);
    expect(patched.mastery).toBeGreaterThan(atomState.mastery);
    expect(update.wasCorrect).toBe(true);
  });

  it("does not change mastery on skipped cards", () => {
    const atomState = makeUserAtomState({ mastery: 40 });
    const update = computeMasteryUpdate({
      card: makeCard(),
      atomState,
      outcome: SessionEventOutcome.Skipped,
    });

    const patched = applyMasteryUpdate(atomState, update);
    expect(patched.mastery).toBe(atomState.mastery);
    expect(update.wasSkipped).toBe(true);
  });

  it("reduces mastery after incorrect answers", () => {
    const atomState = makeUserAtomState({ mastery: 40 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Quiz }),
      atomState,
      outcome: SessionEventOutcome.Failure,
      isCorrect: false,
    });

    const patched = applyMasteryUpdate(atomState, update);
    expect(patched.mastery).toBeLessThan(atomState.mastery);
    expect(patched.streak).toBe(0);
  });

  it("boosts mastery after successful review completion", () => {
    const atomState = makeUserAtomState({ mastery: 70 });
    const patched = computeReviewOutcomePatch(atomState, true);
    expect(patched.mastery).toBeGreaterThan(atomState.mastery);
  });
});
