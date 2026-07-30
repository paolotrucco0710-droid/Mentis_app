import type { AtomId, ReviewId, UserId } from "@/domain/ids";
import type { Review } from "@/domain/entities";
import type { ReviewOutcome, ReviewStatus } from "@/domain/enums";
import { prisma } from "../client";
import { toReview } from "../mappers";

export interface CreateReviewInput {
  userId: UserId;
  atomId: AtomId;
  scheduledAt: Date;
  algorithm: string;
  priority?: number;
  status?: ReviewStatus;
}

export async function findReviewById(id: ReviewId): Promise<Review | null> {
  const record = await prisma.review.findUnique({ where: { id } });
  return record ? toReview(record) : null;
}

export async function findDueReviewsByUserId(
  userId: UserId,
  before: Date = new Date()
): Promise<Review[]> {
  const records = await prisma.review.findMany({
    where: {
      userId,
      status: "scheduled",
      scheduledAt: { lte: before },
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
  });
  return records.map(toReview);
}

export async function findScheduledReviewsByUserId(
  userId: UserId
): Promise<Review[]> {
  const records = await prisma.review.findMany({
    where: { userId, status: "scheduled" },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
  });
  return records.map(toReview);
}

export async function findScheduledReviewByUserAndAtom(
  userId: UserId,
  atomId: AtomId
): Promise<Review | null> {
  const record = await prisma.review.findFirst({
    where: { userId, atomId, status: "scheduled" },
    orderBy: { scheduledAt: "desc" },
  });
  return record ? toReview(record) : null;
}

export async function upsertScheduledReview(
  input: CreateReviewInput
): Promise<Review> {
  const existing = await findScheduledReviewByUserAndAtom(
    input.userId,
    input.atomId
  );

  if (existing) {
    const record = await prisma.review.update({
      where: { id: existing.id },
      data: {
        scheduledAt: input.scheduledAt,
        priority: input.priority ?? existing.priority,
        algorithm: input.algorithm,
      },
    });
    return toReview(record);
  }

  return createReview(input);
}

export async function cancelScheduledReviewsForAtom(
  userId: UserId,
  atomId: AtomId
): Promise<number> {
  const result = await prisma.review.updateMany({
    where: { userId, atomId, status: "scheduled" },
    data: { status: "cancelled" },
  });
  return result.count;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const record = await prisma.review.create({ data: input });
  return toReview(record);
}

export async function completeReview(
  id: ReviewId,
  outcome: ReviewOutcome,
  completedAt: Date = new Date()
): Promise<Review> {
  const record = await prisma.review.update({
    where: { id },
    data: {
      status: "completed",
      outcome,
      completedAt,
    },
  });
  return toReview(record);
}
