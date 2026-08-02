import type { AtomId } from "@/domain/ids";
import type { Atom, UserAtomState } from "@/domain/entities";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { UserAtomLearningState } from "@/domain/enums";
import { PREREQUISITE_MASTERY_THRESHOLD, REVIEW_FORGET_THRESHOLD } from "./constants";
import { computeForgetProbability } from "./decay";
import type { ScoredAtomCandidate } from "./types";
import { prerequisitesMet, resolveCognitiveStage } from "./stages";

export function scoreAtomCandidate(input: {
  atom: Atom;
  state: UserAtomState;
  userAtomStates: Map<string, UserAtomState>;
  unlocksCount: number;
  now: Date;
  recentAtomIds?: AtomId[];
  knowledgeSourceExposure?: Map<string, number>;
}): ScoredAtomCandidate | null {
  const {
    atom,
    state,
    userAtomStates,
    unlocksCount,
    now,
    recentAtomIds = [],
    knowledgeSourceExposure = new Map(),
  } = input;
  const prerequisitesSatisfied = prerequisitesMet(
    atom.prerequisites,
    userAtomStates
  );
  const stage = resolveCognitiveStage(state, prerequisitesSatisfied, now);

  if (stage === CognitiveAtomStage.Locked) {
    return null;
  }

  const forgetProbability = computeForgetProbability(state, now);
  const priority = computePriority({
    atom,
    state,
    stage,
    forgetProbability,
    unlocksCount,
    now,
    recentAtomIds,
    knowledgeSourceExposure,
  });

  return {
    atom,
    state,
    stage,
    priority,
    forgetProbability,
    prerequisitesMet: prerequisitesSatisfied,
    unlocksCount,
  };
}

function computePriority(input: {
  atom: Atom;
  state: UserAtomState;
  stage: CognitiveAtomStage;
  forgetProbability: number;
  unlocksCount: number;
  now: Date;
  recentAtomIds: AtomId[];
  knowledgeSourceExposure: Map<string, number>;
}): number {
  const {
    atom,
    state,
    stage,
    forgetProbability,
    unlocksCount,
    now,
    recentAtomIds,
    knowledgeSourceExposure,
  } = input;

  let score = 0;

  if (forgetProbability >= REVIEW_FORGET_THRESHOLD) {
    score += 90 + forgetProbability * 40;
  }

  if (state.nextReviewAt && state.nextReviewAt <= now) {
    const overdueHours =
      (now.getTime() - state.nextReviewAt.getTime()) / 3_600_000;
    score += 50 + Math.min(overdueHours, 48);
  }

  score += unlocksCount * 35;

  score += atom.importance * 8;

  if (state.wrongAnswerCount > 0 && state.exposureCount > 0) {
    const recentErrorRatio =
      state.wrongAnswerCount / Math.max(state.exposureCount, 1);
    score += recentErrorRatio * 45;
  }

  if (state.exposureCount === 0) {
    score += 40;
  }

  switch (stage) {
    case CognitiveAtomStage.Forgotten:
      score += 75;
      break;
    case CognitiveAtomStage.ReviewNeeded:
      score += 65;
      break;
    case CognitiveAtomStage.Learning:
      score += 50;
      break;
    case CognitiveAtomStage.Learnable:
      score += 45;
      break;
    case CognitiveAtomStage.Consolidating:
      score += 30;
      break;
    case CognitiveAtomStage.Stable:
      score += 10;
      break;
    default:
      break;
  }

  if (state.currentStage === UserAtomLearningState.Review) {
    score += 25;
  }

  score += (atom.difficulty / 5) * 5;
  score -= (state.mastery / 100) * 20;

  const recentIndex = recentAtomIds.indexOf(atom.id);
  if (recentIndex >= 0) {
    score -= 70 - recentIndex * 12;
  }

  const chapterExposure = knowledgeSourceExposure.get(atom.knowledgeSourceId) ?? 0;
  const exposureValues = [...knowledgeSourceExposure.values()];
  if (exposureValues.length > 1) {
    const minChapterExposure = Math.min(...exposureValues);
    if (chapterExposure === minChapterExposure) {
      score += 28;
    }
  }

  if (chapterExposure === 0) {
    score += 90;
  }

  if (state.exposureCount === 0) {
    const ageMs = Date.now() - atom.createdAt.getTime();
    if (ageMs < 14 * 24 * 3_600_000) {
      score += 35;
    }
  }

  return Math.max(score, 0);
}

export function countUnlocks(
  atomId: AtomId,
  atoms: Atom[],
  userAtomStates: Map<string, UserAtomState>
): number {
  let count = 0;

  for (const atom of atoms) {
    if (!atom.prerequisites.includes(atomId)) {
      continue;
    }

    const state = userAtomStates.get(atom.id);
    if (
      state &&
      state.currentStage !== UserAtomLearningState.Locked &&
      state.mastery >= PREREQUISITE_MASTERY_THRESHOLD
    ) {
      continue;
    }

    const otherPrerequisitesMet = atom.prerequisites
      .filter((prerequisite) => prerequisite !== atomId)
      .every((prerequisiteId) => {
        const prerequisiteState = userAtomStates.get(prerequisiteId);
        if (!prerequisiteState) {
          return false;
        }

        return (
          prerequisiteState.mastery >= PREREQUISITE_MASTERY_THRESHOLD ||
          prerequisiteState.currentStage === UserAtomLearningState.Mastered
        );
      });

    if (otherPrerequisitesMet) {
      count += 1;
    }
  }

  return count;
}

export function selectBestCandidate(
  candidates: ScoredAtomCandidate[]
): ScoredAtomCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    if (right.forgetProbability !== left.forgetProbability) {
      return right.forgetProbability - left.forgetProbability;
    }

    return left.atom.logicalOrder - right.atom.logicalOrder;
  })[0];
}
