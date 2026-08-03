import type { Card, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import {
  EXPLANATION_CARD_TYPES,
  MAX_SESSION_CARDS_PER_ATOM,
  QUICK_RETRIEVAL_CARD_TYPES,
} from "./constants";
import { needsPrimaryIntroduction } from "./card-selector";
import type { ScoredAtomCandidate } from "./types";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);
const QUICK_RETRIEVAL_TYPES = new Set<string>(QUICK_RETRIEVAL_CARD_TYPES);

export interface SessionVarietyContext {
  recentAtomCounts: Map<string, number>;
  recentAtomIds?: string[];
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

function countRecentLearnCardsInWindow(
  recentCardTypes: CardType[],
  windowSize: number
): number {
  return recentCardTypes
    .slice(-windowSize)
    .filter((type) => EXPLAIN_TYPES.has(type)).length;
}

function excludeRecentAtom(
  candidates: ScoredAtomCandidate[],
  recentAtomId: string | undefined
): ScoredAtomCandidate[] {
  if (!recentAtomId) {
    return candidates;
  }

  return candidates.filter((candidate) => candidate.atom.id !== recentAtomId);
}

function filterOutIntroductions(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): ScoredAtomCandidate[] {
  const withoutIntroductions = candidates.filter(
    (candidate) =>
      !needsPrimaryIntroduction(
        getCardsForCandidate(candidate, cardsByAtomId),
        userCardStates
      )
  );

  return withoutIntroductions.length > 0 ? withoutIntroductions : candidates;
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
    recentAtomIds = [],
    recentCardTypes = [],
    cardsByAtomId,
    userCardStates,
  } = context;

  const lastCardType = recentCardTypes[recentCardTypes.length - 1];
  const lastWasExplain = lastCardType ? EXPLAIN_TYPES.has(lastCardType) : false;
  const lastWasQuickRetrieval = lastCardType
    ? QUICK_RETRIEVAL_TYPES.has(lastCardType)
    : false;
  const recentAtomId = recentAtomIds[0];

  let pool = candidates;

  if (lastWasExplain) {
    const practiceOnly = filterOutIntroductions(pool, cardsByAtomId, userCardStates);
    const rotated = excludeRecentAtom(practiceOnly, recentAtomId);
    pool = rotated.length > 0 ? rotated : practiceOnly;
  } else if (lastWasQuickRetrieval) {
    pool = excludeRecentAtom(pool, recentAtomId);
  }

  const recentLearnStreak = countRecentLearnCards(recentCardTypes);
  const needsIntroduction = pool.filter((candidate) =>
    needsPrimaryIntroduction(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );

  if (needsIntroduction.length > 0 && recentLearnStreak === 0) {
    const recentIntroCount = countRecentLearnCardsInWindow(recentCardTypes, 5);
    const shouldSpreadIntroductions =
      recentIntroCount < 2 &&
      (lastWasQuickRetrieval || needsIntroduction.length >= pool.length);

    if (shouldSpreadIntroductions) {
      const practicePool = pool.filter(
        (candidate) =>
          !needsPrimaryIntroduction(
            getCardsForCandidate(candidate, cardsByAtomId),
            userCardStates
          )
      );

      if (practicePool.length > 0) {
        pool = [...new Set([...needsIntroduction, ...practicePool])];
      } else {
        pool = needsIntroduction;
      }
    }
  }

  const minSessionAppearances = Math.min(
    ...pool.map((candidate) => recentAtomCounts.get(candidate.atom.id) ?? 0)
  );
  const fairnessPool = pool.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <= minSessionAppearances
  );
  if (fairnessPool.length > 0 && fairnessPool.length < pool.length) {
    pool = fairnessPool;
  }

  const capped = pool.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <
      MAX_SESSION_CARDS_PER_ATOM
  );

  return capped.length > 0 ? capped : pool;
}
