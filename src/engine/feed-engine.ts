import {
  countAtomsBySubjectId,
  findAtomsBySubjectId,
} from "@/db/repositories/atoms";
import { findCardsByAtomIds } from "@/db/repositories/cards";
import { findSubjectById } from "@/db/repositories/subjects";
import {
  findStudySessionById,
  incrementSessionCardsViewed,
} from "@/db/repositories/study-sessions";
import { findSessionEventsBySessionId } from "@/db/repositories/session-events";
import {
  findUserAtomStatesByUserId,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import { findUserCardStatesByUserAndCardIds } from "@/db/repositories/user-card-states";
import type { Atom, Card, FeedItem, FeedResponse } from "@/domain/entities";
import { CardType, SessionEventType } from "@/domain/enums";
import type { StudySessionId, SubjectId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { selectCardForAtom } from "./card-selector";
import { DEFAULT_SESSION_TARGET_CARDS } from "./constants";
import { FeedEngineError } from "./errors";
import { countUnlocks, scoreAtomCandidate, selectBestCandidate } from "./priority";
import { initialLearningStage, prerequisitesMet } from "./stages";
import type { FeedEngineContext } from "./types";

export interface GetNextFeedItemInput {
  userId: UserId;
  subjectId: SubjectId;
  sessionId: StudySessionId;
}

export async function getNextFeedItem(
  input: GetNextFeedItemInput
): Promise<FeedResponse> {
  const context = await loadFeedContext(input);

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

  const updatedSession = await incrementSessionCardsViewed(context.session.id);
  const feedItem = buildFeedItem({
    context,
    atom: selection.candidate.atom,
    card: selection.card,
    session: updatedSession,
    masteryBefore: selection.candidate.state.mastery,
  });

  return {
    item: feedItem,
    sessionComplete: updatedSession.cardsViewed >= getSessionTargetCards(),
    rewards: [],
    notifications: [],
  };
}

async function loadFeedContext(
  input: GetNextFeedItemInput
): Promise<FeedEngineContext> {
  const subject = await findSubjectById(input.subjectId);
  if (!subject) {
    throw new FeedEngineError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }

  const session = await findStudySessionById(input.sessionId);
  if (!session || session.userId !== input.userId) {
    throw new FeedEngineError(
      "Sessione di studio non trovata.",
      "SESSION_NOT_FOUND",
      404
    );
  }

  if (session.endedAt) {
    throw new FeedEngineError(
      "La sessione di studio è già terminata.",
      "SESSION_ENDED",
      409
    );
  }

  const atoms = await findAtomsBySubjectId(input.subjectId);
  await ensureUserAtomStates(input.userId, atoms);

  const userAtomStateList = await findUserAtomStatesByUserId(input.userId);
  const userAtomStates = new Map(
    userAtomStateList.map((state) => [state.atomId, state])
  );

  const cards = await findCardsByAtomIds(atoms.map((atom) => atom.id));
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

  return {
    userId: input.userId,
    subjectId: input.subjectId,
    session,
    atoms,
    cardsByAtomId,
    userAtomStates,
    userCardStates,
    cardsById,
    lastCardType,
    now: new Date(),
  };
}

async function ensureUserAtomStates(
  userId: UserId,
  atoms: Atom[]
): Promise<void> {
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
  session: FeedEngineContext["session"];
  masteryBefore: number;
}): FeedItem {
  const { context, atom, card, session, masteryBefore } = input;
  const sessionTarget = getSessionTargetCards();
  const totalAtoms = context.atoms.length;
  const masteredCount = [...context.userAtomStates.values()].filter(
    (state) => state.mastery >= 85
  ).length;

  return {
    card,
    atomId: atom.id,
    atomTitle: atom.title,
    subjectId: context.subjectId,
    courseId: null,
    chapterId: null,
    sessionId: session.id,
    position: session.cardsViewed,
    sessionProgress: Math.min(session.cardsViewed / sessionTarget, 1),
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
