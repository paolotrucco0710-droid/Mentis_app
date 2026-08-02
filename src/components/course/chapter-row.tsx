"use client";

import { memo, useState } from "react";
import Link from "next/link";
import type { ChapterWithSource } from "@/course/types";
import type { ChapterId } from "@/domain/ids";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Dialog } from "@/components/ui";
import { deleteChapter } from "@/lib/api";
import { formatProcessingStatus } from "./course-utils";

function ChapterRowComponent({
  chapter,
  onDeleted,
}: {
  chapter: ChapterWithSource;
  onDeleted?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteChapter(chapter.id as ChapterId);
      setConfirmOpen(false);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  const status = chapter.knowledgeSource.processingStatus;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{chapter.title}</CardTitle>
              <CardDescription>
                Capitolo {chapter.chapterNumber ?? "—"} · {chapter.atomCount}{" "}
                concetti · {chapter.knowledgeSource.pageCount} pagine
                {status === KnowledgeSourceProcessingStatus.Completed
                  ? " · Materiale pronto per lo studio"
                  : ""}
              </CardDescription>
            </div>
            <Badge
              variant={
                status === KnowledgeSourceProcessingStatus.Completed
                  ? "success"
                  : status === KnowledgeSourceProcessingStatus.Failed
                    ? "danger"
                    : "accent"
              }
            >
              {formatProcessingStatus(status)}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === KnowledgeSourceProcessingStatus.Completed ? (
              <Link
                href={`/feed?subjectId=${chapter.subjectId}&knowledgeSourceId=${chapter.knowledgeSourceId}`}
              >
                <Button size="sm">Studia capitolo</Button>
              </Link>
            ) : null}
            {status !== KnowledgeSourceProcessingStatus.Completed &&
            status !== KnowledgeSourceProcessingStatus.Processing ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const params = new URLSearchParams({
                    knowledgeSourceId: chapter.knowledgeSourceId,
                  });
                  window.location.href = `/processing?${params.toString()}`;
                }}
              >
                Elabora
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
            >
              Elimina
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Dialog
        open={confirmOpen}
        title="Eliminare il capitolo?"
        description="Il capitolo e il materiale associato verranno rimossi dalla libreria. L'operazione non può essere annullata."
        confirmLabel="Elimina"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export const ChapterRow = memo(ChapterRowComponent);
