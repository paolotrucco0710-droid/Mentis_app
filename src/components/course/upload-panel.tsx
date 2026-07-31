"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SubjectSummary } from "@/course/types";
import type { SubjectId } from "@/domain/ids";
import {
  ApiError,
  fetchSubjects,
  startKnowledgeSourceProcessing,
  uploadChapter,
} from "@/lib/api";
import { clientConfig } from "@/lib/client-config";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loader,
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/ui";
import { formatFileSize } from "./course-utils";

type UploadState =
  | { status: "idle" }
  | { status: "selected"; files: File[] }
  | { status: "uploading"; progress: number }
  | { status: "processing"; knowledgeSourceId: string; jobId?: string }
  | { status: "completed"; knowledgeSourceId: string }
  | { status: "error"; message: string };

export function UploadPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectId, setSubjectId] = useState(
    searchParams.get("subjectId") ?? clientConfig.devSubjectId
  );
  const [title, setTitle] = useState("Nuovo capitolo");
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const selectedFiles = useMemo(
    () => (state.status === "selected" ? state.files : []),
    [state]
  );

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      const data = await fetchSubjects();
      setSubjects(data);
      if (!searchParams.get("subjectId") && data[0]) {
        setSubjectId(data[0].id);
      }
    } finally {
      setLoadingSubjects(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubjects]);

  const totalSize = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + file.size, 0),
    [selectedFiles]
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    setState({ status: "selected", files: Array.from(files) });
  }

  async function handleUpload() {
    if (state.status !== "selected" || selectedFiles.length === 0) {
      return;
    }

    try {
      setState({ status: "uploading", progress: 20 });
      const result = await uploadChapter({
        subjectId: subjectId as SubjectId,
        title,
        files: selectedFiles,
      });

      setState({ status: "uploading", progress: 80 });

      if (result.processingScheduled) {
        setState({
          status: "processing",
          knowledgeSourceId: result.knowledgeSourceId,
        });
        router.push(
          `/processing?knowledgeSourceId=${result.knowledgeSourceId}`
        );
        return;
      }

      setState({
        status: "completed",
        knowledgeSourceId: result.knowledgeSourceId,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Upload non riuscito.",
      });
    }
  }

  async function handleManualProcess() {
    if (state.status !== "completed") {
      return;
    }

    try {
      const result = (await startKnowledgeSourceProcessing(
        state.knowledgeSourceId
      )) as { jobId?: string };
      router.push(
        `/processing?knowledgeSourceId=${state.knowledgeSourceId}${
          result.jobId ? `&jobId=${result.jobId}` : ""
        }`
      );
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Elaborazione non avviata.",
      });
    }
  }

  if (loadingSubjects) {
    return <Loader label="Caricamento materie..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Carica materiale"
        description="Aggiungi PDF o immagini di un capitolo. Mentis creerà atoms e card."
      />

      <Card>
        <CardHeader>
          <CardTitle>Dettagli capitolo</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Materia</span>
            <select
              className="h-11 w-full rounded-xl border border-border bg-surface px-4"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Titolo capitolo"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
      </Card>

      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <div className="rounded-full bg-accent p-4 text-primary">
            <span className="text-2xl">+</span>
          </div>
          <div className="space-y-1">
            <CardTitle>Trascina qui i file</CardTitle>
            <CardDescription>
              PDF, JPG o PNG. Fino a 50 pagine per capitolo.
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Seleziona file
            </Button>
          </div>
        </div>
      </Card>

      {state.status === "selected" ? (
        <Section title="File selezionati">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFiles.length} file · {formatFileSize(totalSize)}
              </CardTitle>
              <CardDescription>
                {selectedFiles.map((file) => file.name).join(", ")}
              </CardDescription>
            </CardHeader>
            <Button onClick={() => void handleUpload()}>Avvia upload</Button>
          </Card>
        </Section>
      ) : null}

      {state.status === "uploading" ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload in corso</CardTitle>
          </CardHeader>
          <ProgressBar value={state.progress} label="Caricamento file" />
        </Card>
      ) : null}

      {state.status === "completed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload completato</CardTitle>
            <CardDescription>
              Il capitolo è pronto per l&apos;elaborazione AI.
            </CardDescription>
          </CardHeader>
          <Button onClick={() => void handleManualProcess()}>
            Avvia elaborazione
          </Button>
        </Card>
      ) : null}

      {state.status === "error" ? (
        <EmptyState
          title="Errore upload"
          description={state.message}
          action={
            <Button onClick={() => setState({ status: "idle" })}>Riprova</Button>
          }
        />
      ) : null}

      <Section title="Stato">
        <div className="flex flex-wrap gap-2">
          {[
            "Empty",
            "File Selected",
            "Uploading",
            "Processing",
            "Completed",
            "Error",
          ].map((label) => (
            <Badge key={label}>{label}</Badge>
          ))}
        </div>
      </Section>
    </div>
  );
}
