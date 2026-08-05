import type { Card, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import {
  EXPLANATION_CARD_TYPES,
  IMAGE_SESSION_MIN_CARDS,
  IMAGE_SESSION_WINDOW,
  MAX_SESSION_CARDS_PER_ATOM,
  OPEN_RESPONSE_SESSION_WINDOW,
  QUICK_RETRIEVAL_CARD_TYPES,
} from "./constants";
import {
  countRecentImageCards,
  countRecentOpenResponseCards,
  hasImageRetrievalDue,
  hasOpenProductionDue,
  needsPrimaryIntroduction,
} from "./card-selector";
import type { ScoredAtomCandidate, SessionVarietyContext } from "./types";
import { applyChapterTourVariety } from "./chapter-tour";

export type { SessionVarietyContext } from "./types";

const EXPLAIN_TYPES = new Set<string>(EXPLANATION_CARD_TYPES);
const QUICK_RETRIEVAL_TYPES = new Set<string>(QUICK_RETRIEVAL_CARD_TYPES);
const SESSION_RHYTHM_WINDOW = 6;

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

function hasPendingDeepPractice(
  candidate: ScoredAtomCandidate,
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): boolean {
  const cards = getCardsForCandidate(candidate, cardsByAtomId);
  return (
    hasOpenProductionDue(cards, userCardStates) ||
    hasImageRetrievalDue(cards, userCardStates)
  );
}

function filterUnderSessionCap(
  candidates: ScoredAtomCandidate[],
  recentAtomCounts: Map<string, number>,
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): ScoredAtomCandidate[] {
  return candidates.filter((candidate) => {
    const count = recentAtomCounts.get(candidate.atom.id) ?? 0;

    if (count < MAX_SESSION_CARDS_PER_ATOM) {
      return true;
    }

    return hasPendingDeepPractice(candidate, cardsByAtomId, userCardStates);
  });
}

function filterUntouchedIntroductions(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>,
  recentAtomCounts: Map<string, number>
): ScoredAtomCandidate[] {
  return candidates.filter(
    (candidate) =>
      needsPrimaryIntroduction(
        getCardsForCandidate(candidate, cardsByAtomId),
        userCardStates
      ) && (recentAtomCounts.get(candidate.atom.id) ?? 0) === 0
  );
}

function applyPostRetrievalVariety(
  pool: ScoredAtomCandidate[],
  context: SessionVarietyContext,
  recentAtomId: string | undefined
): ScoredAtomCandidate[] {
  const {
    recentCardTypes = [],
    cardsByAtomId,
    userCardStates,
    recentAtomCounts,
  } = context;

  if (recentCardTypes.length < 2) {
    return pool;
  }

  const openResponseRecent = countRecentOpenResponseCards(
    recentCardTypes,
    SESSION_RHYTHM_WINDOW
  );
  const imageRecent = countRecentImageCards(
    recentCardTypes,
    SESSION_RHYTHM_WINDOW
  );
  const learnRecent = recentCardTypes
    .slice(-SESSION_RHYTHM_WINDOW)
    .some((type) => EXPLAIN_TYPES.has(type));

  if (recentAtomId) {
    const recentCandidate = pool.find(
      (candidate) => candidate.atom.id === recentAtomId
    );
    if (recentCandidate) {
      const recentCards = getCardsForCandidate(recentCandidate, cardsByAtomId);

      if (
        imageRecent === 0 &&
        hasImageRetrievalDue(recentCards, userCardStates)
      ) {
        return [recentCandidate];
      }

      if (
        openResponseRecent === 0 &&
        hasOpenProductionDue(recentCards, userCardStates)
      ) {
        return [recentCandidate];
      }
    }
  }

  const productionDue = pool.filter((candidate) =>
    hasOpenProductionDue(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );
  const imageDue = pool.filter((candidate) =>
    hasImageRetrievalDue(
      getCardsForCandidate(candidate, cardsByAtomId),
      userCardStates
    )
  );
  const untouchedIntros = filterUntouchedIntroductions(
    pool,
    cardsByAtomId,
    userCardStates,
    recentAtomCounts
  );

  if (imageRecent === 0 && imageDue.length > 0) {
    return imageDue;
  }

  if (openResponseRecent === 0 && productionDue.length > 0) {
    return productionDue;
  }

  if (!learnRecent && untouchedIntros.length > 0) {
    return untouchedIntros;
  }

  if (untouchedIntros.length > 0 && openResponseRecent > 0 && imageRecent > 0) {
    return untouchedIntros;
  }

  return pool;
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

  let pool = applyChapterTourVariety(candidates, context, recentAtomId);

  const lastCardType = recentCardTypes[recentCardTypes.length - 1];
  const lastWasExplain = lastCardType ? EXPLAIN_TYPES.has(lastCardType) : false;
  const lastWasQuickRetrieval = lastCardType
    ? QUICK_RETRIEVAL_TYPES.has(lastCardType)
    : false;

  const recentLearnStreak = countRecentLearnCards(recentCardTypes);
  if (recentLearnStreak > 0) {
    pool = filterOutIntroductions(pool, cardsByAtomId, userCardStates);
  }

  if (lastWasQuickRetrieval && recentAtomId) {
    const sameAtomProductionOrImage = applyPostRetrievalVariety(
      pool,
      context,
      recentAtomId
    );
    const keepsRecentAtom =
      sameAtomProductionOrImage.length === 1 &&
      sameAtomProductionOrImage[0]?.atom.id === recentAtomId;

    if (keepsRecentAtom) {
      pool = sameAtomProductionOrImage;
    } else {
      const rotated = excludeRecentAtom(pool, recentAtomId);
      if (rotated.length > 0) {
        pool = rotated;
      }

      pool = applyPostRetrievalVariety(pool, context, recentAtomId);
    }
  } else if (recentAtomId && !lastWasExplain) {
    const rotated = excludeRecentAtom(pool, recentAtomId);
    if (rotated.length > 0) {
      pool = rotated;
    }
  }

  const cappedPool = filterUnderSessionCap(
    pool,
    recentAtomCounts,
    cardsByAtomId,
    userCardStates
  );
  if (cappedPool.length > 0) {
    pool = cappedPool;
  } else {
    const globallyCapped = filterUnderSessionCap(
      candidates,
      recentAtomCounts,
      cardsByAtomId,
      userCardStates
    );
    if (globallyCapped.length > 0) {
      pool = globallyCapped;
    }
  }

  if (
    recentCardTypes.length >= 4 &&
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

  if (
    recentCardTypes.length >= IMAGE_SESSION_MIN_CARDS &&
    countRecentImageCards(recentCardTypes, IMAGE_SESSION_WINDOW) === 0
  ) {
    const imageDue = pool.filter((candidate) =>
      hasImageRetrievalDue(
        getCardsForCandidate(candidate, cardsByAtomId),
        userCardStates
      )
    );

    if (imageDue.length > 0) {
      const minSessionCount = Math.min(
        ...imageDue.map(
          (candidate) => recentAtomCounts.get(candidate.atom.id) ?? 0
        )
      );
      const balanced = imageDue.filter(
        (candidate) =>
          (recentAtomCounts.get(candidate.atom.id) ?? 0) === minSessionCount
      );
      const rotatedImage = excludeRecentAtom(balanced, recentAtomId);
      pool = rotatedImage.length > 0 ? rotatedImage : balanced;
    }
  }

  return pool;
}
