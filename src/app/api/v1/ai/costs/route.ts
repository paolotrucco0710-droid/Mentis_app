import { NextResponse } from "next/server";
import { getUserAICostSummary, listRecentAIJobCosts } from "@/ai";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";

export const runtime = "nodejs";

function handleError(error: unknown) {
  if (error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("AI costs API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "jobs") {
      const jobs = await listRecentAIJobCosts(userId);
      return NextResponse.json({ jobs }, { status: 200 });
    }

    const summary = await getUserAICostSummary(userId);
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
