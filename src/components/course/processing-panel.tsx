"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import {
  ApiError,
  fetchChapterByKnowledgeSource,
  fetchLatestProcessingJob,
  fetchProcessingJob,
  startKnowledgeSourceProcessing,
} from "@/lib/api";
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
import {
  formatProcessingStatus,
  processingProgress,
} from "./course-utils";

const PIPELINE_STEPS = [
  "Upload",
  "OCR",
  "Pulizia testo",
  "Estrazione LLM",
  "Validazione JSON",
  "Normalizzazione",
  "Persistenza",
  "Completato",
];

function simplifyProcessingError(message: string): string {
  if (message.includes("No endpoints found for")) {
    return "Modello AI non disponibile su OpenRouter. Controlla AI_VISION_MODEL e AI_REASONING_MODEL nel file .env.";
  }
  if (message.includes("JSON non valido")) {
    return "Il modello AI non ha prodotto un JSON valido. Prova AI_REASONING_MODEL=google/gemini-2.5-flash nel file .env.";
  }
  if (message.length > 240) {
    return `${message.slice(0, 240)}…`;
  }
  return message;
}

export function ProcessingPanel() {
  const searchParams = useSearchParams();
  const knowledgeSourceId = searchParams.get("knowledgeSourceId");
  const jobId = searchParams.get("jobId");
  const [title, setTitle] = useState("Capitolo");
  const [status, setStatus] = useState<KnowledgeSourceProcessingStatus>(
    KnowledgeSourceProcessingStatus.Uploaded
  );
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const poll = useCallback(async () => {
    if (!knowledgeSourceId) {
      return;
    }

    try {
      const chapter = await fetchChapterByKnowledgeSource(knowledgeSourceId);
      setTitle(chapter.title);
      setStatus(chapter.knowledgeSource.processingStatus);
      setError(null);

      if (jobId) {
        const { job } = await fetchProcessingJob(jobId);
        setCurrentStep(job.currentStep);
        if (job.status === "failed") {
          setError(job.errorMessage ?? "Elaborazione fallita.");
          setStatus(KnowledgeSourceProcessingStatus.Failed);
        }
        if (job.status === "completed") {
          setStatus(KnowledgeSourceProcessingStatus.Completed);
        }
      } else if (
        chapter.knowledgeSource.processingStatus ===
        KnowledgeSourceProcessingStatus.Failed
      ) {
        try {
          const { job } = await fetchLatestProcessingJob(knowledgeSourceId);
          setCurrentStep(job.currentStep);
          if (job.errorMessage) {
            setError(simplifyProcessingError(job.errorMessage));
          }
        } catch {
          setError("Elaborazione fallita.");
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile leggere lo stato."
      );
    }
  }, [knowledgeSourceId, jobId]);

  useEffect(() => {
    if (!knowledgeSourceId) {
      return;
    }

    const timer = window.setTimeout(() => {
      void poll();
    }, 0);
    const interval = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [knowledgeSourceId, poll]);

  async function handleStart() {
    if (!knowledgeSourceId) {
      return;
    }

    try {
      setStarting(true);
      await startKnowledgeSourceProcessing(knowledgeSourceId);
      setStatus(KnowledgeSourceProcessingStatus.Processing);
      await poll();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Elaborazione non avviata."
      );
    } finally {
      setStarting(false);
    }
  }

  if (!knowledgeSourceId) {
    return (
      <EmptyState
        title="Nessun capitolo in elaborazione"
        description="Carica un capitolo e avvia l'elaborazione per vederne lo stato qui."
        action={
          <Link href="/upload">
            <Button>Vai all&apos;upload</Button>
          </Link>
        }
      />
    );
  }

  const progress = processingProgress(status);
  const isActive =
    status === KnowledgeSourceProcessingStatus.Processing ||
    status === KnowledgeSourceProcessingStatus.Queued;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Elaborazione in corso"
        description="La pipeline AI sta trasformando il capitolo in atoms e card."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                Stato: {formatProcessingStatus(status)}
                {currentStep ? ` · ${currentStep}` : ""}
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
        </CardHeader>
        <ProgressBar value={progress} label="Progresso pipeline" />
        {isActive ? <Loader label="Elaborazione attiva..." /> : null}
        {status === KnowledgeSourceProcessingStatus.Uploaded ||
        status === KnowledgeSourceProcessingStatus.Failed ? (
          <div className="mt-4">
            <Button onClick={() => void handleStart()} disabled={starting}>
              {status === KnowledgeSourceProcessingStatus.Failed
                ? "Riprova elaborazione"
                : "Avvia elaborazione"}
            </Button>
          </div>
        ) : null}
        {status === KnowledgeSourceProcessingStatus.Completed ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/feed">
              <Button>Inizia a studiare</Button>
            </Link>
            <Link href="/library">
              <Button variant="secondary">Torna alla libreria</Button>
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-danger">{error}</p>
        ) : null}
      </Card>

      <Section title="Pipeline AI">
        <div className="grid gap-3 sm:grid-cols-2">
          {PIPELINE_STEPS.map((step, index) => (
            <Card
              key={step}
              className={
                progress >= ((index + 1) / PIPELINE_STEPS.length) * 100
                  ? "border-primary/30 bg-accent/40"
                  : ""
              }
            >
              <CardDescription className="font-medium text-foreground">
                {index + 1}. {step}
              </CardDescription>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
