import type { Card } from "@/domain/entities";
import type { UserAtomState } from "@/domain/entities";
import { CardType } from "@/domain/enums";
import { SessionEventOutcome } from "@/domain/enums";
import { UserAtomLearningState } from "@/domain/enums";
import {
  EXPLANATION_CARD_TYPES,
  MASTERY_STABLE_THRESHOLD,
  RETRIEVAL_CARD_TYPES,
} from "@/engine/constants";
import { computeForgetProbability } from "@/engine/decay";
import { clamp, clamp01 } from "@/lib/math";
import type { MasteryUpdate } from "./types";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);
const RETRIEVAL_TYPES = new Set<string>(RETRIEVAL_CARD_TYPES);

const FAST_RESPONSE_MS = 5_000;
const SLOW_RESPONSE_MS = 15_000;

export function computeMasteryUpdate(input: {
  card: Card;
  atomState: UserAtomState;
  outcome: SessionEventOutcome;
  isCorrect?: boolean;
  responseTimeMs?: number;
}): MasteryUpdate {
  const { card, atomState, outcome, isCorrect, responseTimeMs } = input;
  const wasSkipped = outcome === SessionEventOutcome.Skipped;
  const wasNeutral = outcome === SessionEventOutcome.Neutral;

  if (wasSkipped) {
    return {
      masteryDelta: 0,
      comprehensionDelta: 0,
      confidenceDelta: 0,
      decayDelta: 0.02,
      streakAfter: 0,
      wasCorrect: false,
      wasSkipped: true,
    };
  }

  const explainCard = EXPLAIN_TYPES.has(card.type);
  const retrievalCard = RETRIEVAL_TYPES.has(card.type);
  const correct =
    isCorrect ??
    (outcome === SessionEventOutcome.Success ||
      (explainCard && outcome !== SessionEventOutcome.Failure));

  if (explainCard || (wasNeutral && !retrievalCard)) {
    return {
      masteryDelta: 3,
      comprehensionDelta: 6,
      confidenceDelta: 0.04,
      decayDelta: -0.04,
      streakAfter: Math.min(atomState.streak + 1, 20),
      wasCorrect: true,
      wasSkipped: false,
    };
  }

  if (correct) {
    let masteryDelta = retrievalCard ? 8 : 5;
    let confidenceDelta = 0.05;

    if (responseTimeMs !== undefined) {
      if (responseTimeMs <= FAST_RESPONSE_MS) {
        masteryDelta += 2;
        confidenceDelta += 0.02;
      } else if (responseTimeMs >= SLOW_RESPONSE_MS) {
        masteryDelta -= 1;
      }
    }

    return {
      masteryDelta,
      comprehensionDelta: retrievalCard ? 2 : 1,
      confidenceDelta,
      decayDelta: -0.08,
      streakAfter: Math.min(atomState.streak + 1, 20),
      wasCorrect: true,
      wasSkipped: false,
    };
  }

  return {
    masteryDelta: -6,
    comprehensionDelta: retrievalCard ? -3 : -1,
    confidenceDelta: -0.03,
    decayDelta: 0.1,
    streakAfter: 0,
    wasCorrect: false,
    wasSkipped: false,
  };
}

export function applyMasteryUpdate(
  state: UserAtomState,
  update: MasteryUpdate
): Pick<
  UserAtomState,
  | "mastery"
  | "comprehensionLevel"
  | "confidence"
  | "estimatedDecay"
  | "streak"
  | "exposureCount"
  | "correctAnswerCount"
  | "wrongAnswerCount"
  | "errorCount"
  | "currentStage"
