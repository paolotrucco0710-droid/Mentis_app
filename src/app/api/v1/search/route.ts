import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { CourseManagementError, searchLibrary } from "@/course";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";

    const results = await searchLibrary(userId, query);
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
