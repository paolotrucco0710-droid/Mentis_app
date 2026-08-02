import {
  countAtomsBySubjectId,
  findAtomsBySubjectId,
} from "@/db/repositories/atoms";
import { findCardsByAtomIds } from "@/db/repositories/cards";
import { createSessionEvent } from "@/db/repositories/session-events";
import {
  AnalyticsEvents,
  trackAnalyticsEvent,
} from "@/analytics";
import { findSubjectById } from "@/db/repositories/subjects";
import { findSessionEventsBySessionId } from "@/db/repositories/session-events";
import { assertSessionReadyForStudy } from "@/session";
import {
  findUserAtomStatesByUserId,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import { findUserCardStatesByUserAndCardIds } from "@/db/repositories/user-card-states";
import type { Atom, Card, FeedItem, FeedResponse, UserAtomState } from "@/domain/entities";
import { CardType, SessionEventType } from "@/domain/enums";
import type { AtomId, KnowledgeSourceId, StudySessionId, SubjectId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { relinkImagesForKnowledgeSource } from "@/ai/relink-images";
import { selectCardForAtom } from "./card-selector";
import { DEFAULT_SESSION_TARGET_CARDS, MASTERY_STABLE_THRESHOLD } from "./constants";
import { FeedEngineError } from "./errors";
import { countUnlocks, scoreAtomCandidate, selectBestCandidate } from "./priority";
import { initialLearningStage, prerequisitesMet } from "./stages";
import type { FeedEngineContext } from "./types";

export interface GetNextFeedItemInput {
  userId: UserId;
  subjectId: SubjectId;
  sessionId: StudySessionId;
  knowledgeSourceId?: KnowledgeSourceId;
}

export async function getNextFeedItem(
  input: GetNextFeedItemInput
): Promise<FeedResponse> {
  const context = await loadFeedContext(input);

  if (context.session.cardsViewed >= getSessionTargetCards()) {
    return emptyFeedResponse(context.session.id, true);
  }

  if (context.atoms.length === 0) {
    return emptyFeedResponse(context.session.id, true);
  }

  const selection = selectNextItem(context);

  if (!selection) {
    const sessionComplete =
      context.session.cardsViewed >= getSessionTargetCards() ||
      !hasActiveLearning(context);

    return emptyFeedResponse(context.session.id, sessionComplete);
  }

  const now = new Date();
  await createSessionEvent({
    sessionId: context.session.id,
    type: SessionEventType.OpenCard,
    atomId: selection.candidate.atom.id,
    cardId: selection.card.id,
    feedPosition: context.session.cardsViewed,
    timestamp: now,
  });

  trackAnalyticsEvent({
    userId: input.userId,
    name: AnalyticsEvents.StudyCardOpened,
    category: "study",
    source: "engine",
    properties: {
      sessionId: context.session.id,
      cardId: selection.card.id,
      atomId: selection.candidate.atom.id,
      feedPosition: context.session.cardsViewed,
    },
  });

  const feedItem = buildFeedItem({
    context,
    atom: selection.candidate.atom,
    card: selection.card,
    masteryBefore: selection.candidate.state.mastery,
  });

  return {
    item: feedItem,
    sessionComplete: false,
    rewards: [],
    notifications: [],
  };
}

async function loadFeedContext(
  input: GetNextFeedItemInput
): Promise<FeedEngineContext> {
  const session = await assertSessionReadyForStudy(
    input.userId,
    input.sessionId
  );

  if (session.subjectId && session.subjectId !== input.subjectId) {
    throw new FeedEngineError(
      "La sessione non appartiene alla materia richiesta.",
      "SESSION_SUBJECT_MISMATCH",
      409
    );
  }

  const subject = await findSubjectById(input.subjectId);
  if (!subject) {
    throw new FeedEngineError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }

  if (subject.userId !== input.userId) {
    throw new FeedEngineError(
      "Non hai accesso a questa materia.",
      "SUBJECT_FORBIDDEN",
      403
    );
  }

  const atoms = await findAtomsBySubjectId(input.subjectId);
  const scopedAtoms = input.knowledgeSourceId
    ? atoms.filter((atom) => atom.knowledgeSourceId === input.knowledgeSourceId)
    : atoms;

  if (input.knowledgeSourceId) {
    await relinkImagesForKnowledgeSource(input.knowledgeSourceId);
  }

  const userAtomStates = await ensureUserAtomStates(input.userId, scopedAtoms);

  const cards = await findCardsByAtomIds(scopedAtoms.map((atom) => atom.id));
  const cardsByAtomId = groupCardsByAtom(cards);
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const userCardStatesList = await findUserCardStatesByUserAndCardIds(
    input.userId,
    cards.map((card) => card.id)
  );
  const userCardStates = new Map(
    userCardStatesList.map((state) => [state.cardId, state])
  );

  const sessionEvents = await findSessionEventsBySessionId(session.id);
  const lastCardType = resolveLastCardType(sessionEvents, cardsById);
  const recentCardTypes = resolveRecentCardTypes(sessionEvents, cardsById);
  const recentAtomIds = resolveRecentAtomIds(sessionEvents);
  const knowledgeSourceExposure = buildKnowledgeSourceExposure(
    scopedAtoms,
    userAtomStates
  );

  return {
    userId: input.userId,
    subjectId: input.subjectId,
    session,
    atoms: scopedAtoms,
    cardsByAtomId,
    userAtomStates,
    userCardStates,
    cardsById,
    lastCardType,
    recentCardTypes,
    recentAtomIds,
    knowledgeSourceExposure,
    now: new Date(),
  };
}

async function ensureUserAtomStates(
  userId: UserId,
  atoms: Atom[]
): Promise<Map<string, UserAtomState>> {
  const existingStates = await findUserAtomStatesByUserId(userId);
  const existingAtomIds = new Set(existingStates.map((state) => state.atomId));
  const stateByAtomId = new Map(
    existingStates.map((state) => [state.atomId, state])
  );

  for (const atom of atoms) {
    if (existingAtomIds.has(atom.id)) {
      continue;
    }

    const prerequisitesSatisfied = prerequisitesMet(
      atom.prerequisites,
      stateByAtomId
    );

    const created = await upsertUserAtomState({
      userId,
      atomId: atom.id,
      currentStage: initialLearningStage(prerequisitesSatisfied),
    });

    stateByAtomId.set(atom.id, created);
    existingAtomIds.add(atom.id);
  }

  for (const atom of atoms) {
    const state = stateByAtomId.get(atom.id);
    if (!state) {
      continue;
    }

    const prerequisitesSatisfied = prerequisitesMet(
      atom.prerequisites,
      stateByAtomId
    );
    const desiredStage = initialLearningStage(prerequisitesSatisfied);

    if (
      state.currentStage !== desiredStage &&
      state.exposureCount === 0 &&
      state.mastery === 0
    ) {
      const updated = await upsertUserAtomState({
        userId,
        atomId: atom.id,
        currentStage: desiredStage,
      });
      stateByAtomId.set(atom.id, updated);
    }
  }

  return stateByAtomId;
}

function selectNextItem(context: FeedEngineContext) {
  const candidates = context.atoms
    .map((atom) => {
      const state = context.userAtomStates.get(atom.id);
      if (!state) {
        return null;
      }

      return scoreAtomCandidate({
        atom,
        state,
        userAtomStates: context.userAtomStates,
        unlocksCount: countUnlocks(
          atom.id,
          context.atoms,
          context.userAtomStates
        ),
        now: context.now,
        recentAtomIds: context.recentAtomIds,
        knowledgeSourceExposure: context.knowledgeSourceExposure,
      });
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate)
    );

  const bestCandidate = selectBestCandidate(candidates);
  if (!bestCandidate) {
    return null;
  }

  const cards = context.cardsByAtomId.get(bestCandidate.atom.id) ?? [];
  const card = selectCardForAtom({
    cards,
    atomState: bestCandidate.state,
    stage: bestCandidate.stage,
    userCardStates: context.userCardStates,
    lastCardType: context.lastCardType,
    recentCardTypes: context.recentCardTypes,
  });

  if (!card) {
    return null;
  }

  return { candidate: bestCandidate, card };
}

function buildFeedItem(input: {
  context: FeedEngineContext;
  atom: Atom;
  card: Card;
  masteryBefore: number;
}): FeedItem {
  const { context, atom, card, masteryBefore } = input;
  const sessionTarget = getSessionTargetCards();
  const totalAtoms = context.atoms.length;
  const masteredCount = [...context.userAtomStates.values()].filter(
    (state) => state.mastery >= MASTERY_STABLE_THRESHOLD
  ).length;

  return {
    card,
    atomId: atom.id,
    atomTitle: atom.title,
    subjectId: context.subjectId,
    courseId: null,
    chapterId: null,
    sessionId: context.session.id,
    position: context.session.cardsViewed,
    sessionProgress: Math.min(context.session.cardsViewed / sessionTarget, 1),
    chapterProgress: totalAtoms > 0 ? masteredCount / totalAtoms : null,
    estimatedDurationSeconds: card.estimatedDurationSeconds,
    masteryBefore,
  };
}

function hasActiveLearning(context: FeedEngineContext): boolean {
  return context.atoms.some((atom) => {
    const state = context.userAtomStates.get(atom.id);
    if (!state) {
      return false;
    }

    return prerequisitesMet(atom.prerequisites, context.userAtomStates);
  });
}

function groupCardsByAtom(cards: Card[]): Map<string, Card[]> {
  const grouped = new Map<string, Card[]>();

  for (const card of cards) {
    const existing = grouped.get(card.atomId) ?? [];
    existing.push(card);
    grouped.set(card.atomId, existing);
  }

  return grouped;
}

function resolveLastCardType(
  events: Awaited<ReturnType<typeof findSessionEventsBySessionId>>,
  cardsById: Map<string, Card>
): CardType | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type !== SessionEventType.OpenCard || !event.cardId) {
      continue;
    }

    const card = cardsById.get(event.cardId);
    return card?.type ?? null;
  }

  return null;
}

