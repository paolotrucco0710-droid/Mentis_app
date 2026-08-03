import {
  AIJobStep,
  KnowledgeSourceProcessingStatus,
} from "@/domain/enums";

export const SUBJECT_COLORS = [
  "#4F46E5",
  "#059669",
  "#DC2626",
  "#D97706",
  "#7C3AED",
  "#0891B2",
] as const;

export const SUBJECT_ICONS = [
  "book",
  "flask",
  "globe",
  "calculator",
  "palette",
  "atom",
] as const;

export function formatProcessingStatus(
  status: KnowledgeSourceProcessingStatus
): string {
  switch (status) {
    case KnowledgeSourceProcessingStatus.Uploaded:
      return "Caricato";
    case KnowledgeSourceProcessingStatus.Queued:
      return "In coda";
    case KnowledgeSourceProcessingStatus.Processing:
      return "Elaborazione";
    case KnowledgeSourceProcessingStatus.Completed:
      return "Pronto allo studio";
    case KnowledgeSourceProcessingStatus.Failed:
      return "Errore";
    default:
      return status;
  }
}

export function processingProgress(
  status: KnowledgeSourceProcessingStatus,
  currentStep?: AIJobStep | string | null
): number {
  if (status === KnowledgeSourceProcessingStatus.Completed) {
    return 100;
  }
  if (status === KnowledgeSourceProcessingStatus.Failed) {
    return 100;
  }
  if (currentStep) {
    return jobStepProgress(currentStep);
  }

  switch (status) {
    case KnowledgeSourceProcessingStatus.Uploaded:
      return 10;
    case KnowledgeSourceProcessingStatus.Queued:
      return 15;
    case KnowledgeSourceProcessingStatus.Processing:
      return 35;
    default:
      return 0;
  }
}

export function formatJobStep(step: AIJobStep | string | null): string | null {
  switch (step) {
    case AIJobStep.Ocr:
      return "OCR — lettura foto/pagine";
    case AIJobStep.ImageExtraction:
      return "Estrazione figure dalle pagine";
    case AIJobStep.TextCleaning:
      return "Pulizia testo";
    case AIJobStep.LlmExtraction:
      return "Estrazione concetti (LLM)";
    case AIJobStep.JsonValidation:
      return "Validazione JSON";
    case AIJobStep.Normalization:
      return "Normalizzazione atoms";
    case AIJobStep.Persistence:
      return "Salvataggio card nel database";
    case AIJobStep.StructureRecognition:
      return "Riconoscimento struttura";
    default:
      return null;
  }
}

function jobStepProgress(step: AIJobStep | string): number {
  switch (step) {
    case AIJobStep.Ocr:
      return 20;
    case AIJobStep.ImageExtraction:
      return 40;
    case AIJobStep.TextCleaning:
      return 50;
    case AIJobStep.LlmExtraction:
      return 68;
    case AIJobStep.JsonValidation:
      return 78;
    case AIJobStep.Normalization:
      return 86;
    case AIJobStep.Persistence:
      return 94;
    case AIJobStep.StructureRecognition:
      return 55;
    default:
      return 35;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function canStudyChapter(chapter: { atomCount: number }): boolean {
  return chapter.atomCount > 0;
}

export function buildChapterStudyHref(chapter: {
  subjectId: string;
  knowledgeSourceId: string;
}): string {
  const params = new URLSearchParams({
    subjectId: chapter.subjectId,
    knowledgeSourceId: chapter.knowledgeSourceId,
  });

  return `/feed?${params.toString()}`;
}
