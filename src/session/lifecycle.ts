import {
  createStudySession,
  endStudySession,
  findStudySessionById,
} from "@/db/repositories/study-sessions";
import {
  createSessionEvent,
  findSessionEventsBySessionId,
} from "@/db/repositories/session-events";
import { findSubjectById } from "@/db/repositories/subjects";
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

  return createStudySession({
    userId,
    subjectId: input.subjectId as SubjectId,
    device: input.device ?? null,
    appVersion: input.appVersion ?? null,
    initialMotivation: input.initialMotivation ?? null,
  });
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

  if (status === SessionStatus.Paused) {
    throw new SessionEngineError(
      "La sessione è già in pausa.",
      "SESSION_ALREADY_PAUSED",
      409
    );
  }

  await createSessionEvent({
    sessionId,
    type: SessionEventType.Pause,
    outcome: SessionEventOutcome.Neutral,
  });

  return getSessionDetail(userId, sessionId);
}

export async function resumeSession(
  userId: UserId,
  sessionId: StudySessionId
): Promise<SessionDetail> {
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

  if (status === SessionStatus.Active) {
    throw new SessionEngineError(
      "La sessione non è in pausa.",
      "SESSION_NOT_PAUSED",
      409
    );
  }

  await createSessionEvent({
    sessionId,
    type: SessionEventType.Resume,
    outcome: SessionEventOutcome.Neutral,
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
  const events = await findSessionEventsBySessionId(sessionId);
  const status = resolveSessionStatus(session, events);

  if (status === SessionStatus.Ended) {
    throw new SessionEngineError(
      "La sessione di studio è già terminata.",
      "SESSION_ENDED",
      409
    );
  }

  if (status === SessionStatus.Paused) {
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
