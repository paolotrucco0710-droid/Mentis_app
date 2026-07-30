import { findAtomById } from "@/db/repositories/atoms";
import { upsertScheduledReview } from "@/db/repositories/reviews";
import type { Review, UserAtomState } from "@/domain/entities";
import type { AtomId, UserId } from "@/domain/ids";
import { estimateNextReviewAt } from "@/engine/scheduler";
import { computeReviewPriority } from "./priority";
import { REVIEW_ALGORITHM_VERSION } from "./types";

export async function scheduleReviewForAtom(input: {
  userId: UserId;
  atomId: AtomId;
  atomState: UserAtomState;
  now?: Date;
}): Promise<Review | null> {
  const now = input.now ?? new Date();

  if (input.atomState.exposureCount === 0) {
    return null;
  }

  const atom = await findAtomById(input.atomId);
  if (!atom) {
    return null;
  }

  const scheduledAt =
    input.atomState.nextReviewAt ??
    estimateNextReviewAt(input.atomState, now) ??
    now;

  const priority = computeReviewPriority({
    atom,
    state: input.atomState,
    now,
    scheduledAt,
  });

  return upsertScheduledReview({
    userId: input.userId,
    atomId: input.atomId,
    scheduledAt,
    priority,
    algorithm: REVIEW_ALGORITHM_VERSION,
  });
}

export async function rescheduleAfterCompletion(input: {
  userId: UserId;
  atomId: AtomId;
  atomState: UserAtomState;
  wasSuccessful: boolean;
  now?: Date;
}): Promise<Review | null> {
  const now = input.now ?? new Date();
  const scheduledAt = estimateNextReviewAt(input.atomState, now);

  if (!scheduledAt) {
    return null;
  }

  const atom = await findAtomById(input.atomId);
  if (!atom) {
    return null;
  }

  const priority = computeReviewPriority({
    atom,
    state: input.atomState,
    now,
    scheduledAt,
  });

  if (!input.wasSuccessful) {
    return upsertScheduledReview({
      userId: input.userId,
      atomId: input.atomId,
      scheduledAt: now,
      priority: priority + 20,
      algorithm: REVIEW_ALGORITHM_VERSION,
    });
  }

  return upsertScheduledReview({
    userId: input.userId,
    atomId: input.atomId,
    scheduledAt,
    priority,
    algorithm: REVIEW_ALGORITHM_VERSION,
  });
}
