import { env } from "@/lib/env";
import {
  findAIResultCacheByKey,
  upsertAIResultCache,
} from "@/db/repositories/ai-result-cache";
import type { AIResultCacheKind } from "./types";

function getCacheExpiryDate(): Date | null {
  if (env.aiCacheTtlDays <= 0) {
    return null;
  }
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + env.aiCacheTtlDays);
  return expiresAt;
}

export async function readCacheResult<T>(
  cacheKey: string
): Promise<{
  value: T;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
} | null> {
  const record = await findAIResultCacheByKey(cacheKey);
  if (!record) {
    return null;
  }

  return {
    value: record.result as T,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    estimatedCostUsd: record.estimatedCostUsd,
  };
}

export async function writeCacheResult(input: {
  cacheKey: string;
  kind: AIResultCacheKind;
  contentHash: string;
  model: string;
  promptVersion?: string | null;
  parserVersion?: string | null;
  result: unknown;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}): Promise<void> {
  await upsertAIResultCache({
    cacheKey: input.cacheKey,
    kind: input.kind,
    contentHash: input.contentHash,
    model: input.model,
    promptVersion: input.promptVersion ?? null,
    parserVersion: input.parserVersion ?? null,
    result: input.result,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCostUsd: input.estimatedCostUsd,
    expiresAt: getCacheExpiryDate(),
  });
}
