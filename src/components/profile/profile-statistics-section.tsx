"use client";

import type { UserStatisticsView } from "@/profile/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatStudyMinutes } from "./profile-utils";

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function ProfileStatisticsSection({
  statistics,
}: {
  statistics: UserStatisticsView;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          label="Studio oggi"
          value={formatStudyMinutes(statistics.today.studyTimeMs)}
        />
        <StatItem
          label="Card oggi"
          value={String(statistics.today.cardsCompleted)}
        />
        <StatItem
          label="Accuratezza oggi"
          value={`${statistics.today.accuracy}%`}
        />
        <StatItem
          label="Revisioni in coda"
          value={String(statistics.lifetime.pendingReviews)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totali</CardTitle>
          <CardDescription>Riepilogo del tuo percorso</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatItem
            label="Tempo totale"
            value={formatStudyMinutes(statistics.lifetime.totalStudyTimeMs)}
          />
          <StatItem
            label="Card completate"
            value={String(statistics.lifetime.totalCardsCompleted)}
          />
          <StatItem
            label="Atomi padroneggiati"
            value={String(statistics.lifetime.totalAtomsMastered)}
          />
          <StatItem
            label="Sessioni"
            value={String(statistics.lifetime.totalSessions)}
          />
        </div>
      </Card>

      {statistics.recentSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Attività recente</CardTitle>
            <CardDescription>Ultime sessioni di studio</CardDescription>
          </CardHeader>
          <ul className="divide-y divide-border">
            {statistics.recentSessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {new Date(session.startedAt).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-muted">
                    {session.cardsViewed} card · {session.correctAnswerCount}{" "}
                    corrette
                  </p>
                </div>
                <p className="text-muted">
                  {session.durationMs
                    ? formatStudyMinutes(session.durationMs)
                    : "In corso"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
