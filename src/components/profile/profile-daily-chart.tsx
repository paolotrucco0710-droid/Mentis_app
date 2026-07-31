"use client";

import type { DailyStatisticsView } from "@/profile/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatStudyMinutes } from "./profile-utils";

export function ProfileDailyChart({
  history,
}: {
  history: DailyStatisticsView[];
}) {
  const maxStudyTime = Math.max(...history.map((item) => item.studyTimeMs), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultimi 7 giorni</CardTitle>
        <CardDescription>Tempo di studio giornaliero</CardDescription>
      </CardHeader>
      {history.length === 0 ? (
        <p className="text-sm text-muted">Nessun dato disponibile.</p>
      ) : (
        <div className="flex items-end gap-2">
          {history.map((item) => {
            const height = Math.max(
              Math.round((item.studyTimeMs / maxStudyTime) * 100),
              item.studyTimeMs > 0 ? 8 : 4
            );
            const label = new Date(item.date).toLocaleDateString("it-IT", {
              weekday: "short",
            });

            return (
              <div
                key={item.date}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{ height: `${height}px` }}
                  title={formatStudyMinutes(item.studyTimeMs)}
                />
                <span className="text-xs text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
