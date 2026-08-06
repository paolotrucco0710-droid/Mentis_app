import type { FeedResponse } from "@/domain/entities/feed-item";
import type { SessionEventOutcome } from "@/domain/enums";
import type {
  AtomId,
  CardId,
  KnowledgeSourceId,
  SessionEventId,
  StudySessionId,
} from "@/domain/ids";
import type { UserAtomState, UserCardState } from "@/domain/entities";
import type { Progress } from "@/domain/entities/progress";
import { apiFetch } from "./client";

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

export interface SubmitCardResponseInput {
  sessionId: StudySessionId;
  cardId: CardId;
  atomId: AtomId;
  outcome: SessionEventOutcome;
  isCorrect?: boolean;
  responseTimeMs?: number;
  durationMs?: number;
  feedPosition?: number;
  includeNextFeed?: boolean;
  knowledgeSourceId?: KnowledgeSourceId;
}

export async function submitCardResponse(
  input: SubmitCardResponseInput
): Promise<RecordCardResponseResult> {
  return apiFetch<RecordCardResponseResult>("/api/v1/progress/responses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
