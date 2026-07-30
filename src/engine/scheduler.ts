import type { UserAtomState } from "@/domain/entities";
import { UserAtomLearningState } from "@/domain/enums";
import { computeForgetProbability } from "./decay";

const MS_PER_HOUR = 3_600_000;

/**
 * Estimates when an atom should be reviewed again.
 * Used when initializing states; M7 will update this after answers.
 */
export function estimateNextReviewAt(
  state: UserAtomState,
  now: Date
): Date | null {
  if (state.exposureCount === 0) {
    return null;
  }

  const forgetProbability = computeForgetProbability(state, now);
  const masteryFactor = Math.max(0.5, state.mastery / 100);
  const streakBonus = Math.min(state.streak, 8);
  const baseHours = 6 + masteryFactor * 18 + streakBonus * 4;
  const urgencyFactor = 1 - forgetProbability;
  const delayHours = Math.max(2, baseHours * urgencyFactor);

  return new Date(now.getTime() + delayHours * MS_PER_HOUR);
}

export function isReviewDue(
  state: UserAtomState,
  now: Date
): boolean {
  if (state.nextReviewAt && state.nextReviewAt <= now) {
    return true;
  }

  return (
    state.currentStage === UserAtomLearningState.Review ||
    state.currentStage === UserAtomLearningState.Forgotten
  );
}
