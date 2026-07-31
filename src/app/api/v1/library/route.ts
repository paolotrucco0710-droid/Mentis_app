import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { AnalyticsEvents, trackAnalyticsEvent } from "@/analytics";
import { resolveDevUserId } from "@/engine/dev";
import { getLibraryOverview } from "@/course";
import { withServerCache } from "@/lib/cache/memory-cache";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const overview = await withServerCache(
      `library:${userId}`,
      env.serverQueryCacheTtlSeconds * 1000,
      () => getLibraryOverview(userId)
    );
    trackAnalyticsEvent({
      userId,
      name: AnalyticsEvents.FeatureLibraryViewed,
      category: "feature",
      source: "api",
    });
    return NextResponse.json({ overview }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/library", request });
  }
}
