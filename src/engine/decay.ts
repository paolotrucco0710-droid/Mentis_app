import type { UserAtomState } from "@/domain/entities";

const MS_PER_DAY = 86_400_000;

/**
 * Estimates how likely the student is to forget an atom right now.
 * Combines stored decay with time since last exposure.
 */
export function computeForgetProbability(
  state: UserAtomState,
  now: Date
): number {
  const baseDecay = clamp01(state.estimatedDecay);
  const masteryFactor = 1 - clamp01(state.mastery / 100);
  const errorFactor = clamp01(state.wrongAnswerCount / Math.max(state.exposureCount, 1));

  let timeFactor = 0.35;
  if (state.lastViewedAt) {
    const daysSinceView =
      (now.getTime() - state.lastViewedAt.getTime()) / MS_PER_DAY;
    timeFactor = clamp01(daysSinceView / 7);
  } else if (state.exposureCount === 0) {
    timeFactor = 0;
  }

  const stabilityFactor = clamp01(1 - state.streak / 10);

  return clamp01(
    baseDecay * 0.35 +
      masteryFactor * 0.3 +
      timeFactor * 0.2 +
      errorFactor * 0.1 +
      stabilityFactor * 0.05
  );
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
