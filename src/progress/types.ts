import type { FeedResponse } from "@/domain/entities/feed-item";
import type { UserAtomState, UserCardState } from "@/domain/entities";
import type { Progress } from "@/domain/entities/progress";
import type { SessionEventOutcome } from "@/domain/enums";
import type {
  AtomId,
  CardId,
  KnowledgeSourceId,
  SessionEventId,
  StudySessionId,
  UserId,
} from "@/domain/ids";

export interface RecordCardResponseInput {
  userId: UserId;
  sessionId: StudySessionId;
  cardId: CardId;
  atomId: AtomId;
  outcome: SessionEventOutcome;
  isCorrect?: boolean;
  responseTimeMs?: number;
  durationMs?: number;
  declaredConfidence?: number;
  feedPosition?: number;
  includeNextFeed?: boolean;
  knowledgeSourceId?: KnowledgeSourceId;
}

export interface MasteryUpdate {
  masteryDelta: number;
  comprehensionDelta: number;
  confidenceDelta: number;
  decayDelta: number;
  streakAfter: number;
  wasCorrect: boolean;
  wasSkipped: boolean;
}

export interface RecordCardResponseResult {
  sessionEventId: SessionEventId;
  atomState: UserAtomState;
  cardState: UserCardState;
  masteryBefore: number;
  masteryAfter: number;
  masteryDelta: number;
  unlockedAtomIds: AtomId[];
  subjectProgress: Progress | null;
  nextFeed?: FeedResponse;
}
