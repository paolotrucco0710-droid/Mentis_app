import { KnowledgeSourceProcessingStatus } from "@/domain/enums";

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
  status: KnowledgeSourceProcessingStatus
): number {
  switch (status) {
    case KnowledgeSourceProcessingStatus.Uploaded:
      return 10;
    case KnowledgeSourceProcessingStatus.Queued:
      return 20;
    case KnowledgeSourceProcessingStatus.Processing:
      return 60;
    case KnowledgeSourceProcessingStatus.Completed:
      return 100;
    case KnowledgeSourceProcessingStatus.Failed:
      return 100;
    default:
      return 0;
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
