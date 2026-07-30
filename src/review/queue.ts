import { findScheduledReviewsByUserId } from "@/db/repositories/reviews";
import { findAtomById } from "@/db/repositories/atoms";
import { findUserAtomStatesByUserId } from "@/db/repositories/user-atom-states";
import type { Review } from "@/domain/entities";
import type { UserAtomState } from "@/domain/entities";
import type { SubjectId, UserId } from "@/domain/ids";
import { computeForgetProbability } from "@/engine/decay";
import { computeOverdueHours, computeReviewPriority } from "./priority";
import { scheduleReviewForAtom } from "./scheduler";
import type { DailyReviewPlan, ReviewQueue, ReviewQueueItem } from "./types";
import { DAILY_REVIEW_HORIZON_HOURS } from "./types";

export async function syncReviewsForUser(userId: UserId): Promise<number> {
  const states = await findUserAtomStatesByUserId(userId);
  let synced = 0;

  for (const state of states) {
    if (state.exposureCount === 0) {
      continue;
    }

    const review = await scheduleReviewForAtom({
      userId,
      atomId: state.atomId,
      atomState: state,
    });

    if (review) {
      synced += 1;
    }
  }

  return synced;
}

export async function getReviewQueue(input: {
  userId: UserId;
  subjectId?: SubjectId | null;
  now?: Date;
}): Promise<ReviewQueue> {
  await syncReviewsForUser(input.userId);

  const now = input.now ?? new Date();
  const [reviews, states] = await Promise.all([
    findScheduledReviewsByUserId(input.userId),
    findUserAtomStatesByUserId(input.userId),
  ]);
  const stateByAtomId = new Map(states.map((state) => [state.atomId, state]));

  const items = (
    await Promise.all(
      reviews.map((review) =>
        enrichReviewItem(review, now, stateByAtomId.get(review.atomId) ?? null)
      )
    )
  ).filter((item): item is ReviewQueueItem => Boolean(item));

  const filtered = input.subjectId
    ? items.filter((item) => item.subjectId === input.subjectId)
    : items;

  const sorted = [...filtered].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return left.scheduledAt.getTime() - right.scheduledAt.getTime();
  });

  const due: ReviewQueueItem[] = [];
  const overdue: ReviewQueueItem[] = [];
  const upcoming: ReviewQueueItem[] = [];

  for (const item of sorted) {
    if (item.overdue) {
      overdue.push(item);
      continue;
    }

    if (item.scheduledAt <= now) {
      due.push(item);
      continue;
    }

    upcoming.push(item);
  }

  return {
    due,
    overdue,
    upcoming,
    totalScheduled: sorted.length,
  };
}

export async function generateDailyReview(input: {
  userId: UserId;
  subjectId?: SubjectId | null;
  now?: Date;
}): Promise<DailyReviewPlan> {
  const now = input.now ?? new Date();
  const queue = await getReviewQueue({
    userId: input.userId,
    subjectId: input.subjectId,
    now,
  });

  const horizonMs = DAILY_REVIEW_HORIZON_HOURS * 3_600_000;
  const endOfDay = new Date(now.getTime() + horizonMs);

  const upcomingToday = queue.upcoming.filter(
    (item) => item.scheduledAt <= endOfDay
  );

  const allDue = [...queue.overdue, ...queue.due, ...upcomingToday];
  const estimatedMinutes = Math.max(
    Math.round(allDue.length * 1.5),
    allDue.length > 0 ? 1 : 0
  );

  return {
    date: now.toISOString().slice(0, 10),
    dueNow: queue.due,
    overdue: queue.overdue,
    upcomingToday,
    totalDue: allDue.length,
    estimatedMinutes,
  };
}

async function enrichReviewItem(
  review: Review,
  now: Date,
  state: UserAtomState | null
): Promise<ReviewQueueItem | null> {
  if (!state) {
    return null;
  }

  const atom = await findAtomById(review.atomId);
  if (!atom) {
    return null;
  }

  const overdueHours = computeOverdueHours(review.scheduledAt, now);
  const priority = computeReviewPriority({
    atom,
    state,
    now,
    scheduledAt: review.scheduledAt,
  });

  return {
    review,
    atomId: atom.id,
    atomTitle: atom.title,
    subjectId: atom.subjectId,
    priority,
    overdue: overdueHours > 0,
    overdueHours,
    scheduledAt: review.scheduledAt,
    mastery: state.mastery,
    forgetProbability: computeForgetProbability(state, now),
  };
}
