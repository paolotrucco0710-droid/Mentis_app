import type { Card, UserAtomState, UserCardState } from "@/domain/entities";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import {
  EXPLANATION_CARD_TYPES,
  IMAGE_EXPLAIN_CARD_TYPES,
  LEARN_CARD_TYPES,
  OPEN_RESPONSE_CARD_TYPES,
  QUICK_RETRIEVAL_CARD_TYPES,
  RETRIEVAL_CARD_TYPES,
  VISUAL_RETRIEVAL_CARD_TYPES,
} from "./constants";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);
const IMAGE_EXPLAIN_TYPES = new Set<string>(IMAGE_EXPLAIN_CARD_TYPES);
const LEARN_TYPES = new Set<string>(LEARN_CARD_TYPES);
const VISUAL_RETRIEVAL_TYPES = new Set<string>(VISUAL_RETRIEVAL_CARD_TYPES);
const RETRIEVAL_TYPES = new Set<string>(RETRIEVAL_CARD_TYPES);
const OPEN_RESPONSE_TYPES = new Set<string>(OPEN_RESPONSE_CARD_TYPES);
const QUICK_RETRIEVAL_TYPES = new Set<string>(QUICK_RETRIEVAL_CARD_TYPES);

const SUPPRESSED_CARD_SCORE = -1000;

export function getPrimaryExplainCard(cards: Card[]): Card | null {
  const explainCards = cards.filter((card) => card.type === CardType.Explain);
  if (explainCards.length === 0) {
    return null;
  }

  return [...explainCards].sort((left, right) => left.order - right.order)[0];
}

export function needsPrimaryIntroduction(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  const explainCard = getPrimaryExplainCard(cards);
  if (!explainCard) {
    return false;
  }

  return (userCardStates.get(explainCard.id)?.viewCount ?? 0) === 0;
}

export function introductionSeen(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  const explainCard = getPrimaryExplainCard(cards);
  if (!explainCard) {
    return true;
  }

  return (userCardStates.get(explainCard.id)?.viewCount ?? 0) > 0;
}

export function hasAtomRetrievalVerification(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  return cards.some((card) => {
    if (
      !QUICK_RETRIEVAL_TYPES.has(card.type) &&
      !OPEN_RESPONSE_TYPES.has(card.type)
    ) {
      return false;
    }

    return (userCardStates.get(card.id)?.viewCount ?? 0) > 0;
  });
}

export function needsRetrievalVerification(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  if (!getPrimaryExplainCard(cards)) {
    return false;
  }

  return (
    introductionSeen(cards, userCardStates) &&
    !hasAtomRetrievalVerification(cards, userCardStates)
  );
}

export function selectCardForAtom(input: {
  cards: Card[];
  atomState: UserAtomState;
  stage: CognitiveAtomStage;
  userCardStates: Map<string, UserCardState>;
  lastCardType: CardType | null;
  recentCardTypes?: CardType[];
}): Card | null {
  const { cards, atomState, stage, userCardStates, lastCardType } = input;
  const recentCardTypes = input.recentCardTypes ?? [];

  if (cards.length === 0) {
    return null;
  }

  if (needsPrimaryIntroduction(cards, userCardStates)) {
    return getPrimaryExplainCard(cards);
  }

  const scoringStage = resolveScoringStage({
    stage,
    cards,
    userCardStates,
  });

  const ranked = [...cards].sort((left, right) => {
    const leftScore = scoreCard(left, {
      atomState,
      stage: scoringStage,
      userCardStates,
      cards,
      lastCardType,
      recentCardTypes,
    });
    const rightScore = scoreCard(right, {
      atomState,
      stage: scoringStage,
      userCardStates,
      cards,
      lastCardType,
      recentCardTypes,
    });

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.order - right.order;
  });

  return ranked[0] ?? null;
}

function resolveScoringStage(input: {
  stage: CognitiveAtomStage;
  cards: Card[];
  userCardStates: Map<string, UserCardState>;
}): CognitiveAtomStage {
  const { stage, cards, userCardStates } = input;

  if (
    stage === CognitiveAtomStage.Forgotten ||
    stage === CognitiveAtomStage.Locked
  ) {
    return stage;
  }

  if (!introductionSeen(cards, userCardStates)) {
    return stage;
  }

  if (
    stage === CognitiveAtomStage.Learning ||
    stage === CognitiveAtomStage.Learnable
  ) {
    return CognitiveAtomStage.Consolidating;
  }

  return stage;
}

