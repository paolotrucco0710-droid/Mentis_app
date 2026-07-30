import type { StudySessionId } from "@/domain/ids";
import type { SessionEvent } from "@/domain/entities";
import type { SessionEventOutcome, SessionEventType } from "@/domain/enums";
import { prisma } from "../client";
import { toSessionEvent } from "../mappers";

export interface CreateSessionEventInput {
  sessionId: StudySessionId;
  type: SessionEventType;
  atomId?: string | null;
  cardId?: string | null;
  durationMs?: number | null;
  outcome?: SessionEventOutcome | null;
  declaredConfidence?: number | null;
  responseTimeMs?: number | null;
  feedPosition?: number | null;
  swipeCount?: number | null;
  timestamp?: Date;
}

export async function createSessionEvent(
  input: CreateSessionEventInput
): Promise<SessionEvent> {
  const record = await prisma.sessionEvent.create({ data: input });
  return toSessionEvent(record);
}

export async function findSessionEventsBySessionId(
  sessionId: StudySessionId
): Promise<SessionEvent[]> {
  const records = await prisma.sessionEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });
  return records.map(toSessionEvent);
}
