import type { UserId } from "../ids";
import type { Score0To100 } from "../enums";

export interface DailyStatistics {
  userId: UserId;
  date: string;
  studyTimeMs: number;
  cardsCompleted: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  accuracy: Score0To100;
  averageFocus: Score0To100 | null;
  averageMastery: Score0To100 | null;
  dailyStreak: number;
  activityLevel: number;
}
