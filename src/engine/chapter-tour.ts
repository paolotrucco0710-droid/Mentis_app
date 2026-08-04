import type { Card, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import { EXPLANATION_CARD_TYPES, CHAPTER_INTRO_SPACING_EASY, CHAPTER_INTRO_SPACING_MEDIUM, CHAPTER_INTRO_SPACING_HARD } from "./constants";
import {
  hasImageRetrievalDue,
  hasOpenProductionDue,
  introductionSeen,
  needsPrimaryIntroduction,
  needsRetrievalVerification,
} from "./card-selector";
import type { ScoredAtomCandidate, SessionVarietyContext } from "./types";

/** Cards to show between chapter introductions, scaled by atom difficulty. */
export function getIntroductionSpacing(difficulty: number): number {
  const normalized = Math.min(5, Math.max(1, Math.round(difficulty)));

  if (normalized <= 2) {
    return CHAPTER_INTRO_SPACING_EASY;
  }

  if (normalized === 3) {
    return CHAPTER_INTRO_SPACING_MEDIUM;
  }

  return CHAPTER_INTRO_SPACING_HARD;
}

export function countCardsSinceLastIntroduction(
  recentCardTypes: CardType[]
): number {
  let count = 0;

  for (let index = recentCardTypes.length - 1; index >= 0; index -= 1) {
    if (EXPLANATION_CARD_TYPES.has(recentCardTypes[index]!)) {
      break;
    }

    count += 1;
  }

  return count;
}

export function isChapterTourActive(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): boolean {
  return candidates.some((candidate) =>
    needsPrimaryIntroduction(
      cardsByAtomId.get(candidate.atom.id) ?? [],
      userCardStates
    )
  );
}

function shouldApplyChapterTourPacing(
  pool: ScoredAtomCandidate[],
  context: SessionVarietyContext
): boolean {
  const { recentCardTypes = [], cardsByAtomId, userCardStates } = context;

  if (isChapterTourActive(pool, cardsByAtomId, userCardStates)) {
    return true;
  }

  const lastCardType = recentCardTypes[recentCardTypes.length - 1];
  if (lastCardType && EXPLANATION_CARD_TYPES.has(lastCardType)) {
    return true;
  }

  const cardsSinceIntroduction = countCardsSinceLastIntroduction(recentCardTypes);
  if (cardsSinceIntroduction === 0) {
    return false;
  }

  const introduced = getIntroducedCandidates(pool, cardsByAtomId, userCardStates);
  return introduced.length > 0 && cardsSinceIntroduction < 3;
}

function getCards(
  candidate: ScoredAtomCandidate,
  cardsByAtomId: Map<string, Card[]>
): Card[] {
  return cardsByAtomId.get(candidate.atom.id) ?? [];
}

export function getIntroducedCandidates(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): ScoredAtomCandidate[] {
  return candidates.filter((candidate) => {
    const cards = getCards(candidate, cardsByAtomId);
    return (
      introductionSeen(cards, userCardStates) &&
      !needsPrimaryIntroduction(cards, userCardStates)
    );
  });
}

export function getUntouchedIntroductionCandidates(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>,
  recentAtomCounts: Map<string, number>
): ScoredAtomCandidate[] {
  return candidates.filter(
    (candidate) =>
      needsPrimaryIntroduction(
        getCards(candidate, cardsByAtomId),
        userCardStates
      ) && (recentAtomCounts.get(candidate.atom.id) ?? 0) === 0
  );
}

export function getPracticeDueCandidates(
  candidates: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): ScoredAtomCandidate[] {
  return candidates.filter((candidate) => {
    const cards = getCards(candidate, cardsByAtomId);

    if (!introductionSeen(cards, userCardStates)) {
      return false;
    }

    return (
      needsRetrievalVerification(cards, userCardStates) ||
      hasOpenProductionDue(cards, userCardStates) ||
      hasImageRetrievalDue(cards, userCardStates)
    );
  });
}

function resolveSpacingAnchor(
  pool: ScoredAtomCandidate[],
  context: SessionVarietyContext,
  recentAtomId: string | undefined
): ScoredAtomCandidate | undefined {
  const { recentAtomIds = [], cardsByAtomId, userCardStates } = context;
  const lastCardType =
    context.recentCardTypes?.[context.recentCardTypes.length - 1];

  if (lastCardType && EXPLANATION_CARD_TYPES.has(lastCardType) && recentAtomId) {
    return pool.find((candidate) => candidate.atom.id === recentAtomId);
  }

  for (const atomId of recentAtomIds) {
    const candidate = pool.find((item) => item.atom.id === atomId);
    if (!candidate) {
      continue;
    }

    const cards = getCards(candidate, cardsByAtomId);
    if (
      introductionSeen(cards, userCardStates) &&
      needsRetrievalVerification(cards, userCardStates)
    ) {
      return candidate;
    }
  }

  const introduced = getIntroducedCandidates(pool, cardsByAtomId, userCardStates);
  return [...introduced].sort(
    (left, right) => right.atom.logicalOrder - left.atom.logicalOrder
  )[0];
}

function excludeUntouchedIntroductions(
  pool: ScoredAtomCandidate[],
  cardsByAtomId: Map<string, Card[]>,
  userCardStates: Map<string, UserCardState>
): ScoredAtomCandidate[] {
  const withoutIntros = pool.filter(
    (candidate) =>
      !needsPrimaryIntroduction(
        getCards(candidate, cardsByAtomId),
        userCardStates
      )
  );

  return withoutIntros.length > 0 ? withoutIntros : pool;
}

function preferInterleavedPractice(
  practiceDue: ScoredAtomCandidate[],
  recentAtomId: string | undefined
): ScoredAtomCandidate[] {
  if (!recentAtomId) {
    return practiceDue;
  }

  const olderPractice = practiceDue.filter(
    (candidate) => candidate.atom.id !== recentAtomId
  );

  return olderPractice.length > 0 ? olderPractice : practiceDue;
}

export function applyChapterTourVariety(
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

  if (
    !shouldApplyChapterTourPacing(pool, context) ||
    pool.length <= 1
  ) {
    return pool;
  }

  const introduced = getIntroducedCandidates(
    pool,
    cardsByAtomId,
    userCardStates
  );
  const untouchedIntros = getUntouchedIntroductionCandidates(
    pool,
    cardsByAtomId,
    userCardStates,
    recentAtomCounts
  );
  const practiceDue = getPracticeDueCandidates(
    pool,
    cardsByAtomId,
    userCardStates
  );

  if (introduced.length === 0) {
    return untouchedIntros.length > 0 ? untouchedIntros : pool;
  }

  const spacingAnchor = resolveSpacingAnchor(pool, context, recentAtomId);
  const requiredSpacing = spacingAnchor
    ? getIntroductionSpacing(spacingAnchor.atom.difficulty)
    : 1;
  const cardsSinceIntroduction = countCardsSinceLastIntroduction(recentCardTypes);
  const spacingSatisfied = cardsSinceIntroduction >= requiredSpacing;

  if (!spacingSatisfied) {
    const withoutNewIntros = excludeUntouchedIntroductions(
      pool,
      cardsByAtomId,
      userCardStates
    );
    const interleaved = preferInterleavedPractice(practiceDue, recentAtomId);

    if (interleaved.length > 0) {
      return interleaved;
    }

    if (spacingAnchor && needsRetrievalVerification(
      getCards(spacingAnchor, cardsByAtomId),
      userCardStates
    )) {
      return [spacingAnchor];
    }

    return withoutNewIntros;
  }

  if (untouchedIntros.length > 0) {
    const anchorNeedsVerification =
      spacingAnchor &&
      needsRetrievalVerification(
        getCards(spacingAnchor, cardsByAtomId),
        userCardStates
      );

    if (
      anchorNeedsVerification &&
      spacingAnchor.atom.difficulty <= 2 &&
      cardsSinceIntroduction === requiredSpacing
    ) {
      return [spacingAnchor];
    }

    return [...untouchedIntros, ...practiceDue];
  }

  return pool;
}
