import {
  createAIJob,
  findAIJobById,
  updateAIJobStatus,
} from "@/db/repositories/ai-jobs";
import {
  findKnowledgeSourceById,
  updateKnowledgeSourceStatus,
} from "@/db/repositories/knowledge-sources";
import { findImagesByKnowledgeSourceId } from "@/db/repositories/uploads";
import { findSubjectById } from "@/db/repositories/subjects";
import { countAtomsByKnowledgeSourceId } from "@/db/repositories/atoms";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import { AIJobStep, AIJobStatus } from "@/domain/enums";
import type { AIJobId, KnowledgeSourceId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { extractKnowledgeJson } from "./extract";
import { extractDocumentText } from "./ocr";
import { normalizeKnowledgeJson } from "./normalize";
import { persistKnowledgeGraph } from "./persist";
import { cleanExtractedText } from "./text-cleaning";
import { validateKnowledgeSemantics } from "./validate";

export class AIProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AIProcessingError";
  }
}

export interface ProcessingResult {
  jobId: AIJobId;
  knowledgeSourceId: KnowledgeSourceId;
  atomCount: number;
  cardCount: number;
  status: AIJobStatus;
}

async function updateStep(jobId: AIJobId, step: AIJobStep): Promise<void> {
  await updateAIJobStatus(jobId, AIJobStatus.Running, step);
}

export async function processKnowledgeSource(
  knowledgeSourceId: KnowledgeSourceId,
  userId: UserId
): Promise<ProcessingResult> {
  const knowledgeSource = await findKnowledgeSourceById(knowledgeSourceId);
  if (!knowledgeSource || knowledgeSource.userId !== userId) {
    throw new AIProcessingError(
      "Knowledge source non trovata.",
      "NOT_FOUND",
      404
    );
  }

  if (
    knowledgeSource.processingStatus ===
    KnowledgeSourceProcessingStatus.Processing
  ) {
    throw new AIProcessingError(
      "Elaborazione già in corso.",
      "ALREADY_PROCESSING",
      409
    );
  }

  const existingAtoms = await countAtomsByKnowledgeSourceId(knowledgeSourceId);
  if (
    existingAtoms > 0 &&
    knowledgeSource.processingStatus ===
      KnowledgeSourceProcessingStatus.Completed
  ) {
    throw new AIProcessingError(
      "Capitolo già elaborato. Carica un nuovo materiale per riprocessare.",
      "ALREADY_COMPLETED",
      409
    );
  }

  const subject = await findSubjectById(knowledgeSource.subjectId);
  if (!subject) {
    throw new AIProcessingError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }

  const job = await createAIJob({
    knowledgeSourceId,
    userId,
    promptVersion: env.aiPromptVersion,
    parserVersion: env.knowledgeJsonVersion,
  });

  await updateKnowledgeSourceStatus(
    knowledgeSourceId,
    KnowledgeSourceProcessingStatus.Processing
  );

  try {
    await updateAIJobStatus(job.id, AIJobStatus.Running, AIJobStep.Ocr);
    const images = await findImagesByKnowledgeSourceId(knowledgeSourceId);
    const rawText = await extractDocumentText(knowledgeSource, images);

    await updateStep(job.id, AIJobStep.TextCleaning);
    const cleanedText = cleanExtractedText(rawText);
    if (cleanedText.length < 100) {
      throw new AIProcessingError(
        "Testo estratto troppo breve per l'elaborazione.",
        "TEXT_TOO_SHORT"
      );
    }

    await updateStep(job.id, AIJobStep.LlmExtraction);
    const extracted = await extractKnowledgeJson({
      title: knowledgeSource.title,
      subject: subject.name,
      language: knowledgeSource.language,
      cleanedText,
    });

    await updateStep(job.id, AIJobStep.JsonValidation);
    const semantic = validateKnowledgeSemantics(extracted);
    if (!semantic.ok) {
      throw new AIProcessingError(
        semantic.errors.join(" "),
        "SEMANTIC_VALIDATION_FAILED"
      );
    }

    await updateStep(job.id, AIJobStep.Normalization);
    const normalized = normalizeKnowledgeJson(extracted, knowledgeSourceId);

    await updateStep(job.id, AIJobStep.Persistence);
    const { atomCount, cardCount } = await persistKnowledgeGraph({
      knowledge: normalized,
      knowledgeSourceId,
      subjectId: knowledgeSource.subjectId,
    });

    await updateKnowledgeSourceStatus(
      knowledgeSourceId,
      KnowledgeSourceProcessingStatus.Completed,
      new Date()
    );

    await updateAIJobStatus(
      job.id,
      AIJobStatus.Completed,
      AIJobStep.Persistence
    );

    return {
      jobId: job.id,
      knowledgeSourceId,
      atomCount,
      cardCount,
      status: AIJobStatus.Completed,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Elaborazione AI fallita.";

    await updateKnowledgeSourceStatus(
      knowledgeSourceId,
      KnowledgeSourceProcessingStatus.Failed
    );

    await updateAIJobStatus(job.id, AIJobStatus.Failed, null, message);

    throw error instanceof AIProcessingError
      ? error
      : new AIProcessingError(message, "PROCESSING_FAILED", 500);
  }
}

export async function getProcessingJob(jobId: AIJobId, userId: UserId) {
  const job = await findAIJobById(jobId);
  if (!job || job.userId !== userId) {
    return null;
  }
  return job;
}

export function scheduleKnowledgeSourceProcessing(
  knowledgeSourceId: KnowledgeSourceId,
  userId: UserId
): void {
  void processKnowledgeSource(knowledgeSourceId, userId).catch((error) => {
    console.error("Background AI processing failed:", error);
  });
}
