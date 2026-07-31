import type { AIJobId, KnowledgeSourceId, UserId } from "@/domain/ids";
import type { AIJob } from "@/domain/entities";
import type { AIJobStatus, AIJobStep } from "@/domain/enums";
import { prisma } from "../client";
import { toAIJob } from "../mappers";

export interface CreateAIJobInput {
  knowledgeSourceId: KnowledgeSourceId;
  userId: UserId;
  maxAttempts?: number;
  promptVersion?: string | null;
  parserVersion?: string | null;
}

export async function findAIJobById(id: AIJobId): Promise<AIJob | null> {
  const record = await prisma.aIJob.findUnique({ where: { id } });
  return record ? toAIJob(record) : null;
}

export async function findAIJobsByKnowledgeSourceId(
  knowledgeSourceId: KnowledgeSourceId
): Promise<AIJob[]> {
  const records = await prisma.aIJob.findMany({
    where: { knowledgeSourceId },
    orderBy: { queuedAt: "desc" },
  });
  return records.map(toAIJob);
}

export async function createAIJob(input: CreateAIJobInput): Promise<AIJob> {
  const record = await prisma.aIJob.create({ data: input });
  return toAIJob(record);
}

export async function updateAIJobStatus(
  id: AIJobId,
  status: AIJobStatus,
  currentStep?: AIJobStep | null,
  errorMessage?: string | null
): Promise<AIJob> {
  const now = new Date();
  const record = await prisma.aIJob.update({
    where: { id },
    data: {
      status,
      currentStep,
      errorMessage,
      ...(status === "running"
        ? { startedAt: now, attemptCount: { increment: 1 } }
        : {}),
      ...(status === "completed" || status === "failed"
        ? { completedAt: now }
        : {}),
    },
  });
  return toAIJob(record);
}

export async function updateAIJobUsage(
  id: AIJobId,
  input: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    cacheHits: number;
    cacheMisses: number;
  }
): Promise<AIJob> {
  const record = await prisma.aIJob.update({
    where: { id },
    data: {
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCostUsd: input.estimatedCostUsd,
      cacheHits: input.cacheHits,
      cacheMisses: input.cacheMisses,
    },
  });
  return toAIJob(record);
}
