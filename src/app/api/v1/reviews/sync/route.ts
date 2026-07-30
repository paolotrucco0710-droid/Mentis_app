import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { ReviewEngineError, syncReviewsForUser } from "@/review";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = resolveDevUserId();
    const synced = await syncReviewsForUser(userId);

    return NextResponse.json({ synced }, { status: 200 });
  } catch (error) {
    if (error instanceof ReviewEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Review sync failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante la sincronizzazione delle revisioni.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
