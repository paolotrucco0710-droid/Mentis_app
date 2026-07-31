import type { AIResultCacheKind } from "@/ai/optimization/types";
import { prisma } from "../client";

export interface AIResultCacheRecord {
  cacheKey: string;
  kind: AIResultCacheKind;
  contentHash: string;
  model: string | null;
  promptVersion: string | null;
  parserVersion: string | null;
  result: unknown;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  expiresAt: Date | null;
}

export async function findAIResultCacheByKey(
  cacheKey: string
): Promise<AIResultCacheRecord | null> {
  const record = await prisma.aIResultCache.findUnique({
    where: { cacheKey },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt && record.expiresAt <= new Date()) {
    return null;
  }

  await prisma.aIResultCache.update({
    where: { cacheKey },
    data: { hitCount: { increment: 1 } },
  });

  return {
    cacheKey: record.cacheKey,
    kind: record.kind as AIResultCacheKind,
    contentHash: record.contentHash,
    model: record.model,
    promptVersion: record.promptVersion,
    parserVersion: record.parserVersion,
    result: record.result,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    estimatedCostUsd: Number(record.estimatedCostUsd),
    expiresAt: record.expiresAt,
  };
}

export async function upsertAIResultCache(
  input: AIResultCacheRecord
): Promise<void> {
  await prisma.aIResultCache.upsert({
    where: { cacheKey: input.cacheKey },
    create: {
      cacheKey: input.cacheKey,
      kind: input.kind,
      contentHash: input.contentHash,
      model: input.model,
      promptVersion: input.promptVersion,
      parserVersion: input.parserVersion,
      result: input.result as object,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCostUsd: input.estimatedCostUsd,
      expiresAt: input.expiresAt,
    },
    update: {
      result: input.result as object,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCostUsd: input.estimatedCostUsd,
      expiresAt: input.expiresAt,
    },
  });
}
