import type { Atom, UserAtomState } from "@/domain/entities";
import { UserAtomLearningState } from "@/domain/enums";
import { computeForgetProbability } from "@/engine/decay";
import { REVIEW_FORGET_THRESHOLD } from "@/engine/constants";

export function computeReviewPriority(input: {
  atom: Atom;
  state: UserAtomState;
  now: Date;
  scheduledAt: Date;
}): number {
  const { atom, state, now, scheduledAt } = input;
  const forgetProbability = computeForgetProbability(state, now);
  let priority = 0;

  if (scheduledAt <= now) {
    const overdueHours = Math.max(
      (now.getTime() - scheduledAt.getTime()) / 3_600_000,
      0
    );
    priority += 100 + Math.min(overdueHours, 72);
  }

  priority += forgetProbability * 60;

  if (forgetProbability >= REVIEW_FORGET_THRESHOLD) {
    priority += 25;
  }

  priority += atom.importance * 10;
  priority += (atom.difficulty / 5) * 8;

  if (state.currentStage === UserAtomLearningState.Forgotten) {
    priority += 40;
  } else if (state.currentStage === UserAtomLearningState.Review) {
    priority += 30;
  }

  if (state.wrongAnswerCount > 0) {
    priority +=
      (state.wrongAnswerCount / Math.max(state.exposureCount, 1)) * 25;
  }

  priority -= (state.mastery / 100) * 15;
  priority += Math.min(state.streak, 5);

  return Math.max(Math.round(priority), 0);
}

export function computeOverdueHours(
  scheduledAt: Date,
  now: Date
): number {
  if (scheduledAt > now) {
    return 0;
  }

  return Math.max(
    (now.getTime() - scheduledAt.getTime()) / 3_600_000,
    0
  );
}
