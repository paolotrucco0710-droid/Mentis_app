import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import type { KnowledgeSourceId } from "@/domain/ids";
import { prisma } from "@/db/client";
import { buildExtractionCacheKey } from "./cache-keys";
import { readCacheResult } from "./cache";
import { env } from "@/lib/env";
import type { ParsedKnowledgeJson } from "../schema";

export async function findCompletedKnowledgeSourceByFileHash(input: {
  userId: string;
  fileHash: string;
  excludeId?: KnowledgeSourceId;
}): Promise<{ id: string; title: string } | null> {
  const record = await prisma.knowledgeSource.findFirst({
    where: {
      userId: input.userId,
      fileHash: input.fileHash,
      processingStatus: KnowledgeSourceProcessingStatus.Completed,
      deletedAt: null,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
    select: { id: true, title: true },
    orderBy: { processedAt: "desc" },
  });

  return record;
}

export async function readCachedExtraction(input: {
  textHash: string;
  promptVersion: string;
  parserVersion: string;
}): Promise<ParsedKnowledgeJson | null> {
  const cacheKey = buildExtractionCacheKey({
    textHash: input.textHash,
    promptVersion: input.promptVersion,
    parserVersion: input.parserVersion,
    model: env.aiReasoningModel,
  });

  const cached = await readCacheResult<ParsedKnowledgeJson>(cacheKey);
  return cached?.value ?? null;
}

export async function readCachedExtractionByFileHash(input: {
  fileHash: string;
  promptVersion: string;
  parserVersion: string;
}): Promise<ParsedKnowledgeJson | null> {
  const cacheKey = buildExtractionCacheKey({
    textHash: input.fileHash,
    promptVersion: input.promptVersion,
    parserVersion: input.parserVersion,
    model: env.aiReasoningModel,
  });

  const cached = await readCacheResult<ParsedKnowledgeJson>(cacheKey);
  return cached?.value ?? null;
}
