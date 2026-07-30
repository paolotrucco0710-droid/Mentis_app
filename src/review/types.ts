import type { Atom, Review } from "@/domain/entities";

export const REVIEW_ALGORITHM_VERSION = "review-v1";

/** Reviews scheduled within this window appear in the daily plan. */
export const DAILY_REVIEW_HORIZON_HOURS = 24;

export interface ReviewQueueItem {
  review: Review;
  atomId: Atom["id"];
  atomTitle: string;
  subjectId: Atom["subjectId"];
  priority: number;
  overdue: boolean;
  overdueHours: number;
  scheduledAt: Date;
  mastery: number;
  forgetProbability: number;
}

export interface ReviewQueue {
  due: ReviewQueueItem[];
  overdue: ReviewQueueItem[];
  upcoming: ReviewQueueItem[];
  totalScheduled: number;
}

export interface DailyReviewPlan {
  date: string;
  dueNow: ReviewQueueItem[];
  overdue: ReviewQueueItem[];
  upcomingToday: ReviewQueueItem[];
  totalDue: number;
  estimatedMinutes: number;
}

export interface CompleteReviewInput {
  outcome: "success" | "partial" | "failure";
}

export interface CompleteReviewResult {
  review: Review;
  rescheduledReview: Review | null;
}
