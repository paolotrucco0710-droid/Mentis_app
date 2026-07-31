import type { UserId } from "@/domain/ids";
import { prisma } from "@/db/client";
import type { AICostSummary, AIJobCostView } from "./types";

export async function getUserAICostSummary(
  userId: UserId
): Promise<AICostSummary> {
  const aggregate = await prisma.aIJob.aggregate({
    where: { userId },
    _count: { _all: true },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
      cacheHits: true,
      cacheMisses: true,
    },
  });

  const completedJobs = await prisma.aIJob.count({
    where: { userId, status: "completed" },
  });
  const failedJobs = await prisma.aIJob.count({
    where: { userId, status: "failed" },
  });

  const totalCacheHits = aggregate._sum.cacheHits ?? 0;
  const totalCacheMisses = aggregate._sum.cacheMisses ?? 0;
  const totalCacheAccess = totalCacheHits + totalCacheMisses;

  return {
    totalJobs: aggregate._count._all,
    completedJobs,
    failedJobs,
    totalInputTokens: aggregate._sum.inputTokens ?? 0,
    totalOutputTokens: aggregate._sum.outputTokens ?? 0,
    totalEstimatedCostUsd: Number(aggregate._sum.estimatedCostUsd ?? 0),
    totalCacheHits,
    totalCacheMisses,
    cacheHitRate:
      totalCacheAccess > 0
        ? Math.round((totalCacheHits / totalCacheAccess) * 100)
        : 0,
  };
}

export async function listRecentAIJobCosts(
  userId: UserId,
  limit = 20
): Promise<AIJobCostView[]> {
  const records = await prisma.aIJob.findMany({
    where: { userId },
    orderBy: { queuedAt: "desc" },
    take: limit,
    select: {
      id: true,
      knowledgeSourceId: true,
      status: true,
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
      cacheHits: true,
      cacheMisses: true,
      queuedAt: true,
      completedAt: true,
    },
  });

  return records.map((record) => ({
    id: record.id,
    knowledgeSourceId: record.knowledgeSourceId,
    status: record.status,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    estimatedCostUsd: Number(record.estimatedCostUsd),
    cacheHits: record.cacheHits,
    cacheMisses: record.cacheMisses,
    queuedAt: record.queuedAt,
    completedAt: record.completedAt,
  }));
}