function resolveRecentCardTypes(
  events: Awaited<ReturnType<typeof findSessionEventsBySessionId>>,
  cardsById: Map<string, Card>,
  limit = 4
): CardType[] {
  const recent: CardType[] = [];

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type !== SessionEventType.OpenCard || !event.cardId) {
      continue;
    }

    const card = cardsById.get(event.cardId);
    if (!card) {
      continue;
    }

    recent.push(card.type);

    if (recent.length >= limit) {
      break;
    }
  }

  return recent.reverse();
}

function resolveRecentAtomIds(
  events: Awaited<ReturnType<typeof findSessionEventsBySessionId>>,
  limit = 5
): AtomId[] {
  const recent: AtomId[] = [];
  const seen = new Set<string>();

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type !== SessionEventType.OpenCard || !event.atomId) {
      continue;
    }

    if (seen.has(event.atomId)) {
      continue;
    }

    seen.add(event.atomId);
    recent.push(event.atomId as AtomId);

    if (recent.length >= limit) {
      break;
    }
  }

  return recent;
}

function buildKnowledgeSourceExposure(
  atoms: Atom[],
  userAtomStates: Map<string, UserAtomState>
): Map<string, number> {
  const exposure = new Map<string, number>();

  for (const atom of atoms) {
    const state = userAtomStates.get(atom.id);
    const current = exposure.get(atom.knowledgeSourceId) ?? 0;
    exposure.set(
      atom.knowledgeSourceId,
      current + (state?.exposureCount ?? 0)
    );
  }

  return exposure;
}

function emptyFeedResponse(
  sessionId: StudySessionId,
  sessionComplete: boolean
): FeedResponse {
  return {
    item: null,
    sessionComplete,
    rewards: [],
    notifications: [],
  };
}

function getSessionTargetCards(): number {
  return env.feedSessionTargetCards || DEFAULT_SESSION_TARGET_CARDS;
}

export async function countSubjectAtoms(
  subjectId: SubjectId
): Promise<number> {
  return countAtomsBySubjectId(subjectId);
}
