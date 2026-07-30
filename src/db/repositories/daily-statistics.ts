import type { UserId } from "@/domain/ids";
import type { DailyStatistics } from "@/domain/entities";
import { prisma } from "../client";
import { toDailyStatistics } from "../mappers";

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
  input: UpsertDailyStatisticsInput
): Promise<DailyStatistics> {
  const record = await prisma.dailyStatistics.upsert({
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
