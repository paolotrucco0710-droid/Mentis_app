import type {
  AIUsageInsightView,
  AnalyticsErrorView,
  AnalyticsOverviewView,
  LearningMetricsView,
  OnboardingFunnelView,
  StudyTimeInsightView,
} from "@/analytics";
import { apiFetch } from "./client";

export async function trackAnalyticsEvent(input: {
  name: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  await apiFetch("/api/v1/analytics/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewView> {
  const data = await apiFetch<{ overview: AnalyticsOverviewView }>(
    "/api/v1/analytics/summary?view=overview"
  );
  return data.overview;
}

export async function fetchOnboardingFunnel(): Promise<OnboardingFunnelView> {
  const data = await apiFetch<{ funnel: OnboardingFunnelView }>(
    "/api/v1/analytics/summary?view=funnel"
  );
  return data.funnel;
}

export async function fetchLearningMetrics(): Promise<LearningMetricsView> {
  const data = await apiFetch<{ learning: LearningMetricsView }>(
    "/api/v1/analytics/summary?view=learning"
  );
  return data.learning;
}

export async function fetchStudyTimeInsights(): Promise<StudyTimeInsightView> {
  const data = await apiFetch<{ studyTime: StudyTimeInsightView }>(
    "/api/v1/analytics/summary?view=study-time"
  );
  return data.studyTime;
}

export async function fetchAIUsageInsights(): Promise<AIUsageInsightView> {
  const data = await apiFetch<{ aiUsage: AIUsageInsightView }>(
    "/api/v1/analytics/summary?view=ai-usage"
  );
  return data.aiUsage;
}

export async function fetchAnalyticsErrors(): Promise<AnalyticsErrorView[]> {
  const data = await apiFetch<{ errors: AnalyticsErrorView[] }>(
    "/api/v1/analytics/summary?view=errors"
  );
  return data.errors;
}

export async function fetchFeatureUsage(
  days = 30
): Promise<Array<{ name: string; count: number }>> {
  const data = await apiFetch<{ features: Array<{ name: string; count: number }> }>(
    `/api/v1/analytics/summary?view=features&days=${days}`
  );
  return data.features;
}
