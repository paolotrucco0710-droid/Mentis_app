import type { AtomId, ReviewId, UserId } from "../ids";
import type { ReviewOutcome, ReviewStatus } from "../enums";

export interface Review {
  id: ReviewId;
  userId: UserId;
  atomId: AtomId;
  scheduledAt: Date;
  completedAt: Date | null;
  outcome: ReviewOutcome | null;
  algorithm: string;
  priority: number;
  status: ReviewStatus;
}
