import { NextResponse } from "next/server";
import type { StudySessionId } from "@/domain/ids";
import {
  FeedEngineError,
  getNextFeedItem,
  resolveDevSubjectId,
  resolveDevUserId,
} from "@/engine";
import { SessionEngineError } from "@/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = resolveDevUserId();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const subjectId = resolveDevSubjectId(searchParams.get("subjectId"));

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "sessionId è obbligatorio.",
          code: "SESSION_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const feed = await getNextFeedItem({
      userId,
      subjectId,
      sessionId: sessionId as StudySessionId,
    });

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    if (error instanceof FeedEngineError || error instanceof SessionEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Feed next item failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante la generazione del feed.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
