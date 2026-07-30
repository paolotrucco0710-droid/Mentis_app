import type { SessionEvent, StudySession } from "@/domain/entities";
import { SessionEventType } from "@/domain/enums";
import { SessionStatus } from "./types";

export function resolveSessionStatus(
  session: StudySession,
  events: SessionEvent[]
): SessionStatus {
  if (session.endedAt) {
    return SessionStatus.Ended;
  }

  const lastLifecycleEvent = findLastLifecycleEvent(events);
  if (lastLifecycleEvent?.type === SessionEventType.Pause) {
    return SessionStatus.Paused;
  }

  return SessionStatus.Active;
}

export function resolvePausedAt(
  session: StudySession,
  events: SessionEvent[]
): Date | null {
  if (session.endedAt) {
    return null;
  }

  const lastLifecycleEvent = findLastLifecycleEvent(events);
  if (lastLifecycleEvent?.type === SessionEventType.Pause) {
    return lastLifecycleEvent.timestamp;
  }

  return null;
}

export function assertSessionActionable(
  session: StudySession,
  events: SessionEvent[],
  action: "pause" | "resume" | "study"
): SessionStatus {
  const status = resolveSessionStatus(session, events);

  if (status === SessionStatus.Ended) {
    throw new Error("SESSION_ENDED");
  }

  if (action === "pause" && status === SessionStatus.Paused) {
    throw new Error("SESSION_ALREADY_PAUSED");
  }

  if (action === "resume" && status === SessionStatus.Active) {
    throw new Error("SESSION_NOT_PAUSED");
  }

  if (action === "study" && status === SessionStatus.Paused) {
    throw new Error("SESSION_PAUSED");
  }

  return status;
}

function findLastLifecycleEvent(
  events: SessionEvent[]
): SessionEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (
      event.type === SessionEventType.Pause ||
      event.type === SessionEventType.Resume ||
      event.type === SessionEventType.Exit
    ) {
      return event;
    }
  }

  return null;
}
