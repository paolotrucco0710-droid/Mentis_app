"use client";

import type { UserStatisticsView } from "@/profile/types";
import { Card, CardDescription, CardHeader, CardTitle, ProgressBar } from "@/components/ui";

export function ProfileStatsGrid({
  statistics,
}: {
  statistics: UserStatisticsView;
}) {
  const masteryValue = statistics.lifetime.averageMastery;
  const goalValue = statistics.today.dailyGoalProgressPercent;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
          <CardDescription>
            {statistics.streak.current > 0
              ? `${statistics.streak.current} giorni consecutivi`
              : "Inizia oggi il tuo streak"}
          </CardDescription>
        </CardHeader>
        <ProgressBar value={Math.min(statistics.streak.current * 10, 100)} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mastery media</CardTitle>
          <CardDescription>Su tutti gli atomi studiati</CardDescription>
        </CardHeader>
        <ProgressBar value={masteryValue} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Obiettivo giornaliero</CardTitle>
          <CardDescription>
            {statistics.today.dailyGoalMinutes
              ? `${statistics.today.dailyGoalMinutes} minuti`
              : "Non impostato"}
          </CardDescription>
        </CardHeader>
        <ProgressBar value={goalValue} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Memoria</CardTitle>
          <CardDescription>Salute della memoria a lungo termine</CardDescription>
        </CardHeader>
        <ProgressBar value={statistics.lifetime.memoryHealth ?? 0} />
      </Card>
    </div>
  );
}
