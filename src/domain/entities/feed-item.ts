import type {
  AtomId,
  ChapterId,
  CourseId,
  StudySessionId,
  SubjectId,
} from "../ids";
import type { Card } from "./card";
import type { Score0To100, Score0To1 } from "../enums";

/**
 * Single item returned by the Feed Engine.
 * The feed is never persisted — built in real time (Capitolo 5).
 */
export interface FeedItem {
  card: Card;
  atomId: AtomId;
  atomTitle: string;
  subjectId: SubjectId;
  courseId: CourseId | null;
  chapterId: ChapterId | null;
  sessionId: StudySessionId;
  position: number;
  sessionProgress: Score0To1;
  chapterProgress: Score0To1 | null;
  estimatedDurationSeconds: number;
  masteryBefore: Score0To100 | null;
  imageUrl?: string | null;
  imageCaption?: string | null;
}

export interface FeedResponse {
  item: FeedItem | null;
  sessionComplete: boolean;
  rewards: FeedReward[];
  notifications: FeedNotification[];
}

export interface FeedReward {
  type: string;
  label: string;
  value: number | null;
}

export interface FeedNotification {
  type: string;
  message: string;
}
