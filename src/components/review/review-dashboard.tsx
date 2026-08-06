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
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/ui";
import { useActiveSubjectId } from "@/hooks";
import { fetchDailyReview, syncReviews } from "@/lib/api";
import type { SubjectId } from "@/domain/ids";
import type { DailyReviewPlan, ReviewQueueItem } from "@/review/types";

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
    <Section title={title}>
      <div className="mb-3 flex justify-end">
        <Badge variant={variant}>{items.length}</Badge>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <li
            key={item.review.id}
            className="rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <p className="font-medium">{item.atomTitle}</p>
            <p className="text-sm text-muted">
              Padronanza {item.mastery}% ·{" "}
              {item.overdue
                ? `In ritardo da ${Math.round(item.overdueHours)} h`
                : formatScheduledAt(item.scheduledAt)}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ReviewDashboard() {
  const { subjectId, loading: loadingSubject, error: subjectError } =
    useActiveSubjectId();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailyReviewPlan | null>(null);

  async function loadPlan(activeSubjectId: SubjectId) {
    setLoading(true);
    setError(null);
    const daily = await fetchDailyReview(activeSubjectId);
    setPlan(daily);
  }

  useEffect(() => {
    if (loadingSubject || !subjectId) {
      return;
    }

    const activeSubjectId = subjectId;
    let cancelled = false;

    async function load() {
      try {
        await loadPlan(activeSubjectId);
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
      await loadPlan(subjectId);
    } catch {
      setError("Impossibile caricare le revisioni.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError(null);
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
      ? Math.round(((dueCount + overdueCount) / totalDue) * 100)
      : 0;
  const feedHref = `/feed?subjectId=${subjectId}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ripasso"
        description="Il Review Engine programma i ripassi quando la memoria inizia a calare."
        action={
          <Button
            type="button"
            variant="secondary"
            disabled={syncing}
            onClick={() => void handleSync()}
          >
            {syncing ? "Sincronizzazione..." : "Sincronizza revisioni"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>In scadenza</CardTitle>
            <CardDescription>{dueCount} concetti</CardDescription>
          </CardHeader>
          <Badge variant={dueCount > 0 ? "warning" : "default"}>
            {dueCount > 0 ? "Da fare adesso" : "Nessuna urgenza"}
          </Badge>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In ritardo</CardTitle>
            <CardDescription>{overdueCount} concetti</CardDescription>
          </CardHeader>
          <Badge variant={overdueCount > 0 ? "danger" : "success"}>
            {overdueCount > 0 ? "Priorità alta" : "Tutto aggiornato"}
          </Badge>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Oggi</CardTitle>
            <CardDescription>
              Tempo stimato: {plan?.estimatedMinutes ?? 0} min
            </CardDescription>
          </CardHeader>
          <ProgressBar value={progress} label={`${totalDue} concetti programmati`} />
        </Card>
      </div>

      {totalDue > 0 ? (
        <Link href={feedHref}>
          <Button fullWidth size="lg">
            Studia i ripassi ora
          </Button>
        </Link>
      ) : null}

      {totalDue === 0 ? (
        <EmptyState
          title="Nessun ripasso in coda"
          description="Studia qualche card: il motore programmerà i prossimi ripassi da solo."
          action={
            <Link href={feedHref}>
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
