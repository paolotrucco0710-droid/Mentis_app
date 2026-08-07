import {
  createStudySession,
  endStudySession,
  findStudySessionById,
} from "@/db/repositories/study-sessions";
import {
  createSessionEvent,
  findLastLifecycleEventBySessionId,
  findSessionEventsBySessionId,
  type CreateSessionEventInput,
} from "@/db/repositories/session-events";
import { prisma } from "@/db/client";
import { findSubjectById } from "@/db/repositories/subjects";
import {
  AnalyticsEvents,
  trackAnalyticsEvent,
  trackFunnelMilestoneAsync,
} from "@/analytics";
import type { StudySession } from "@/domain/entities";
import { SessionEventOutcome, SessionEventType } from "@/domain/enums";
import type { StudySessionId, SubjectId, UserId } from "@/domain/ids";
import { SessionEngineError } from "./errors";
import { computeSessionMetrics } from "./metrics";
import { resolvePausedAt, resolveSessionStatus } from "./state";
import type {
  EndSessionInput,
  EndSessionResult,
  OpenSessionInput,
  SessionDetail,
} from "./types";
import { SessionStatus } from "./types";

export async function openSession(
  userId: UserId,
  input: OpenSessionInput
): Promise<StudySession> {
  const subject = await findSubjectById(input.subjectId as SubjectId);
  if (!subject) {
    throw new SessionEngineError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }

  if (subject.userId !== userId) {
    throw new SessionEngineError(
      "Non hai accesso a questa materia.",
      "SUBJECT_FORBIDDEN",
      403
    );
  }

  const session = await createStudySession({
    userId,
    subjectId: input.subjectId as SubjectId,
    device: input.device ?? null,
    appVersion: input.appVersion ?? null,
    initialMotivation: input.initialMotivation ?? null,
  });

  trackAnalyticsEvent({
    userId,
    name: AnalyticsEvents.StudySessionOpened,
    category: "study",
    source: "engine",
    properties: { sessionId: session.id, subjectId: session.subjectId },
  });
  trackFunnelMilestoneAsync({
    userId,
    name: AnalyticsEvents.FunnelFirstStudySession,
    category: "funnel",
    source: "engine",
    properties: { sessionId: session.id },
  });

  return session;
}

export async function getSessionDetail(
  userId: UserId,
  sessionId: StudySessionId
): Promise<SessionDetail> {
  const session = await requireOwnedSession(userId, sessionId);
  const events = await findSessionEventsBySessionId(sessionId);
  const status = resolveSessionStatus(session, events);
  const metrics = computeSessionMetrics({ session, events });

  return {
    session,
    status,
    metrics,
    pausedAt: resolvePausedAt(session, events),
  };
}

export async function pauseSession(
  userId: UserId,
  sessionId: StudySessionId
): Promise<SessionDetail> {
  await appendLifecycleEvent(userId, sessionId, (status) => {
    if (status === SessionStatus.Ended) {
      throw new SessionEngineError(
        "La sessione è già terminata.",
        "SESSION_ENDED",
        409
      );
    }

    if (status === SessionStatus.Paused) {
      throw new SessionEngineError(
        "La sessione è già in pausa.",
        "SESSION_ALREADY_PAUSED",
        409
      );
    }
  }, {
    type: SessionEventType.Pause,
    outcome: SessionEventOutcome.Neutral,
  });

  trackAnalyticsEvent({
    userId,
    name: AnalyticsEvents.StudySessionPaused,
    category: "study",
    source: "engine",
    properties: { sessionId },
  });

  return getSessionDetail(userId, sessionId);
}

export async function resumeSession(
  userId: UserId,
  sessionId: StudySessionId
): Promise<SessionDetail> {
  await appendLifecycleEvent(userId, sessionId, (status) => {
    if (status === SessionStatus.Ended) {
      throw new SessionEngineError(
        "La sessione è già terminata.",
        "SESSION_ENDED",
        409
      );
    }

    if (status === SessionStatus.Active) {
      throw new SessionEngineError(
        "La sessione non è in pausa.",
        "SESSION_NOT_PAUSED",
        409
      );
    }
  }, {
    type: SessionEventType.Resume,
    outcome: SessionEventOutcome.Neutral,
  });

  trackAnalyticsEvent({
    userId,
    name: AnalyticsEvents.StudySessionResumed,
    category: "study",
    source: "engine",
    properties: { sessionId },
  });

  return getSessionDetail(userId, sessionId);
}

export async function endSession(
  userId: UserId,
  sessionId: StudySessionId,
  input: EndSessionInput = {}
): Promise<EndSessionResult> {
  const session = await requireOwnedSession(userId, sessionId);
  const events = await findSessionEventsBySessionId(sessionId);
  const status = resolveSessionStatus(session, events);

  if (status === SessionStatus.Ended) {
    throw new SessionEngineError(
      "La sessione è già terminata.",
      "SESSION_ENDED",
      409
    );
  }

  const endedAt = new Date();
  const metrics = computeSessionMetrics({
    session,
    events,
    endedAt,
  });

  const updatedSession = await endStudySession({
    id: sessionId,
    endedAt,
    durationMs: metrics.activeDurationMs,
    focusScore: input.focusScore ?? metrics.focusScore,
    fatigueScore: input.fatigueScore ?? metrics.fatigueScore,
    finalMotivation: input.finalMotivation ?? null,
  });

  await createSessionEvent({
    sessionId,
    type: SessionEventType.Exit,
    outcome: SessionEventOutcome.Success,
    timestamp: endedAt,
  });

  trackAnalyticsEvent({
    userId,
    name: AnalyticsEvents.StudySessionEnded,
    category: "study",
    source: "engine",
    properties: {
      sessionId,
      durationMs: metrics.activeDurationMs,
      cardsViewed: updatedSession.cardsViewed,
    },
  });

  return {
    session: updatedSession,
    status: SessionStatus.Ended,
    metrics,
  };
}

export async function assertSessionReadyForStudy(
  userId: UserId,
  sessionId: StudySessionId
): Promise<StudySession> {
  const session = await requireOwnedSession(userId, sessionId);

  if (session.endedAt) {
    throw new SessionEngineError(
      "La sessione di studio è già terminata.",
      "SESSION_ENDED",
      409
    );
  }

  const lastLifecycleEvent = await findLastLifecycleEventBySessionId(sessionId);
  if (lastLifecycleEvent?.type === SessionEventType.Pause) {
    throw new SessionEngineError(
      "La sessione è in pausa. Riprendi prima di continuare.",
      "SESSION_PAUSED",
      409
    );
  }

  return session;
}

async function requireOwnedSession(
  userId: UserId,
  sessionId: StudySessionId
): Promise<StudySession> {
  const session = await findStudySessionById(sessionId);
  if (!session || session.userId !== userId) {
    throw new SessionEngineError(
      "Sessione di studio non trovata.",
      "SESSION_NOT_FOUND",
      404
    );
  }

  return session;
}

async function appendLifecycleEvent(
  userId: UserId,
  sessionId: StudySessionId,
  validate: (status: SessionStatus) => void,
  event: Omit<CreateSessionEventInput, "sessionId">
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const session = await findStudySessionById(sessionId, tx);
    if (!session || session.userId !== userId) {
      throw new SessionEngineError(
        "Sessione di studio non trovata.",
        "SESSION_NOT_FOUND",
        404
      );
    }

    const events = await findSessionEventsBySessionId(sessionId, tx);
    const status = resolveSessionStatus(session, events);
    validate(status);

    await createSessionEvent(
      {
        sessionId,
        ...event,
      },
      tx
    );
  });
}
