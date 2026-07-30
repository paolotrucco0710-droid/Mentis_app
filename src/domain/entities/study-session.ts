import type { StudySessionId, SubjectId, UserId } from "../ids";
import type { Score0To100 } from "../enums";

export interface StudySession {
  id: StudySessionId;
  userId: UserId;
  subjectId: SubjectId | null;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null;
  cardsViewed: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  errorCount: number;
  correctAnswerCount: number;
  focusScore: Score0To100 | null;
  fatigueScore: Score0To100 | null;
  initialMotivation: Score0To100 | null;
  finalMotivation: Score0To100 | null;
  device: string | null;
  appVersion: string | null;
}
