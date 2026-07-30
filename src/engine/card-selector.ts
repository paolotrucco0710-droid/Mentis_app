import type { Card, UserAtomState, UserCardState } from "@/domain/entities";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import {
  EXPLANATION_CARD_TYPES,
  RETRIEVAL_CARD_TYPES,
} from "./constants";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);
const RETRIEVAL_TYPES = new Set<string>(RETRIEVAL_CARD_TYPES);

export function selectCardForAtom(input: {
  cards: Card[];
  atomState: UserAtomState;
  stage: CognitiveAtomStage;
  userCardStates: Map<string, UserCardState>;
  lastCardType: CardType | null;
}): Card | null {
  const { cards, atomState, stage, userCardStates, lastCardType } = input;

  if (cards.length === 0) {
    return null;
  }

  const ranked = [...cards].sort((left, right) => {
    const leftScore = scoreCard(left, {
      atomState,
      stage,
      userCardStates,
      lastCardType,
    });
    const rightScore = scoreCard(right, {
      atomState,
      stage,
      userCardStates,
      lastCardType,
    });

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.order - right.order;
  });

  return ranked[0] ?? null;
}

function scoreCard(
  card: Card,
  input: {
    atomState: UserAtomState;
    stage: CognitiveAtomStage;
    userCardStates: Map<string, UserCardState>;
    lastCardType: CardType | null;
  }
): number {
  const { atomState, stage, userCardStates, lastCardType } = input;
  const cardState = userCardStates.get(card.id);
  let score = 0;

  const viewCount = cardState?.viewCount ?? 0;
  const wrongAnswers = cardState?.wrongAnswerCount ?? 0;

  score += Math.max(0, 30 - viewCount * 8);

  if (lastCardType && card.type === lastCardType) {
    score -= 25;
  }

  if (lastCardType && isSameCategory(lastCardType, card.type)) {
    score -= 12;
  }

  switch (stage) {
    case CognitiveAtomStage.Learnable:
    case CognitiveAtomStage.Learning:
    case CognitiveAtomStage.Forgotten:
      if (EXPLAIN_TYPES.has(card.type)) {
        score += 35;
      }
      if (RETRIEVAL_TYPES.has(card.type)) {
        score += 10;
      }
      break;
    case CognitiveAtomStage.Consolidating:
    case CognitiveAtomStage.ReviewNeeded:
      if (RETRIEVAL_TYPES.has(card.type)) {
        score += 30;
      }
      if (EXPLAIN_TYPES.has(card.type)) {
        score += 12;
      }
      break;
    case CognitiveAtomStage.Stable:
      if (RETRIEVAL_TYPES.has(card.type)) {
        score += 20;
      }
      break;
    default:
      break;
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

function isSameCategory(previous: CardType, current: CardType): boolean {
  const previousExplain = EXPLAIN_TYPES.has(previous);
  const currentExplain = EXPLAIN_TYPES.has(current);
  const previousRetrieval = RETRIEVAL_TYPES.has(previous);
  const currentRetrieval = RETRIEVAL_TYPES.has(current);

  return (
    (previousExplain && currentExplain) ||
    (previousRetrieval && currentRetrieval)
  );
}
