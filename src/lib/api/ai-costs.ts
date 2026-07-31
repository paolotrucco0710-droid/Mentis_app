import type { AICostSummary, AIJobCostView } from "@/ai/optimization";
import { apiFetch } from "./client";

export async function fetchAICostSummary(): Promise<AICostSummary> {
  const data = await apiFetch<{ summary: AICostSummary }>("/api/v1/ai/costs");
  return data.summary;
}

export async function fetchAIJobCosts(): Promise<AIJobCostView[]> {
  const data = await apiFetch<{ jobs: AIJobCostView[] }>(
    "/api/v1/ai/costs?view=jobs"
  );
  return data.jobs;
}
