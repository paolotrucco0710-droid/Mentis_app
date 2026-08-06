import type { UserStatisticsView } from "@/profile/types";

export function computeDailyXp(statistics: UserStatisticsView["today"]): number {
  return statistics.cardsCompleted * 10 + statistics.atomsCompleted * 25;
}
