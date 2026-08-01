import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { UserAtomLearningState } from "@/domain/enums";
import type { UserAtomState } from "@/domain/entities";
import {
  MASTERY_STABLE_THRESHOLD,
  PREREQUISITE_MASTERY_THRESHOLD,
  REVIEW_FORGET_THRESHOLD,
} from "./constants";
import { computeForgetProbability } from "./decay";

export function prerequisitesMet(
  prerequisiteIds: string[],
  userAtomStates: Map<string, UserAtomState>
): boolean {
  if (prerequisiteIds.length === 0) {
    return true;
  }

  return prerequisiteIds.every((prerequisiteId) => {
    const prerequisiteState = userAtomStates.get(prerequisiteId);
    if (!prerequisiteState) {
      return false;
    }

    return (
      prerequisiteState.mastery >= PREREQUISITE_MASTERY_THRESHOLD ||
      prerequisiteState.currentStage === UserAtomLearningState.Mastered
    );
  });
}

export function resolveCognitiveStage(
  state: UserAtomState,
  prerequisitesSatisfied: boolean,
  now: Date
): CognitiveAtomStage {
  if (!prerequisitesSatisfied) {
    return CognitiveAtomStage.Locked;
  }

  const forgetProbability = computeForgetProbability(state, now);

  if (state.currentStage === UserAtomLearningState.Forgotten) {
    return CognitiveAtomStage.Forgotten;
  }

  if (
    state.currentStage === UserAtomLearningState.Review ||
    forgetProbability >= REVIEW_FORGET_THRESHOLD
  ) {
    return CognitiveAtomStage.ReviewNeeded;
  }

  if (state.mastery >= MASTERY_STABLE_THRESHOLD) {
    return CognitiveAtomStage.Stable;
  }

  if (
    state.currentStage === UserAtomLearningState.Practicing ||
    (state.mastery >= 45 && state.comprehensionLevel >= 50) ||
    (state.correctAnswerCount >= 1 &&
      state.exposureCount >= 1 &&
      state.mastery >= 20 &&
      state.comprehensionLevel >= 15)
  ) {
    return CognitiveAtomStage.Consolidating;
  }

  if (
    state.exposureCount > 0 ||
    state.currentStage === UserAtomLearningState.Learning
  ) {
    return CognitiveAtomStage.Learning;
  }

  return CognitiveAtomStage.Learnable;
}

export function initialLearningStage(
  prerequisitesSatisfied: boolean
): UserAtomLearningState {
  return prerequisitesSatisfied
    ? UserAtomLearningState.Available
    : UserAtomLearningState.Locked;
}