> {
  const mastery = clamp(
    state.mastery + update.masteryDelta,
    0,
    100
  ) as UserAtomState["mastery"];
  const comprehensionLevel = clamp(
    state.comprehensionLevel + update.comprehensionDelta,
    0,
    100
  ) as UserAtomState["comprehensionLevel"];
  const confidence = clamp01(state.confidence + update.confidenceDelta);
  const estimatedDecay = clamp01(state.estimatedDecay + update.decayDelta);

  const exposureCount = state.exposureCount + 1;
  const correctAnswerCount =
    state.correctAnswerCount + (update.wasCorrect && !update.wasSkipped ? 1 : 0);
  const wrongAnswerCount =
    state.wrongAnswerCount +
    (!update.wasCorrect && !update.wasSkipped ? 1 : 0);
  const errorCount = state.errorCount + (update.wasCorrect ? 0 : update.wasSkipped ? 0 : 1);

  const currentStage = derivePersistedStage({
    mastery,
    comprehensionLevel,
    exposureCount,
    wrongAnswerCount,
    estimatedDecay,
    previousStage: state.currentStage,
    now: new Date(),
    state: {
      ...state,
      mastery,
      comprehensionLevel,
      exposureCount,
      wrongAnswerCount,
      estimatedDecay,
    },
  });

  return {
    mastery,
    comprehensionLevel,
    confidence,
    estimatedDecay,
    streak: update.streakAfter,
    exposureCount,
    correctAnswerCount,
    wrongAnswerCount,
    errorCount,
    currentStage,
  };
}

function derivePersistedStage(input: {
  mastery: number;
  comprehensionLevel: number;
  exposureCount: number;
  wrongAnswerCount: number;
  estimatedDecay: number;
  previousStage: UserAtomLearningState;
  now: Date;
  state: UserAtomState;
}): UserAtomLearningState {
  const {
    mastery,
    comprehensionLevel,
    exposureCount,
    wrongAnswerCount,
    previousStage,
    now,
    state,
  } = input;

  if (previousStage === UserAtomLearningState.Locked) {
    return UserAtomLearningState.Locked;
  }

  const forgetProbability = computeForgetProbability(state, now);

  if (
    wrongAnswerCount >= 3 &&
    mastery < 30 &&
    forgetProbability >= 0.65
  ) {
    return UserAtomLearningState.Forgotten;
  }

  if (forgetProbability >= 0.55 || previousStage === UserAtomLearningState.Review) {
    if (mastery >= MASTERY_STABLE_THRESHOLD) {
      return UserAtomLearningState.Mastered;
    }
    return UserAtomLearningState.Review;
  }

  if (mastery >= MASTERY_STABLE_THRESHOLD) {
    return UserAtomLearningState.Mastered;
  }

  if (mastery >= 45 && comprehensionLevel >= 50) {
    return UserAtomLearningState.Practicing;
  }

  if (exposureCount > 0) {
    return UserAtomLearningState.Learning;
  }

  return UserAtomLearningState.Available;
}

export function computeReviewOutcomePatch(
  atomState: UserAtomState,
  wasSuccessful: boolean
): Pick<
  UserAtomState,
  | "mastery"
  | "confidence"
  | "estimatedDecay"
  | "correctAnswerCount"
  | "wrongAnswerCount"
  | "errorCount"
  | "streak"
  | "currentStage"
> {
  if (wasSuccessful) {
    const mastery = clamp(atomState.mastery + 5, 0, 100) as UserAtomState["mastery"];

    return {
      mastery,
      confidence: clamp01(atomState.confidence + 0.05),
      estimatedDecay: clamp01(atomState.estimatedDecay - 0.06),
      correctAnswerCount: atomState.correctAnswerCount + 1,
      wrongAnswerCount: atomState.wrongAnswerCount,
      errorCount: atomState.errorCount,
      streak: Math.min(atomState.streak + 1, 20),
      currentStage:
        mastery >= MASTERY_STABLE_THRESHOLD
          ? UserAtomLearningState.Mastered
          : UserAtomLearningState.Practicing,
    };
  }

  const mastery = clamp(atomState.mastery - 4, 0, 100) as UserAtomState["mastery"];

  return {
    mastery,
    confidence: clamp01(atomState.confidence - 0.04),
    estimatedDecay: clamp01(atomState.estimatedDecay + 0.08),
    correctAnswerCount: atomState.correctAnswerCount,
    wrongAnswerCount: atomState.wrongAnswerCount + 1,
    errorCount: atomState.errorCount + 1,
    streak: 0,
    currentStage: UserAtomLearningState.Review,
  };
}

export function isRetrievalCard(type: CardType): boolean {
  return RETRIEVAL_TYPES.has(type);
}
