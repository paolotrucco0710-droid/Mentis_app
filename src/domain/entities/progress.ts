import type { UserId } from "../ids";
import type { Score0To100 } from "../enums";

export enum ProgressScopeType {
  Subject = "subject",
  Course = "course",
  Chapter = "chapter",
}

/**
 * Aggregated progress view — reconstructible from UserAtomState (Principio 3).
 * Used for API responses and UI, not necessarily persisted.
 */
export interface Progress {
  userId: UserId;
  scopeType: ProgressScopeType;
  scopeId: string;
  masteryPercent: Score0To100;
  atomsTotal: number;
  atomsMastered: number;
  atomsRemaining: number;
  completionPercent: Score0To100;
  lastStudiedAt: Date | null;
  memoryHealth: Score0To100 | null;
}
