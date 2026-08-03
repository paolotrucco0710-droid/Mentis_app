import type { Card, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import {
  EXPLANATION_CARD_TYPES,
  MAX_SESSION_CARDS_PER_ATOM,
  OPEN_RESPONSE_SESSION_WINDOW,
} from "./constants";
import {
  countRecentOpenResponseCards,
  hasOpenProductionDue,
  needsPrimaryIntroduction,
} from "./card-selector";
import type { ScoredAtomCandidate } from "./types";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);

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

function excludeRecentAtom(
  candidates: ScoredAtomCandidate[],
  recentAtomId: string | undefined
): ScoredAtomCandidate[] {
  if (!recentAtomId) {
    return candidates;
  }

  return candidates.filter((candidate) => candidate.atom.id !== recentAtomId);
}

function filterUnderSessionCap(
  candidates: ScoredAtomCandidate[],
  recentAtomCounts: Map<string, number>
): ScoredAtomCandidate[] {
  return candidates.filter(
    (candidate) =>
      (recentAtomCounts.get(candidate.atom.id) ?? 0) <
      MAX_SESSION_CARDS_PER_ATOM
  );
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

  const recentAtomId = recentAtomIds[0];
  let pool = candidates;

  const untouchedInSession = pool.filter(
    (candidate) => (recentAtomCounts.get(candidate.atom.id) ?? 0) === 0
  );
  const introNeeded = untouchedInSession.filter((candidate) =>
    needsPrimaryIntroduction(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );

  if (introNeeded.length > 0 && recentAtomId) {
    const recentCount = recentAtomCounts.get(recentAtomId) ?? 0;
    if (recentCount >= 1) {
      pool = introNeeded;
    }
  } else if (
    untouchedInSession.length > 0 &&
    untouchedInSession.length < pool.length
  ) {
    pool = untouchedInSession;
  }

  if (recentAtomId) {
    const rotated = excludeRecentAtom(pool, recentAtomId);
    if (rotated.length > 0) {
      pool = rotated;
    }
  }

  const recentLearnStreak = countRecentLearnCards(recentCardTypes);
  if (recentLearnStreak > 0) {
    const withoutIntroductions = pool.filter(
      (candidate) =>
        !needsPrimaryIntroduction(
          getCardsForCandidate(candidate, cardsByAtomId),
          userCardStates
        )
    );

    if (withoutIntroductions.length > 0) {
      pool = withoutIntroductions;
    }
  }

  const cappedPool = filterUnderSessionCap(pool, recentAtomCounts);
  if (cappedPool.length > 0) {
    pool = cappedPool;
  } else {
    const globallyCapped = filterUnderSessionCap(candidates, recentAtomCounts);
    if (globallyCapped.length > 0) {
      pool = globallyCapped;
    }
  }

  if (
    recentCardTypes.length >= 5 &&
    countRecentOpenResponseCards(recentCardTypes, OPEN_RESPONSE_SESSION_WINDOW) ===
      0
  ) {
    const productionDue = pool.filter((candidate) =>
      hasOpenProductionDue(
        getCardsForCandidate(candidate, cardsByAtomId),
        userCardStates
      )
    );

    if (productionDue.length > 0) {
      const minSessionCount = Math.min(
        ...productionDue.map(
          (candidate) => recentAtomCounts.get(candidate.atom.id) ?? 0
        )
      );
      const balanced = productionDue.filter(
        (candidate) =>
          (recentAtomCounts.get(candidate.atom.id) ?? 0) === minSessionCount
      );
      const rotatedProduction = excludeRecentAtom(balanced, recentAtomId);
      pool = rotatedProduction.length > 0 ? rotatedProduction : balanced;
    }
  }

  return pool;
}
