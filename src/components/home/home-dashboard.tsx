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
  Section,
} from "@/components/ui";
import type { HomeContinueContext } from "@/home";
import { fetchHomeContinueContext } from "@/lib/api";
import { SessionStatus } from "@/session/types";

function continueLabel(context: HomeContinueContext): string {
  if (context.session?.status === SessionStatus.Paused) {
    return "Riprendi sessione";
  }

  if (context.reason === "last_chapter" || context.reason === "active_session") {
    return "Continua a studiare";
  }

  return "Inizia a studiare";
}

function continueDescription(context: HomeContinueContext): string {
  const chapter = context.chapter;
  if (!chapter) {
    return "Carica un capitolo per iniziare il feed guidato.";
  }

  const chapterLabel = `«${chapter.title}»`;
  const subjectLabel = chapter.subjectName;

  if (context.session?.status === SessionStatus.Paused) {
    return `Riprendi ${chapterLabel} in ${subjectLabel}. Hai già visto ${context.session.cardsViewed} card.`;
  }

  if (context.reason === "last_chapter" || context.reason === "active_session") {
    return `Riprendi da ${chapterLabel} in ${subjectLabel}.`;
  }

  return `Studia ${chapterLabel} in ${subjectLabel}.`;
}

export function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<HomeContinueContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchHomeContinueContext();
        if (!cancelled) {
          setContext(data);
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
  }, []);

  if (loading) {
    return <Loader label="Preparazione..." />;
  }

  const canContinue = context?.canContinue && context.feedHref;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="accent">Obiettivo giornaliero</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Cosa devi fare adesso?
        </h1>
        <p className="max-w-2xl text-muted">
          {canContinue
            ? "Riprendi da dove hai lasciato con un solo tap."
            : "Carica materiale o apri la libreria per iniziare."}
        </p>
      </section>

      <Card className="bg-gradient-to-br from-accent to-surface">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>
              {canContinue ? "Continua" : "Inizia a studiare"}
            </CardTitle>
            {context?.session?.status === SessionStatus.Paused ? (
              <Badge variant="warning">In pausa</Badge>
            ) : canContinue ? (
              <Badge variant="success">Pronto</Badge>
            ) : null}
          </div>
          <CardDescription>
            {context ? continueDescription(context) : "Preparazione del percorso..."}
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          {canContinue ? (
            <Link href={context.feedHref!} className="sm:flex-1">
              <Button fullWidth size="lg">
                {continueLabel(context)}
              </Button>
            </Link>
          ) : (
            <Link href="/upload" className="sm:flex-1">
              <Button fullWidth size="lg">
                Carica un capitolo
              </Button>
            </Link>
          )}
          <Link href="/library" className="sm:flex-1">
            <Button fullWidth variant="secondary">
              Apri libreria
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>La tua libreria</CardTitle>
            <CardDescription>
              Materie, capitoli, upload ed eliminazione materiale.
            </CardDescription>
          </CardHeader>
          <Link href="/library">
            <Button variant="secondary">Gestisci materiale</Button>
          </Link>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carica un capitolo</CardTitle>
            <CardDescription>
              PDF o immagini: Mentis crea atoms e card automaticamente.
            </CardDescription>
          </CardHeader>
          <Link href="/upload">
            <Button variant="secondary">Vai all&apos;upload</Button>
          </Link>
        </Card>
      </div>

      <Section title="Accesso rapido">
        <div className="flex flex-wrap gap-3">
          <Link href="/search">
            <Button variant="ghost">Cerca nella libreria</Button>
          </Link>
          <Link href="/upload">
            <Button variant="ghost">Upload</Button>
          </Link>
          {canContinue ? (
            <Link href={context.feedHref!}>
              <Button variant="ghost">Vai al feed</Button>
            </Link>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
