"use client";

import { Card, CardDescription, CardHeader, CardTitle, FlameIcon, ProgressBar } from "@/components/ui";
import { computeDailyXp } from "@/lib/gamification/xp";
import type { UserStatisticsView } from "@/profile/types";

export function HomeProgressStrip({
  statistics,
}: {
  statistics: UserStatisticsView;
}) {
  const dailyXp = computeDailyXp(statistics.today);
  const streakLabel =
    statistics.streak.current > 0
      ? `${statistics.streak.current} giorni`
      : statistics.streak.studiedToday
        ? "Avviato oggi"
        : "Inizia oggi";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader className="gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Streak</CardDescription>
            <FlameIcon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-2xl">{streakLabel}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="gap-2 p-4">
          <CardDescription>XP oggi</CardDescription>
          <CardTitle className="text-2xl">{dailyXp}</CardTitle>
          <CardDescription>
            {statistics.today.cardsCompleted} card · {statistics.today.atomsCompleted}{" "}
            concetti
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="gap-2 p-4">
          <CardDescription>Obiettivo giornaliero</CardDescription>
          <CardTitle className="text-2xl">
            {statistics.today.dailyGoalMinutes
              ? `${statistics.today.dailyGoalProgressPercent}%`
              : "—"}
          </CardTitle>
          {statistics.today.dailyGoalMinutes ? (
            <ProgressBar value={statistics.today.dailyGoalProgressPercent} />
          ) : (
            <CardDescription>Imposta l&apos;obiettivo nel profilo</CardDescription>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
