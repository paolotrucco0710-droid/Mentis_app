"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Loader,
  ProgressBar,
} from "@/components/ui";
import { useActiveSubjectId } from "@/hooks";
import {
  fetchDailyReview,
  syncReviews,
} from "@/lib/api/reviews";
import type { ReviewQueueItem } from "@/review/types";

function formatScheduledAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReviewList({
  title,
  items,
  variant,
}: {
  title: string;
  items: ReviewQueueItem[];
  variant: "danger" | "warning" | "default";
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant={variant}>{items.length}</Badge>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <li
            key={item.review.id}
            className="rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.atomTitle}</p>
                <p className="text-xs text-muted">
                  Padronanza {item.mastery}% ·{" "}
                  {item.overdue
                    ? `In ritardo da ${Math.round(item.overdueHours)} h`
                    : formatScheduledAt(item.scheduledAt)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReviewDashboard() {
  const { subjectId, loading: loadingSubject, error: subjectError } =
    useActiveSubjectId();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof fetchDailyReview>> | null>(
    null
  );

  useEffect(() => {
    if (loadingSubject || !subjectId) {
      return;
    }

    const activeSubjectId = subjectId;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const daily = await fetchDailyReview(activeSubjectId);
        if (!cancelled) {
          setPlan(daily);
        }
      } catch {
        if (!cancelled) {
          setError("Impossibile caricare le revisioni.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadingSubject, subjectId]);

  async function reloadPlan() {
    if (!subjectId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const daily = await fetchDailyReview(subjectId);
      setPlan(daily);
    } catch {
      setError("Impossibile caricare le revisioni.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await syncReviews();
      await reloadPlan();
    } catch {
      setError("Sincronizzazione non riuscita.");
    } finally {
      setSyncing(false);
    }
  }

  if (loadingSubject || loading) {
    return <Loader label="Caricamento ripassi..." />;
  }

  if (subjectError || !subjectId) {
    return (
      <EmptyState
        title="Ripasso non disponibile"
        description={subjectError ?? "Seleziona una materia per continuare."}
        action={
          <Link href="/library">
            <Button>Vai alla libreria</Button>
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Ripasso non disponibile"
        description={error}
        action={
          <Button onClick={() => void reloadPlan()}>Riprova</Button>
        }
      />
    );
  }

  const overdueCount = plan?.overdue.length ?? 0;
  const dueCount = plan?.dueNow.length ?? 0;
  const totalDue = plan?.totalDue ?? 0;
  const progress =
    totalDue > 0
      ? Math.round((dueCount / Math.max(totalDue, 1)) * 100)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Ripasso intelligente</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Concetti da rinforzare
        </h1>
        <p className="text-sm text-muted">
          Il Review Engine programma i ripassi quando la memoria inizia a calare.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="gap-1 p-4">
            <CardDescription>In scadenza</CardDescription>
            <CardTitle>{dueCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1 p-4">
            <CardDescription>In ritardo</CardDescription>
            <CardTitle>{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1 p-4">
            <CardDescription>Oggi</CardDescription>
            <CardTitle>{plan?.estimatedMinutes ?? 0} min</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {totalDue > 0 ? (
        <ProgressBar
          value={progress}
          label={`${totalDue} concetti programmati`}
        />
      ) : null}

      {totalDue > 0 ? (
        <Link href="/feed">
          <Button fullWidth size="lg">
            Studia i ripassi ora
          </Button>
        </Link>
      ) : null}

      <Button
        variant="secondary"
        fullWidth
        disabled={syncing}
        onClick={() => void handleSync()}
      >
        {syncing ? "Sincronizzazione..." : "Sincronizza revisioni"}
      </Button>

      {totalDue === 0 ? (
        <EmptyState
          title="Nessun ripasso in coda"
          description="Studia qualche card: il motore programmerà i prossimi ripassi da solo."
          action={
            <Link href="/feed">
              <Button>Inizia a studiare</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <ReviewList
            title="In ritardo"
            items={plan?.overdue ?? []}
            variant="danger"
          />
          <ReviewList
            title="Da fare adesso"
            items={plan?.dueNow ?? []}
            variant="warning"
          />
          <ReviewList
            title="In arrivo oggi"
            items={plan?.upcomingToday ?? []}
            variant="default"
          />
        </div>
      )}
    </div>
  );
}
