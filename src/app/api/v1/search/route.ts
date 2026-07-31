import { NextResponse } from "next/server";
import { AnalyticsEvents, trackAnalyticsEvent } from "@/analytics";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { CourseManagementError, searchLibrary } from "@/course";
import { withServerCache } from "@/lib/cache/memory-cache";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";

    const results = await withServerCache(
      `search:${userId}:${query.trim().toLowerCase()}`,
      env.serverQueryCacheTtlSeconds * 1000,
      () => searchLibrary(userId, query)
    );
    if (query.trim()) {
      trackAnalyticsEvent({
        userId,
        name: AnalyticsEvents.FeatureSearch,
        category: "feature",
        source: "api",
        properties: { queryLength: query.trim().length },
      });
    }
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    if (error instanceof CourseManagementError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Search API failed:", error);
    return NextResponse.json(
      { error: "Errore interno.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
