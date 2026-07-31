import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/analytics/summary/route";

vi.mock("@/engine/dev", () => ({
  resolveDevUserId: vi.fn(async () => "00000000-0000-4000-8000-000000000001"),
}));

vi.mock("@/analytics/service", () => ({
  getAnalyticsOverview: vi.fn(async () => ({
    totalEvents: 12,
    studyTimeMs: 3600000,
    cardsCompleted: 24,
    accuracyPercent: 82,
    aiJobsCompleted: 2,
    aiEstimatedCostUsd: 0.12,
    errorCount: 0,
    activeStreak: 3,
  })),
  getOnboardingFunnel: vi.fn(),
  getLearningMetrics: vi.fn(),
  getStudyTimeInsights: vi.fn(),
  getAIUsageInsights: vi.fn(),
  getRecentAnalyticsErrors: vi.fn(),
  getFeatureUsageBreakdown: vi.fn(),
}));

describe("integration/api analytics summary", () => {
  it("returns overview payload for authenticated users", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/analytics/summary?view=overview")
    );
    const body = (await response.json()) as {
      overview: { totalEvents: number; cardsCompleted: number };
    };

    expect(response.status).toBe(200);
    expect(body.overview.totalEvents).toBe(12);
    expect(body.overview.cardsCompleted).toBe(24);
  });

  it("rejects unknown views", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/analytics/summary?view=unknown")
    );

    expect(response.status).toBe(400);
  });
});
