import type { StudySessionId } from "@/domain/ids";
import type { SessionEvent } from "@/domain/entities";
import type { SessionEventOutcome } from "@/domain/enums";
import { SessionEventType } from "@/domain/enums";
import { getDb, type DbTx } from "../transaction";
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
  input: CreateSessionEventInput,
  tx?: DbTx
): Promise<SessionEvent> {
  const record = await getDb(tx).sessionEvent.create({ data: input });
  return toSessionEvent(record);
}

export async function findSessionEventsBySessionId(
  sessionId: StudySessionId,
  tx?: DbTx
): Promise<SessionEvent[]> {
  const records = await getDb(tx).sessionEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });
  return records.map(toSessionEvent);
}

export async function findRecentSessionEventsBySessionId(
  sessionId: StudySessionId,
  limit = 50,
  tx?: DbTx
): Promise<SessionEvent[]> {
  const records = await getDb(tx).sessionEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return records.reverse().map(toSessionEvent);
}

export async function findLastLifecycleEventBySessionId(
  sessionId: StudySessionId,
  tx?: DbTx
): Promise<SessionEvent | null> {
  const record = await getDb(tx).sessionEvent.findFirst({
    where: {
      sessionId,
      type: {
        in: [
          SessionEventType.Pause,
          SessionEventType.Resume,
          SessionEventType.Exit,
        ],
      },
    },
    orderBy: { timestamp: "desc" },
  });

  return record ? toSessionEvent(record) : null;
}
