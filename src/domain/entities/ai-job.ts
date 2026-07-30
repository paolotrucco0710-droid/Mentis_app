import type { AIJobId, KnowledgeSourceId, UserId } from "../ids";
import type { AIJobStatus, AIJobStep } from "../enums";

export interface AIJob {
  id: AIJobId;
  knowledgeSourceId: KnowledgeSourceId;
  userId: UserId;
  status: AIJobStatus;
  currentStep: AIJobStep | null;
  attemptCount: number;
  maxAttempts: number;
  promptVersion: string | null;
  parserVersion: string | null;
  errorMessage: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}
