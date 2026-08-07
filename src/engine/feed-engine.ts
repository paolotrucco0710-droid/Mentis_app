import { countAtomsBySubjectId, findAtomsByKnowledgeSourceId, findAtomsBySubjectId } from "@/db/repositories/atoms";
import { findCardsByAtomIds } from "@/db/repositories/cards";
import { createSessionEvent, findRecentSessionEventsBySessionId } from "@/db/repositories/session-events";
import {
  AnalyticsEvents,
  trackAnalyticsEvent,
} from "@/analytics";
import { findSubjectById } from "@/db/repositories/subjects";
import { assertSessionReadyForStudy } from "@/session";
import {
  findUserAtomStatesByUserAndAtomIds,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import { findUserCardStatesByUserAndCardIds } from "@/db/repositories/user-card-states";
import type { Atom, Card, FeedItem, FeedResponse, SessionEvent, StudySession, UserAtomState } from "@/domain/entities";
import { CardType, SessionEventType } from "@/domain/enums";
import type { AtomId, ImageId, KnowledgeSourceId, StudySessionId, SubjectId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { getImageIdFromPayload } from "@/components/feed/card-utils";
import { getImageSignedUrlForUser } from "@/storage/access-service";
import { selectCardForAtom } from "./card-selector";
import { DEFAULT_SESSION_TARGET_CARDS, MASTERY_STABLE_THRESHOLD } from "./constants";
import { FeedEngineError } from "./errors";
import { countUnlocks, scoreAtomCandidate, selectBestCandidate } from "./priority";
import { filterCandidatesForSessionVariety } from "./session-variety";
import { initialLearningStage, prerequisitesMet } from "./stages";
import type { FeedEngineContext } from "./types";

export interface GetNextFeedItemInput {
  userId: UserId;
  subjectId: SubjectId;
  sessionId: StudySessionId;
  knowledgeSourceId?: KnowledgeSourceId;
  session?: StudySession;
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

  void trackAnalyticsEvent({
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

  const feedItem = await buildFeedItem({
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
  const session =
    input.session ??
    (await assertSessionReadyForStudy(input.userId, input.sessionId));

  if (session.subjectId && session.subjectId !== input.subjectId) {
    throw new FeedEngineError(
      "La sessione non appartiene alla materia richiesta.",
      "SESSION_SUBJECT_MISMATCH",
      409
    );
  }

  const [subject, atoms, sessionEvents] = await Promise.all([
    findSubjectById(input.subjectId),
    input.knowledgeSourceId
      ? findAtomsByKnowledgeSourceId(input.knowledgeSourceId)
      : findAtomsBySubjectId(input.subjectId),
    findRecentSessionEventsBySessionId(session.id, 50),
  ]);

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

  const scopedAtoms = atoms;

  const [userAtomStates, cards] = await Promise.all([
    ensureUserAtomStates(input.userId, scopedAtoms),
    findCardsByAtomIds(scopedAtoms.map((atom) => atom.id)),
  ]);

  const cardsByAtomId = groupCardsByAtom(cards);
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const userCardStatesList = await findUserCardStatesByUserAndCardIds(
    input.userId,
    cards.map((card) => card.id)
  );
  const userCardStates = new Map(
    userCardStatesList.map((state) => [state.cardId, state])
  );

  const lastCardType = resolveLastCardType(sessionEvents, cardsById);
  const recentCardTypes = resolveRecentCardTypes(sessionEvents, cardsById);
  const recentAtomIds = resolveRecentAtomIds(sessionEvents);
  const recentAtomCounts = resolveRecentAtomCounts(sessionEvents);
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
    recentAtomCounts,
    knowledgeSourceExposure,
    now: new Date(),
  };
}

async function ensureUserAtomStates(
  userId: UserId,
  atoms: Atom[]
): Promise<Map<string, UserAtomState>> {
  const atomIds = atoms.map((atom) => atom.id);
  const existingStates = await findUserAtomStatesByUserAndAtomIds(
    userId,
    atomIds
  );
  const existingAtomIds = new Set(existingStates.map((state) => state.atomId));
  const stateByAtomId = new Map(
    existingStates.map((state) => [state.atomId, state])
  );

  const missingAtoms = atoms.filter((atom) => !existingAtomIds.has(atom.id));
  if (missingAtoms.length > 0) {
    const createdStates = await Promise.all(
      missingAtoms.map((atom) => {
        const prerequisitesSatisfied = prerequisitesMet(
          atom.prerequisites,
          stateByAtomId
        );

        return upsertUserAtomState({
          userId,
          atomId: atom.id,
          currentStage: initialLearningStage(prerequisitesSatisfied),
        });
      })
    );

    for (const created of createdStates) {
      stateByAtomId.set(created.atomId, created);
      existingAtomIds.add(created.atomId);
    }
  }

  const stageUpdates = atoms
    .map((atom) => {
      const state = stateByAtomId.get(atom.id);
      if (!state) {
        return null;
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
        return upsertUserAtomState({
          userId,
          atomId: atom.id,
          currentStage: desiredStage,
        });
      }

      return null;
    })
    .filter((promise): promise is Promise<UserAtomState> => promise !== null);

  if (stageUpdates.length > 0) {
    const updatedStates = await Promise.all(stageUpdates);
    for (const updated of updatedStates) {
      stateByAtomId.set(updated.atomId, updated);
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
        recentAtomCounts: context.recentAtomCounts,
        knowledgeSourceExposure: context.knowledgeSourceExposure,
      });
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate)
    );

  const bestCandidate = selectBestCandidate(
    filterCandidatesForSessionVariety(candidates, {
      recentAtomCounts: context.recentAtomCounts,
      recentAtomIds: context.recentAtomIds,
      recentCardTypes: context.recentCardTypes,
      cardsByAtomId: context.cardsByAtomId,
      userCardStates: context.userCardStates,
    }),
    context.recentAtomIds,
    context.recentAtomCounts
  );
  if (!bestCandidate) {
    return null;
  }

  const cards = context.cardsByAtomId.get(bestCandidate.atom.id) ?? [];
  const card = selectCardForAtom({
    cards,
    atomState: bestCandidate.state,
    stage: bestCandidate.stage,
    userCardStates: context.userCardStates,
    userAtomStates: context.userAtomStates,
    lastCardType: context.lastCardType,
    recentCardTypes: context.recentCardTypes,
    atomDifficulty: bestCandidate.atom.difficulty,
  });

  if (!card) {
    return null;
  }

  return { candidate: bestCandidate, card };
}

async function buildFeedItem(input: {
  context: FeedEngineContext;
  atom: Atom;
  card: Card;
  masteryBefore: number;
}): Promise<FeedItem> {
  const { context, atom, card, masteryBefore } = input;
  const sessionTarget = getSessionTargetCards();
  const totalAtoms = context.atoms.length;
  const masteredCount = [...context.userAtomStates.values()].filter(
    (state) => state.mastery >= MASTERY_STABLE_THRESHOLD
  ).length;
  let imageUrl: string | null = null;
  let imageCaption: string | null = null;

  if (card.type === CardType.ImageExplain) {
    const imageId = getImageIdFromPayload(card.payload);
    if (imageId) {
      imageUrl = await resolveFeedImageUrl(context.userId, imageId as ImageId);
      imageCaption = card.prompt?.trim() || null;
    }
  } else if (card.type === CardType.Explain) {
    const imageReference = atom.images[0];
    if (imageReference?.imageId) {
      imageUrl = await resolveFeedImageUrl(
        context.userId,
        imageReference.imageId
      );
      imageCaption = imageReference.caption?.trim() || null;
    }
  }

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
    imageUrl,
    imageCaption,
  };
}

async function resolveFeedImageUrl(
  userId: UserId,
  imageId: ImageId
): Promise<string | null> {
  try {
    const resolved = await getImageSignedUrlForUser(userId, imageId);
    return resolved.url;
  } catch {
    return null;
  }
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
  events: SessionEvent[],
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
  events: SessionEvent[],
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

function resolveRecentAtomCounts(
  events: SessionEvent[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (event.type !== SessionEventType.OpenCard || !event.atomId) {
      continue;
    }

    counts.set(event.atomId, (counts.get(event.atomId) ?? 0) + 1);
  }

  return counts;
}

function resolveRecentAtomIds(
  events: SessionEvent[],
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
