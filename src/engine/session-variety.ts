import type { Card, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import { EXPLANATION_CARD_TYPES, MAX_SESSION_CARDS_PER_ATOM } from "./constants";
import {
  needsPrimaryIntroduction,
  needsRetrievalVerification,
} from "./card-selector";
import type { ScoredAtomCandidate } from "./types";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);

export interface SessionVarietyContext {
  recentAtomCounts: Map<string, number>;
  recentCardTypes?: CardType[];
  cardsByAtomId: Map<string, Card[]>;
  userCardStates: Map<string, UserCardState>;
}

function getCardsForCandidate(
  candidate: ScoredAtomCandidate,
  cardsByAtomId: Map<string, Card[]>
): Card[] {
  return cardsByAtomId.get(candidate.atom.id) ?? [];
}

function countRecentLearnCards(recentCardTypes: CardType[]): number {
  let streak = 0;

  for (let index = recentCardTypes.length - 1; index >= 0; index -= 1) {
    if (!EXPLAIN_TYPES.has(recentCardTypes[index]!)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function filterCandidatesForSessionVariety(
  candidates: ScoredAtomCandidate[],
  context: SessionVarietyContext
): ScoredAtomCandidate[] {
  if (candidates.length <= 1) {
    return candidates;
  }

  const {
    recentAtomCounts,
    recentCardTypes = [],
    cardsByAtomId,
    userCardStates,
  } = context;

  const needsVerification = candidates.filter((candidate) =>
    needsRetrievalVerification(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );
  if (needsVerification.length > 0) {
    return needsVerification;
  }

  const recentLearnStreak = countRecentLearnCards(recentCardTypes);
  const needsIntroduction = candidates.filter((candidate) =>
    needsPrimaryIntroduction(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );
  if (needsIntroduction.length > 0 && recentLearnStreak === 0) {
    return needsIntroduction;
  }

  const minSessionAppearances = Math.min(
    ...candidates.map(
      (candidate) => recentAtomCounts.get(candidate.atom.id) ?? 0
    )
  );
  const fairnessPool = candidates.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <= minSessionAppearances
  );
  if (fairnessPool.length > 0 && fairnessPool.length < candidates.length) {
    return fairnessPool;
  }

  const capped = candidates.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <
      MAX_SESSION_CARDS_PER_ATOM
  );

  return capped.length > 0 ? capped : candidates;
}
