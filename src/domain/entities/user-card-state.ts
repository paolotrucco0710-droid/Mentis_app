import type { CardId, UserId } from "../ids";
import type { Score0To1 } from "../enums";

/**
 * Per-user state for a single Card interaction history.
 * Identified uniquely by (userId, cardId).
 */
export interface UserCardState {
  userId: UserId;
  cardId: CardId;
  viewCount: number;
  correctAnswerCount: number;
  wrongAnswerCount: number;
  averageResponseTimeMs: number | null;
  lastAnsweredAt: Date | null;
  confidence: Score0To1;
  perceivedDifficulty: Score0To1;
  skipped: boolean;
  liked: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
