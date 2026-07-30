import type { StudySession } from "@/domain/entities";
import type { Score0To100 } from "@/domain/enums";

export enum SessionStatus {
  Active = "active",
  Paused = "paused",
  Ended = "ended",
}

export interface SessionMetrics {
  accuracy: Score0To100;
  activeDurationMs: number;
  pauseCount: number;
  totalPauseMs: number;
  cardsPerMinute: number;
  focusScore: Score0To100;
  fatigueScore: Score0To100;
}

export interface SessionDetail {
  session: StudySession;
  status: SessionStatus;
  metrics: SessionMetrics;
  pausedAt: Date | null;
}

export interface EndSessionInput {
  finalMotivation?: number | null;
  focusScore?: number | null;
  fatigueScore?: number | null;
}

export interface EndSessionResult {
  session: StudySession;
  status: SessionStatus;
  metrics: SessionMetrics;
}

export interface OpenSessionInput {
  subjectId: string;
  device?: string | null;
  appVersion?: string | null;
  initialMotivation?: number | null;
}
