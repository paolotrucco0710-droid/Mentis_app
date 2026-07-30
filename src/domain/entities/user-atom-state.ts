import type { AtomId, UserId } from "../ids";
import type { Score0To100, Score0To1 } from "../enums";
import type { UserAtomLearningState } from "../enums";

/**
 * Per-user learning state for a single Atom.
 * Identified uniquely by (userId, atomId).
 */
export interface UserAtomState {
  userId: UserId;
  atomId: AtomId;
  mastery: Score0To100;
  confidence: Score0To1;
  currentStage: UserAtomLearningState;
  exposureCount: number;
  errorCount: number;
  correctAnswerCount: number;
  wrongAnswerCount: number;
  lastViewedAt: Date | null;
  nextReviewAt: Date | null;
  averageResponseTimeMs: number | null;
  totalStudyTimeMs: number;
  streak: number;
  estimatedDecay: Score0To1;
  comprehensionLevel: Score0To100;
  lastAlgorithmUsed: string | null;
  createdAt: Date;
  updatedAt: Date;
}
