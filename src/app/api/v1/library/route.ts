import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { CourseManagementError, getLibraryOverview } from "@/course";
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
    return NextResponse.json({ overview }, { status: 200 });
  } catch (error) {
    if (error instanceof CourseManagementError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Library API failed:", error);
    return NextResponse.json(
      { error: "Errore interno.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
