import {
  AnalyticsEvents,
  trackAnalyticsEvent,
  trackFunnelMilestoneAsync,
  trackPipelineError,
} from "@/analytics";
import { prisma } from "@/db/client";
import {
  createAIJob,
  findAIJobById,
  findAIJobsByKnowledgeSourceId,
  updateAIJobStatus,
  updateAIJobUsage,
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
import { logger } from "@/lib/logger";
import { toUserFacingAIError } from "./errors";
import { extractKnowledgeJson } from "./extract";
import { enrichKnowledgeWithImages } from "./enrich-images";
import {
  extractFiguresFromPageImages,
  mergeKnowledgeSourceImages,
} from "./extract-figures";
import { isPageSourceImage } from "./image-study";
import { extractDocumentText } from "./ocr";
import { normalizeKnowledgeJson } from "./normalize";
import { persistKnowledgeGraph } from "./persist";
import { cleanExtractedText } from "./text-cleaning";
import { validateKnowledgeSemantics } from "./validate";
import {
  findCompletedKnowledgeSourceByFileHash,
  UsageTracker,
} from "./optimization";

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
  estimatedCostUsd: number;
  cacheHits: number;
  cacheMisses: number;
  deduplicatedFrom?: { id: string; title: string } | null;
}

async function updateStep(jobId: AIJobId, step: AIJobStep): Promise<void> {
  await updateAIJobStatus(jobId, AIJobStatus.Running, step);
}

async function persistJobUsage(jobId: AIJobId, tracker: UsageTracker) {
  const snapshot = tracker.snapshot();
  await updateAIJobUsage(jobId, snapshot);
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

  const claimed = await prisma.knowledgeSource.updateMany({
    where: {
      id: knowledgeSourceId,
      processingStatus: {
        not: KnowledgeSourceProcessingStatus.Processing,
      },
    },
    data: {
      processingStatus: KnowledgeSourceProcessingStatus.Processing,
    },
  });

  if (claimed.count === 0) {
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

  const duplicateSource = await findCompletedKnowledgeSourceByFileHash({
    userId,
    fileHash: knowledgeSource.fileHash,
    excludeId: knowledgeSourceId,
  });

  const job = await createAIJob({
    knowledgeSourceId,
    userId,
    promptVersion: env.aiPromptVersion,
    parserVersion: env.knowledgeJsonVersion,
  });

  trackAnalyticsEvent({
    userId,
    name: AnalyticsEvents.AIJobQueued,
    category: "ai",
    source: "pipeline",
    properties: { jobId: job.id, knowledgeSourceId },
  });

  const tracker = new UsageTracker();

  try {
    await updateAIJobStatus(job.id, AIJobStatus.Running, AIJobStep.Ocr);
    const images = await findImagesByKnowledgeSourceId(knowledgeSourceId);
    const rawText = await extractDocumentText(knowledgeSource, images, tracker);
    await persistJobUsage(job.id, tracker);

    await updateStep(job.id, AIJobStep.ImageExtraction);
    let knowledgeImages = images;
    try {
      const figureImages = await extractFiguresFromPageImages({
        knowledgeSourceId,
        ownerId: userId,
        pageImages: images,
        existingImages: images,
        tracker,
      });
      knowledgeImages = mergeKnowledgeSourceImages(images, figureImages);
    } catch (error) {
      logger.warn("Figure extraction failed; continuing without study figures.", {
        knowledgeSourceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await persistJobUsage(job.id, tracker);

    await updateStep(job.id, AIJobStep.TextCleaning);
    const cleanedText = cleanExtractedText(rawText);
    if (cleanedText.length < 100) {
      throw new AIProcessingError(
        "Testo estratto troppo breve per l'elaborazione.",
        "TEXT_TOO_SHORT"
      );
    }

    await updateStep(job.id, AIJobStep.LlmExtraction);
    const extracted = await extractKnowledgeJson(
      {
        title: knowledgeSource.title,
        subject: subject.name,
        language: knowledgeSource.language,
        cleanedText,
        fileHash: knowledgeSource.fileHash,
      },
      tracker
    );
    await persistJobUsage(job.id, tracker);

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
    const enriched = enrichKnowledgeWithImages(normalized, knowledgeImages);

    await updateStep(job.id, AIJobStep.Persistence);
    const { atomCount, cardCount } = await persistKnowledgeGraph({
      knowledge: enriched,
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
    await persistJobUsage(job.id, tracker);

    const usage = tracker.snapshot();

    trackAnalyticsEvent({
      userId,
      name: AnalyticsEvents.AIJobCompleted,
      category: "ai",
      source: "pipeline",
      properties: {
        jobId: job.id,
        knowledgeSourceId,
        atomCount,
        cardCount,
        estimatedCostUsd: usage.estimatedCostUsd,
        cacheHits: usage.cacheHits,
        cacheMisses: usage.cacheMisses,
      },
    });
    trackFunnelMilestoneAsync({
      userId,
      name: AnalyticsEvents.FunnelFirstAICompleted,
      category: "funnel",
      source: "pipeline",
      properties: { jobId: job.id },
    });

    return {
      jobId: job.id,
      knowledgeSourceId,
      atomCount,
      cardCount,
      status: AIJobStatus.Completed,
      estimatedCostUsd: usage.estimatedCostUsd,
      cacheHits: usage.cacheHits,
      cacheMisses: usage.cacheMisses,
      deduplicatedFrom: duplicateSource,
    };
  } catch (error) {
    const userError = toUserFacingAIError(error);
    const message = userError.message;

    await updateKnowledgeSourceStatus(
      knowledgeSourceId,
      KnowledgeSourceProcessingStatus.Failed
    );

    await persistJobUsage(job.id, tracker);
    await updateAIJobStatus(job.id, AIJobStatus.Failed, null, message);

    logger.error("AI processing failed", userError, {
      knowledgeSourceId,
      userId,
      code: userError.code,
    });

    trackPipelineError({
      userId,
      pipeline: "ai",
      code: userError.code,
      message,
    });
    trackAnalyticsEvent({
      userId,
      name: AnalyticsEvents.AIJobFailed,
      category: "ai",
      source: "pipeline",
      properties: { jobId: job.id, knowledgeSourceId, message },
    });

    throw userError;
  }
}

export async function getProcessingJob(jobId: AIJobId, userId: UserId) {
  const job = await findAIJobById(jobId);
  if (!job || job.userId !== userId) {
    return null;
  }
  return job;
}

export async function getLatestProcessingJob(
  knowledgeSourceId: KnowledgeSourceId,
  userId: UserId
) {
  const jobs = await findAIJobsByKnowledgeSourceId(knowledgeSourceId);
  const job = jobs[0];
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
    logger.error("Background AI processing failed", error, {
      knowledgeSourceId,
      userId,
    });
  });
}
