import type { UserId } from "@/domain/ids";
import type { DailyStatistics } from "@/domain/entities";
import { prisma } from "../client";
import { getDb, type DbTx } from "../transaction";
import { toDailyStatistics } from "../mappers";
import { formatDateOnly } from "../mappers/helpers";

export interface UpsertDailyStatisticsInput {
  userId: UserId;
  date: Date;
  studyTimeMs: number;
  cardsCompleted: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  accuracy: number;
  averageMastery: number;
  dailyStreak: number;
  activityLevel: number;
}

export async function upsertDailyStatistics(
  input: UpsertDailyStatisticsInput,
  tx?: DbTx
): Promise<DailyStatistics> {
  const record = await getDb(tx).dailyStatistics.upsert({
    where: {
      userId_date: {
        userId: input.userId,
        date: input.date,
      },
    },
    create: {
      userId: input.userId,
      date: input.date,
      studyTimeMs: BigInt(input.studyTimeMs),
      cardsCompleted: input.cardsCompleted,
      atomsCompleted: input.atomsCompleted,
      reviewsCompleted: input.reviewsCompleted,
      accuracy: input.accuracy,
      averageMastery: input.averageMastery,
      dailyStreak: input.dailyStreak,
      activityLevel: input.activityLevel,
    },
    update: {
      studyTimeMs: BigInt(input.studyTimeMs),
      cardsCompleted: input.cardsCompleted,
      atomsCompleted: input.atomsCompleted,
      reviewsCompleted: input.reviewsCompleted,
      accuracy: input.accuracy,
      averageMastery: input.averageMastery,
      dailyStreak: input.dailyStreak,
      activityLevel: input.activityLevel,
    },
  });

  return toDailyStatistics(record);
}

export async function findDailyStatistics(
  userId: UserId,
  date: Date
): Promise<DailyStatistics | null> {
  const record = await prisma.dailyStatistics.findUnique({
    where: { userId_date: { userId, date } },
  });
  return record ? toDailyStatistics(record) : null;
}

export async function findDailyStatisticsByUserId(
  userId: UserId,
  options?: { from?: Date; to?: Date; limit?: number }
): Promise<DailyStatistics[]> {
  const records = await prisma.dailyStatistics.findMany({
    where: {
      userId,
      ...(options?.from || options?.to
        ? {
            date: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: options?.limit,
  });
  return records.map(toDailyStatistics);
}

export async function sumDailyStatisticsByUserId(
  userId: UserId
): Promise<{
  totalStudyTimeMs: number;
  totalCardsCompleted: number;
  totalAtomsCompleted: number;
  totalReviewsCompleted: number;
}> {
  const aggregate = await prisma.dailyStatistics.aggregate({
    where: { userId },
    _sum: {
      studyTimeMs: true,
      cardsCompleted: true,
      atomsCompleted: true,
      reviewsCompleted: true,
    },
  });

  return {
    totalStudyTimeMs: Number(aggregate._sum.studyTimeMs ?? 0),
    totalCardsCompleted: aggregate._sum.cardsCompleted ?? 0,
    totalAtomsCompleted: aggregate._sum.atomsCompleted ?? 0,
    totalReviewsCompleted: aggregate._sum.reviewsCompleted ?? 0,
  };
}

export function toDateOnly(date: Date): Date {
  return new Date(formatDateOnly(date));
}
