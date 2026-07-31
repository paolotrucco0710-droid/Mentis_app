import type { UsageTrackerSnapshot } from "./types";
import { estimateModelCost } from "./cost";

export class UsageTracker {
  private inputTokens = 0;
  private outputTokens = 0;
  private estimatedCostUsd = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordCacheHit(): void {
    this.cacheHits += 1;
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
  }

  recordUsage(
    model: string,
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
    } | null,
    cachedCost?: { inputTokens: number; outputTokens: number; estimatedCostUsd: number }
  ): void {
    if (cachedCost) {
      this.inputTokens += cachedCost.inputTokens;
      this.outputTokens += cachedCost.outputTokens;
      this.estimatedCostUsd += cachedCost.estimatedCostUsd;
      return;
    }

    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
    this.estimatedCostUsd += estimateModelCost(model, inputTokens, outputTokens);
  }

  snapshot(): UsageTrackerSnapshot {
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      estimatedCostUsd: Number(this.estimatedCostUsd.toFixed(6)),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }
}
