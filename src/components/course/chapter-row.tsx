"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChapterWithSource } from "@/course/types";
import type { ChapterId } from "@/domain/ids";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Dialog } from "@/components/ui";
import { deleteChapter } from "@/lib/api";
import {
  buildChapterStudyHref,
  canStudyChapter,
  formatProcessingStatus,
} from "./course-utils";

function ChapterRowComponent({
  chapter,
  onDeleted,
}: {
  chapter: ChapterWithSource;
  onDeleted?: () => void;
}) {
  const router = useRouter();
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
  const studyReady = canStudyChapter(chapter);
  const needsProcessing =
    status === KnowledgeSourceProcessingStatus.Uploaded ||
    status === KnowledgeSourceProcessingStatus.Failed;
  const isProcessing =
    status === KnowledgeSourceProcessingStatus.Processing ||
    status === KnowledgeSourceProcessingStatus.Queued;

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
                {studyReady ? " · Materiale pronto per lo studio" : ""}
                {needsProcessing ? " · Elaborazione AI richiesta" : ""}
              </CardDescription>
            </div>
            <Badge
              variant={
                studyReady
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
            {studyReady ? (
              <Button
                size="sm"
                onClick={() => router.push(buildChapterStudyHref(chapter))}
              >
                Studia capitolo
              </Button>
            ) : null}
            {needsProcessing ? (
              <Button
                size="sm"
                variant={studyReady ? "secondary" : "primary"}
                onClick={() => {
                  const params = new URLSearchParams({
                    knowledgeSourceId: chapter.knowledgeSourceId,
                  });
                  router.push(`/processing?${params.toString()}`);
                }}
              >
                {status === KnowledgeSourceProcessingStatus.Failed
                  ? "Riprova elaborazione"
                  : "Elabora capitolo"}
              </Button>
            ) : null}
            {isProcessing ? (
              <Button size="sm" variant="secondary" disabled>
                Elaborazione in corso...
              </Button>
            ) : null}
            {status === KnowledgeSourceProcessingStatus.Completed &&
            chapter.atomCount === 0 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const params = new URLSearchParams({
                    knowledgeSourceId: chapter.knowledgeSourceId,
                  });
                  router.push(`/processing?${params.toString()}`);
                }}
              >
                Rielabora capitolo
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
