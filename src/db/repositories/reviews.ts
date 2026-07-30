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
