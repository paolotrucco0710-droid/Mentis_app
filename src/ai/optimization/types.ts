export type AIResultCacheKind = "ocr_image" | "ocr_document" | "extraction";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface UsageTrackerSnapshot {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface AICostSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  cacheHitRate: number;
}

export interface AIJobCostView {
  id: string;
  knowledgeSourceId: string;
  status: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  cacheHits: number;
  cacheMisses: number;
  queuedAt: Date;
  completedAt: Date | null;
}
