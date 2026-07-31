import { env } from "@/lib/env";

export function estimateModelCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const isVision = model.includes("vision") || model === env.aiVisionModel;
  const inputRate = isVision
    ? env.aiVisionCostInputPerMillion
    : env.aiCostInputPerMillion;
  const outputRate = isVision
    ? env.aiVisionCostOutputPerMillion
    : env.aiCostOutputPerMillion;

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const outputCost = (outputTokens / 1_000_000) * outputRate;
  return Number((inputCost + outputCost).toFixed(6));
}
