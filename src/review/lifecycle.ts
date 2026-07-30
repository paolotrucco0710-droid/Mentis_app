import {
  completeReview,
  findReviewById,
} from "@/db/repositories/reviews";
import {
  findUserAtomState,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import { ReviewOutcome, ReviewStatus } from "@/domain/enums";
import type { ReviewId, UserId } from "@/domain/ids";
import { estimateNextReviewAt } from "@/engine/scheduler";
import { ReviewEngineError } from "./errors";
import { computeReviewOutcomePatch } from "@/progress/mastery";
import { rescheduleAfterCompletion } from "./scheduler";
import type { CompleteReviewResult } from "./types";

export async function completeReviewForUser(
  userId: UserId,
  reviewId: ReviewId,
  outcome: ReviewOutcome
): Promise<CompleteReviewResult> {
  const review = await findReviewById(reviewId);
  if (!review || review.userId !== userId) {
    throw new ReviewEngineError(
      "Revisione non trovata.",
      "REVIEW_NOT_FOUND",
      404
    );
  }

  if (review.status !== ReviewStatus.Scheduled) {
    throw new ReviewEngineError(
      "La revisione non è più programmata.",
      "REVIEW_NOT_SCHEDULED",
      409
    );
  }

  const completed = await completeReview(reviewId, outcome);
  const atomState = await findUserAtomState(userId, review.atomId);

  if (!atomState) {
    return { review: completed, rescheduledReview: null };
  }

  const wasSuccessful = outcome === ReviewOutcome.Success;
  const now = new Date();
  const reviewPatch = computeReviewOutcomePatch(atomState, wasSuccessful);
  const nextReviewAt = estimateNextReviewAt(
    {
      ...atomState,
      ...reviewPatch,
      lastViewedAt: now,
    },
    now
  );

  const updatedAtomState = await upsertUserAtomState({
    userId,
    atomId: review.atomId,
    ...reviewPatch,
    lastViewedAt: now,
    nextReviewAt,
    lastAlgorithmUsed: "review-v1",
  });

  const rescheduledReview = await rescheduleAfterCompletion({
    userId,
    atomId: review.atomId,
    atomState: updatedAtomState,
    wasSuccessful,
    now,
  });

  return {
    review: completed,
    rescheduledReview,
  };
}
