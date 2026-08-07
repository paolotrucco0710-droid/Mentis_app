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

  it("keeps Explain Neutral answers on the passive learning path", () => {
    const atomState = makeUserAtomState({ mastery: 40, streak: 1 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Explain }),
      atomState,
      outcome: SessionEventOutcome.Neutral,
      isCorrect: true,
    });

    expect(update.masteryDelta).toBe(3);
    expect(update.wasCorrect).toBe(true);
    expect(applyMasteryUpdate(atomState, update).mastery).toBe(43);
  });

  it("applies retrieval mastery gains for correct Feynman answers", () => {
    const atomState = makeUserAtomState({ mastery: 40, streak: 1 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Feynman }),
      atomState,
      outcome: SessionEventOutcome.Neutral,
      isCorrect: true,
      responseTimeMs: 10_000,
    });

    expect(update.masteryDelta).toBe(8);
    expect(update.wasCorrect).toBe(true);
    expect(applyMasteryUpdate(atomState, update).mastery).toBe(48);
  });

  it("applies retrieval mastery loss for incorrect Feynman answers", () => {
    const atomState = makeUserAtomState({ mastery: 40, streak: 3 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Feynman }),
      atomState,
      outcome: SessionEventOutcome.Neutral,
      isCorrect: false,
    });

    expect(update.masteryDelta).toBe(-6);
    expect(update.wasCorrect).toBe(false);
    expect(applyMasteryUpdate(atomState, update).mastery).toBe(34);
    expect(applyMasteryUpdate(atomState, update).streak).toBe(0);
  });

  it("does not treat Blurting Success answers as passive Explain", () => {
    const atomState = makeUserAtomState({ mastery: 40 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Blurting }),
      atomState,
      outcome: SessionEventOutcome.Success,
      isCorrect: false,
    });

    expect(update.masteryDelta).toBe(-6);
    expect(update.wasCorrect).toBe(false);
  });

  it("boosts mastery after successful review completion", () => {
    const atomState = makeUserAtomState({ mastery: 70 });
    const patched = computeReviewOutcomePatch(atomState, true);
    expect(patched.mastery).toBeGreaterThan(atomState.mastery);
  });
});
