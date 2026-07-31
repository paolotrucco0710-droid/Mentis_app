import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { AnalyticsEvents, trackAnalyticsEvent } from "@/analytics";
import { resolveDevUserId } from "@/engine/dev";
import { searchLibrary } from "@/course";
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
    return handleApiRouteError(error, { route: "/api/v1/search", request });
  }
}
