import { NextResponse } from "next/server";
import {
  getAIUsageInsights,
  getAnalyticsOverview,
  getFeatureUsageBreakdown,
  getLearningMetrics,
  getOnboardingFunnel,
  getRecentAnalyticsErrors,
  getStudyTimeInsights,
} from "@/analytics";
import { resolveDevUserId } from "@/engine/dev";
import { handleAnalyticsRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "overview";

    switch (view) {
      case "overview": {
        const overview = await getAnalyticsOverview(userId);
        return NextResponse.json({ overview }, { status: 200 });
      }
      case "funnel": {
        const funnel = await getOnboardingFunnel(userId);
        return NextResponse.json({ funnel }, { status: 200 });
      }
      case "learning": {
        const learning = await getLearningMetrics(userId);
        return NextResponse.json({ learning }, { status: 200 });
      }
      case "study-time": {
        const studyTime = await getStudyTimeInsights(userId);
        return NextResponse.json({ studyTime }, { status: 200 });
      }
      case "ai-usage": {
        const aiUsage = await getAIUsageInsights(userId);
        return NextResponse.json({ aiUsage }, { status: 200 });
      }
      case "errors": {
        const errors = await getRecentAnalyticsErrors(userId);
        return NextResponse.json({ errors }, { status: 200 });
      }
      case "features": {
        const days = Number(searchParams.get("days") ?? "30");
        const features = await getFeatureUsageBreakdown(
          userId,
          Number.isFinite(days) && days > 0 ? days : 30
        );
        return NextResponse.json({ features }, { status: 200 });
      }
      default:
        return NextResponse.json(
          { error: "Vista analytics non valida.", code: "INVALID_VIEW" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleAnalyticsRouteError(error);
  }
}
