"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResults } from "@/course/types";
import { ApiError, searchLibrary } from "@/lib/api";
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loader,
  PageHeader,
  Section,
} from "@/components/ui";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      const timer = window.setTimeout(() => {
        setResults(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await searchLibrary(query);
          setResults(data);
        } catch (err) {
          setError(
            err instanceof ApiError ? err.message : "Ricerca non riuscita."
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const hasResults =
    results &&
    (results.subjects.length > 0 ||
      results.courses.length > 0 ||
      results.chapters.length > 0 ||
      results.atoms.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cerca"
        description="Trova materie, capitoli e concetti nella tua libreria."
      />

      <Input
        label="Ricerca"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca per nome, concetto o parola chiave..."
      />

      {loading ? <Loader label="Ricerca in corso..." /> : null}
      {error ? <EmptyState title="Errore" description={error} /> : null}

      {!query.trim() ? (
        <Card>
          <CardDescription>
            Digita almeno una parola per cercare nella libreria.
          </CardDescription>
        </Card>
      ) : null}

      {query.trim() && !loading && results && !hasResults ? (
        <EmptyState
          title="Nessun risultato"
          description={`Nessun contenuto trovato per "${results.query}".`}
        />
      ) : null}

      {results?.subjects.length ? (
        <Section title="Materie">
          <div className="space-y-2">
            {results.subjects.map((subject) => (
              <Link key={subject.id} href={`/library/subjects/${subject.id}`}>
                <Card className="hover:border-primary/40">
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {results?.chapters.length ? (
        <Section title="Capitoli">
          <div className="space-y-2">
            {results.chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle>{chapter.title}</CardTitle>
                  <CardDescription>Capitolo {chapter.chapterNumber}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {results?.courses.length ? (
        <Section title="Corsi">
          <div className="flex flex-wrap gap-2">
            {results.courses.map((course) => (
              <Badge key={course.id} variant="accent">
                {course.title}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      {results?.atoms.length ? (
        <Section title="Concetti">
          <div className="space-y-2">
            {results.atoms.map((atom) => (
              <Card key={atom.id}>
                <CardHeader>
                  <CardTitle>{atom.title}</CardTitle>
                  <CardDescription>{atom.summary}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