function scoreCard(
  card: Card,
  input: {
    atomState: UserAtomState;
    stage: CognitiveAtomStage;
    userCardStates: Map<string, UserCardState>;
    cards: Card[];
    lastCardType: CardType | null;
    recentCardTypes: CardType[];
  }
): number {
  const {
    atomState,
    stage,
    userCardStates,
    cards,
    lastCardType,
    recentCardTypes,
  } = input;
  const cardState = userCardStates.get(card.id);
  let score = 0;

  const viewCount = cardState?.viewCount ?? 0;
  const wrongAnswers = cardState?.wrongAnswerCount ?? 0;
  const isOpenResponse = OPEN_RESPONSE_TYPES.has(card.type);
  const isImageExplain = IMAGE_EXPLAIN_TYPES.has(card.type);
  const isLearnCard = LEARN_TYPES.has(card.type);

  if (shouldSuppressExplanation(card, atomState, stage, viewCount)) {
    return SUPPRESSED_CARD_SCORE;
  }

  if (shouldSuppressImageExplain(card, cards, userCardStates, viewCount)) {
    return SUPPRESSED_CARD_SCORE;
  }

  if (shouldSuppressOpenResponse(card, atomState, stage, viewCount)) {
    return SUPPRESSED_CARD_SCORE;
  }

  score += Math.max(0, 30 - viewCount * 8);

  if (lastCardType && card.type === lastCardType) {
    score -= 25;
  }

  if (lastCardType && isSameCategory(lastCardType, card.type)) {
    score -= 12;
  }

  if (lastCardType && LEARN_TYPES.has(lastCardType) && isLearnCard) {
    score -= 28;
  }

  const recentLearnCount = recentCardTypes.filter((type) =>
    LEARN_TYPES.has(type)
  ).length;
  if (recentLearnCount >= 1 && isLearnCard) {
    score -= 35;
  }

  if (
    lastCardType &&
    isOpenResponse &&
    OPEN_RESPONSE_TYPES.has(lastCardType)
  ) {
    score -= 18;
  }

  switch (stage) {
    case CognitiveAtomStage.Learnable:
    case CognitiveAtomStage.Learning:
    case CognitiveAtomStage.Forgotten:
      if (QUICK_RETRIEVAL_TYPES.has(card.type)) {
        score += 28;
      }
      if (isOpenResponse) {
        score += 22;
      }
      if (EXPLAIN_TYPES.has(card.type)) {
        score += 8;
      }
      break;
    case CognitiveAtomStage.Consolidating:
    case CognitiveAtomStage.ReviewNeeded:
      if (QUICK_RETRIEVAL_TYPES.has(card.type)) {
        score += 32;
      }
      if (isOpenResponse) {
        score += atomState.wrongAnswerCount > 0 ? 26 : 20;
      }
      if (EXPLAIN_TYPES.has(card.type)) {
        score += 6;
      }
      break;
    case CognitiveAtomStage.Stable:
      if (QUICK_RETRIEVAL_TYPES.has(card.type)) {
        score += 24;
      }
      if (isOpenResponse) {
        score += 14;
      }
      break;
    default:
      break;
  }

  if (isOpenResponse && viewCount === 0 && introductionSeen(cards, userCardStates)) {
    score += 16;
  }

  if (
    introductionSeen(cards, userCardStates) &&
    !hasStartedOpenResponse(cards, userCardStates)
  ) {
    if (isOpenResponse) {
      score += 40;
    } else if (QUICK_RETRIEVAL_TYPES.has(card.type)) {
      score -= 35;
    }
  }

  if (atomState.wrongAnswerCount > 0 && EXPLAIN_TYPES.has(card.type)) {
    score += 20;
  }

  if (wrongAnswers > 0 && card.type !== lastCardType) {
    score += 15;
  }

  if (card.type === CardType.Quiz && atomState.wrongAnswerCount >= 2) {
    score -= 18;
  }

  return score;
}

function shouldSuppressExplanation(
  card: Card,
  atomState: UserAtomState,
  stage: CognitiveAtomStage,
  viewCount: number
): boolean {
  if (!EXPLAIN_TYPES.has(card.type) || viewCount === 0) {
    return false;
  }

  if (stage === CognitiveAtomStage.Forgotten) {
    return false;
  }

  if (atomState.wrongAnswerCount > 0) {
    return false;
  }

  return true;
}

function hasStartedOpenResponse(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  return cards.some((card) => {
    if (!OPEN_RESPONSE_TYPES.has(card.type)) {
      return false;
    }

    return (userCardStates.get(card.id)?.viewCount ?? 0) > 0;
  });
}

function hasStartedRetrieval(
  cards: Card[],
  userCardStates: Map<string, UserCardState>
): boolean {
  return cards.some((card) => {
    if (
      !QUICK_RETRIEVAL_TYPES.has(card.type) &&
      !OPEN_RESPONSE_TYPES.has(card.type)
    ) {
      return false;
    }

    return (userCardStates.get(card.id)?.viewCount ?? 0) > 0;
  });
}

function shouldSuppressImageExplain(
  card: Card,
  cards: Card[],
  userCardStates: Map<string, UserCardState>,
  viewCount: number
): boolean {
  if (!IMAGE_EXPLAIN_TYPES.has(card.type)) {
    return false;
  }

  if (!introductionSeen(cards, userCardStates)) {
    return true;
  }

  if (!hasStartedRetrieval(cards, userCardStates)) {
    return true;
  }

  return viewCount >= 1;
}

function shouldSuppressOpenResponse(
  card: Card,
  atomState: UserAtomState,
  stage: CognitiveAtomStage,
  viewCount: number
): boolean {
  if (!OPEN_RESPONSE_TYPES.has(card.type) || viewCount === 0) {
    return false;
  }

  if (stage === CognitiveAtomStage.Forgotten || atomState.wrongAnswerCount > 0) {
    return false;
  }

  return viewCount >= 3;
}

function isSameCategory(previous: CardType, current: CardType): boolean {
  const previousLearn = LEARN_TYPES.has(previous);
  const currentLearn = LEARN_TYPES.has(current);
  const previousOpenResponse = OPEN_RESPONSE_TYPES.has(previous);
  const currentOpenResponse = OPEN_RESPONSE_TYPES.has(current);
  const previousQuickRetrieval =
    QUICK_RETRIEVAL_TYPES.has(previous) ||
    VISUAL_RETRIEVAL_TYPES.has(previous) ||
    (RETRIEVAL_TYPES.has(previous) && !OPEN_RESPONSE_TYPES.has(previous));
  const currentQuickRetrieval =
    QUICK_RETRIEVAL_TYPES.has(current) ||
    VISUAL_RETRIEVAL_TYPES.has(current) ||
    (RETRIEVAL_TYPES.has(current) && !OPEN_RESPONSE_TYPES.has(current));

  return (
    (previousLearn && currentLearn) ||
    (previousOpenResponse && currentOpenResponse) ||
    (previousQuickRetrieval && currentQuickRetrieval)
  );
}
