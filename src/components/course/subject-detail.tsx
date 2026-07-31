"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubjectDetail } from "@/course/types";
import type { SubjectId } from "@/domain/ids";
import {
  ApiError,
  deleteSubject,
  fetchSubjectDetail,
} from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  Loader,
  PageHeader,
  Section,
} from "@/components/ui";
import { ChapterRow } from "./chapter-row";

export function SubjectDetailView({ subjectId }: { subjectId: SubjectId }) {
  const router = useRouter();
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubjectDetail(subjectId);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile caricare la materia."
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleDeleteSubject() {
    try {
      setDeleting(true);
      await deleteSubject(subjectId);
      router.push("/library");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile eliminare la materia."
      );
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return <Loader label="Caricamento materia..." />;
  }

  if (error || !detail) {
    return (
      <EmptyState
        title="Materia non trovata"
        description={error ?? "La materia richiesta non esiste."}
        action={
          <Link href="/library">
            <Button>Torna alla libreria</Button>
          </Link>
        }
      />
    );
  }

  const { subject, courses, chapters } = detail;

  return (
    <div className="space-y-8">
      <PageHeader
        title={subject.name}
        description={`${courses.length} corsi · ${chapters.length} capitoli`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/upload?subjectId=${subject.id}`}>
              <Button>Carica capitolo</Button>
            </Link>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Elimina materia
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: subject.color }}
            >
              {subject.icon.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle>Dashboard materia</CardTitle>
              <CardDescription>
                Tutto il materiale di {subject.name} in un unico posto.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Section title="Corsi">
        {courses.length === 0 ? (
          <Card>
            <CardDescription>
              I corsi verranno creati automaticamente al primo upload.
            </CardDescription>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <Badge key={course.id} variant="accent">
                {course.title}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="Capitoli">
        {chapters.length === 0 ? (
          <EmptyState
            title="Nessun capitolo"
            description="Carica PDF o immagini per creare il primo capitolo."
            action={
              <Link href={`/upload?subjectId=${subject.id}`}>
                <Button>Carica materiale</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <ChapterRow key={chapter.id} chapter={chapter} onDeleted={load} />
            ))}
          </div>
        )}
      </Section>

      <Dialog
        open={confirmDelete}
        title="Eliminare la materia?"
        description="Verranno rimossi corsi, capitoli e materiale associato. L'operazione non può essere annullata."
        confirmLabel="Elimina materia"
        destructive
        loading={deleting}
        onConfirm={() => void handleDeleteSubject()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
