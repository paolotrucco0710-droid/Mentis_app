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
  Loader,
} from "@/components/ui";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { useActiveSubjectId } from "@/hooks";
import { fetchDailyReview, fetchLibraryOverview } from "@/lib/api";

export function HomeDashboard() {
  const { subjectId, loading: loadingSubject } = useActiveSubjectId();
  const [loading, setLoading] = useState(true);
  const [chapterLabel, setChapterLabel] = useState<string | null>(null);
  const [reviewDue, setReviewDue] = useState(0);
  const [reviewMinutes, setReviewMinutes] = useState(0);

  useEffect(() => {
    if (loadingSubject) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [library, review] = await Promise.all([
          fetchLibraryOverview().catch(() => null),
          subjectId
            ? fetchDailyReview(subjectId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        const recentChapter = library?.recentChapters[0];
        setChapterLabel(recentChapter?.title ?? null);
        setReviewDue(review?.totalDue ?? 0);
        setReviewMinutes(review?.estimatedMinutes ?? 0);
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

  if (loadingSubject || loading) {
    return <Loader label="Preparazione..." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Mentis</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pronto a studiare?
        </h1>
        <p className="text-muted">
          Apri una sessione e lascia che il motore scelga cosa fare adesso.
        </p>
      </section>

      <Card className="border-primary/20 bg-gradient-to-br from-accent to-surface shadow-md">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Studia ora</CardTitle>
            <CardDescription>
              {chapterLabel
                ? `Riprendi da «${chapterLabel}» o lascia scegliere a Mentis.`
                : "Il feed ti guida con spiegazioni, quiz e ripassi."}
            </CardDescription>
          </div>
          <Link href="/feed">
            <Button fullWidth size="lg">
              Inizia sessione
            </Button>
          </Link>
        </CardHeader>
      </Card>

      {reviewDue > 0 ? (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Ripasso</CardTitle>
              <Badge variant="warning">{reviewDue} concetti</Badge>
            </div>
            <CardDescription>
              Circa {reviewMinutes} min per rinforzare ciò che stai per dimenticare.
            </CardDescription>
            <Link href="/review">
              <Button fullWidth variant="secondary">
                Vai al ripasso
              </Button>
            </Link>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Il tuo materiale</CardTitle>
          <CardDescription>
            Carica capitoli, PDF o immagini. Mentis crea i concetti da sola.
          </CardDescription>
          <Link href="/library">
            <Button fullWidth variant="secondary">
              Apri libreria
            </Button>
          </Link>
        </CardHeader>
      </Card>

      <InstallPrompt />
    </div>
  );
}
