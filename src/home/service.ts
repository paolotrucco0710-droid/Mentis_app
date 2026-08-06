import { countAtomsByKnowledgeSourceId, findAtomById } from "@/db/repositories/atoms";
import { findChapterByKnowledgeSourceId } from "@/db/repositories/chapters";
import { findKnowledgeSourceById } from "@/db/repositories/knowledge-sources";
import { findSessionEventsBySessionId } from "@/db/repositories/session-events";
import { findOpenStudySessionsByUserId } from "@/db/repositories/study-sessions";
import { findSubjectById } from "@/db/repositories/subjects";
import { findMostRecentlyViewedUserAtomState } from "@/db/repositories/user-atom-states";
import { getLibraryOverview } from "@/course";
import type { ChapterWithSource } from "@/course/types";
import type { SessionEvent } from "@/domain/entities";
import type { AtomId, KnowledgeSourceId, UserId } from "@/domain/ids";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import { resolveSessionStatus } from "@/session/state";
import { SessionStatus } from "@/session/types";
import type {
  HomeContinueChapter,
  HomeContinueContext,
  HomeContinueReason,
  HomeContinueSession,
} from "./types";

function isChapterStudyReady(chapter: ChapterWithSource): boolean {
  return (
    chapter.atomCount > 0 &&
    chapter.knowledgeSource.processingStatus ===
      KnowledgeSourceProcessingStatus.Completed
  );
}

function buildFeedHref(input: {
  subjectId: string;
  knowledgeSourceId: string;
  sessionId?: string;
}): string {
  const params = new URLSearchParams({
    subjectId: input.subjectId,
    knowledgeSourceId: input.knowledgeSourceId,
  });

  if (input.sessionId) {
    params.set("sessionId", input.sessionId);
  }

  return `/feed?${params.toString()}`;
}

function resolveLastSessionAtomId(events: SessionEvent[]): AtomId | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.atomId) {
      return event.atomId as AtomId;
    }
  }

  return null;
}

async function buildChapterContext(
  knowledgeSourceId: KnowledgeSourceId
): Promise<HomeContinueChapter | null> {
  const chapter = await findChapterByKnowledgeSourceId(knowledgeSourceId);
  if (!chapter) {
    return null;
  }

  const [knowledgeSource, subject, atomCount] = await Promise.all([
    findKnowledgeSourceById(chapter.knowledgeSourceId),
    findSubjectById(chapter.subjectId),
    countAtomsByKnowledgeSourceId(chapter.knowledgeSourceId),
  ]);

  if (
    !knowledgeSource ||
    knowledgeSource.deletedAt ||
    knowledgeSource.processingStatus !== KnowledgeSourceProcessingStatus.Completed ||
    atomCount === 0
  ) {
    return null;
  }

  return {
    id: chapter.id,
    title: chapter.title,
    subjectId: chapter.subjectId,
    subjectName: subject?.name ?? "Materia",
    knowledgeSourceId: chapter.knowledgeSourceId,
    atomCount,
  };
}

function buildContext(input: {
  reason: HomeContinueReason;
  chapter: HomeContinueChapter;
  session?: HomeContinueSession | null;
}): HomeContinueContext {
  const session = input.session ?? null;

  return {
    canContinue: true,
    reason: input.reason,
    chapter: input.chapter,
    session,
    feedHref: buildFeedHref({
      subjectId: input.chapter.subjectId,
      knowledgeSourceId: input.chapter.knowledgeSourceId,
      ...(session ? { sessionId: session.id } : {}),
    }),
  };
}

async function resolveFromOpenSession(
  userId: UserId
): Promise<HomeContinueContext | null> {
  const sessions = await findOpenStudySessionsByUserId(userId, 3);

  for (const session of sessions) {
    const events = await findSessionEventsBySessionId(session.id);
    const status = resolveSessionStatus(session, events);

    if (status === SessionStatus.Ended) {
      continue;
    }

    const atomId = resolveLastSessionAtomId(events);
    if (!atomId) {
      continue;
    }

    const atom = await findAtomById(atomId);
    if (!atom) {
      continue;
    }

    const chapter = await buildChapterContext(atom.knowledgeSourceId);
    if (!chapter) {
      continue;
    }

    const continueSession: HomeContinueSession = {
      id: session.id,
      status,
      cardsViewed: session.cardsViewed,
    };

    const reason =
      status === SessionStatus.Paused ? "paused_session" : "active_session";

    if (status === SessionStatus.Paused || session.cardsViewed > 0) {
      return buildContext({
        reason,
        chapter,
        session: continueSession,
      });
    }
  }

  return null;
}

async function resolveFromLastStudiedAtom(
  userId: UserId
): Promise<HomeContinueContext | null> {
  const state = await findMostRecentlyViewedUserAtomState(userId);
  if (!state?.lastViewedAt) {
    return null;
  }

  const atom = await findAtomById(state.atomId);
  if (!atom) {
    return null;
  }

  const chapter = await buildChapterContext(atom.knowledgeSourceId);
  if (!chapter) {
    return null;
  }

  return buildContext({
    reason: "last_chapter",
    chapter,
  });
}

async function resolveFromRecentChapter(
  userId: UserId
): Promise<HomeContinueContext | null> {
  const overview = await getLibraryOverview(userId);
  const chapter = overview.recentChapters.find(isChapterStudyReady);

  if (!chapter) {
    return null;
  }

  const subject = await findSubjectById(chapter.subjectId);

  return buildContext({
    reason: "recent_chapter",
    chapter: {
      id: chapter.id,
      title: chapter.title,
      subjectId: chapter.subjectId,
      subjectName: subject?.name ?? "Materia",
      knowledgeSourceId: chapter.knowledgeSourceId,
      atomCount: chapter.atomCount,
    },
  });
}

export async function getHomeContinueContext(
  userId: UserId
): Promise<HomeContinueContext> {
  const fromSession = await resolveFromOpenSession(userId);
  if (fromSession) {
    return fromSession;
  }

  const fromLastStudied = await resolveFromLastStudiedAtom(userId);
  if (fromLastStudied) {
    return fromLastStudied;
  }

  const fromRecent = await resolveFromRecentChapter(userId);
  if (fromRecent) {
    return fromRecent;
  }

  return {
    canContinue: false,
    reason: "none",
    chapter: null,
    session: null,
    feedHref: null,
  };
}
