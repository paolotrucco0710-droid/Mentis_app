import type { AtomId, CardId, SessionEventId, StudySessionId } from "../ids";
import type { SessionEventOutcome, SessionEventType } from "../enums";
import type { Score0To1 } from "../enums";

export interface SessionEvent {
  id: SessionEventId;
  sessionId: StudySessionId;
  timestamp: Date;
  type: SessionEventType;
  atomId: AtomId | null;
  cardId: CardId | null;
  durationMs: number | null;
  outcome: SessionEventOutcome | null;
  declaredConfidence: Score0To1 | null;
  responseTimeMs: number | null;
  feedPosition: number | null;
  swipeCount: number | null;
}
