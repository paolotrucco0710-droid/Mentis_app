import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { CourseManagementError, getLibraryOverview } from "@/course";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = resolveDevUserId();
    const overview = await getLibraryOverview(userId);
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
