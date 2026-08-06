"use client";

import Link from "next/link";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatStudyDuration } from "@/lib/format-duration";
import type { SessionSummaryView } from "./session-summary";

interface SessionCompleteProps {
  summary: SessionSummaryView;
  feedHref?: string;
}

export function SessionComplete({ summary, feedHref = "/feed" }: SessionCompleteProps) {
  const reinforcedConcepts = summary.conceptsStudied.slice(0, 6);
  const extraConcepts = Math.max(summary.conceptsStudied.length - reinforcedConcepts.length, 0);
  const sessionXp =
    summary.cardsViewed * 10 + summary.atomsCompleted * 25 + summary.masteryGain;

  return (
    <div className="feed-safe-top feed-safe-bottom mx-auto flex w-full max-w-lg flex-col gap-6 overflow-y-auto px-4 py-6">
      <section className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Sessione completata
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hai consolidato la memoria
        </h1>
        <p className="text-sm text-muted">
          Ogni card ha rinforzato ciò che conta. Il motore userà questi dati per
          programmare i prossimi ripassi.
        </p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center shadow-sm">
          <CardHeader className="items-center gap-1 p-4">
            <CardTitle className="text-2xl">{summary.cardsViewed}</CardTitle>
            <CardDescription>Card</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center shadow-sm">
          <CardHeader className="items-center gap-1 p-4">
            <CardTitle className="text-2xl">{summary.conceptsStudied.length}</CardTitle>
            <CardDescription>Concetti</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center shadow-sm">
          <CardHeader className="items-center gap-1 p-4">
            <CardTitle className="text-2xl">
              {formatStudyDuration(summary.activeDurationMs)}
            </CardTitle>
            <CardDescription>Tempo</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Risultati</CardTitle>
          <CardDescription>
            {summary.correctAnswers > 0
              ? `${summary.correctAnswers} risposte corrette · precisione ${summary.accuracy}%`
              : "Hai esplorato nuovi concetti in questa sessione."}
            {summary.masteryGain > 0
              ? ` · +${summary.masteryGain} punti padronanza`
              : null}
            {sessionXp > 0 ? ` · +${sessionXp} XP` : null}
          </CardDescription>
        </CardHeader>
        {reinforcedConcepts.length > 0 ? (
          <ul className="space-y-2 px-5 pb-5 text-sm">
            {reinforcedConcepts.map((concept) => (
              <li
                key={concept}
                className="rounded-xl border border-border bg-background px-3 py-2"
              >
                {concept}
              </li>
            ))}
            {extraConcepts > 0 ? (
              <li className="text-center text-xs text-muted">
                +{extraConcepts} altri concetti
              </li>
            ) : null}
          </ul>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        <Link href={feedHref}>
          <Button fullWidth>Continua</Button>
        </Link>
        <Link href="/home">
          <Button fullWidth variant="secondary">
            Torna alla home
          </Button>
        </Link>
      </div>
    </div>
  );
}
