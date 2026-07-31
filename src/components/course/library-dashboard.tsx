"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LibraryOverview } from "@/course/types";
import {
  ApiError,
  createSubject,
  fetchLibraryOverview,
} from "@/lib/api";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Loader,
  PageHeader,
  Section,
} from "@/components/ui";
import { ChapterRow } from "./chapter-row";
import { SubjectCard } from "./subject-card";
import { SubjectForm } from "./subject-form";

export function LibraryDashboard() {
  const [overview, setOverview] = useState<LibraryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLibraryOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile caricare la libreria."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleCreateSubject(input: {
    name: string;
    color: string;
    icon: string;
  }) {
    try {
      setCreating(true);
      await createSubject(input);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile creare la materia."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <Loader label="Caricamento libreria..." />;
  }

  if (error && !overview) {
    return (
      <EmptyState
        title="Libreria non disponibile"
        description={error}
        action={<Button onClick={() => void load()}>Riprova</Button>}
      />
    );
  }

  const subjects = overview?.subjects ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="La tua libreria"
        description="Gestisci materie, capitoli e materiale di studio."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/search">
              <Button variant="secondary">Cerca</Button>
            </Link>
            <Button onClick={() => setShowForm((value) => !value)}>
              {showForm ? "Chiudi" : "Nuova materia"}
            </Button>
          </div>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Nuova materia</CardTitle>
            <CardDescription>
              Organizza i capitoli per materia scolastica.
            </CardDescription>
          </CardHeader>
          <SubjectForm onSubmit={handleCreateSubject} loading={creating} />
        </Card>
      ) : null}

      <Section title="Materie">
        {subjects.length === 0 ? (
          <EmptyState
            title="Nessuna materia"
            description="Crea la prima materia per iniziare a caricare capitoli."
            action={<Button onClick={() => setShowForm(true)}>Crea materia</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Capitoli recenti">
        {overview?.recentChapters.length ? (
          <div className="space-y-3">
            {overview.recentChapters.map((chapter) => (
              <ChapterRow key={chapter.id} chapter={chapter} onDeleted={load} />
            ))}
          </div>
        ) : (
          <Card>
            <CardDescription>
              Nessun capitolo caricato. Vai su Upload per aggiungere materiale.
            </CardDescription>
          </Card>
        )}
      </Section>
    </div>
  );
}
