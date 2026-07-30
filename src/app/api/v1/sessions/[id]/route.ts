import { NextResponse } from "next/server";
import type { StudySessionId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { getSessionDetail, SessionEngineError } from "@/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = resolveDevUserId();
    const { id } = await context.params;
    const detail = await getSessionDetail(userId, id as StudySessionId);

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof SessionEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Session fetch failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante il recupero della sessione.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
