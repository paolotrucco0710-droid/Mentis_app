import type {
  ChapterId,
  KnowledgeSourceId,
  StudySessionId,
  SubjectId,
} from "@/domain/ids";
import type { SessionStatus } from "@/session/types";

export type HomeContinueReason =
  | "paused_session"
  | "active_session"
  | "last_chapter"
  | "recent_chapter"
  | "none";

export interface HomeContinueChapter {
  id: ChapterId;
  title: string;
  subjectId: SubjectId;
  subjectName: string;
  knowledgeSourceId: KnowledgeSourceId;
  atomCount: number;
}

export interface HomeContinueSession {
  id: StudySessionId;
  status: SessionStatus;
  cardsViewed: number;
}

export interface HomeContinueContext {
  canContinue: boolean;
  reason: HomeContinueReason;
  chapter: HomeContinueChapter | null;
  session: HomeContinueSession | null;
  feedHref: string | null;
}
