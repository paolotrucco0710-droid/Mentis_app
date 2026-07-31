import { NextResponse } from "next/server";
import type { StudySessionId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { endSession, SessionEngineError } from "@/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      finalMotivation?: number;
      focusScore?: number;
      fatigueScore?: number;
    };

    const result = await endSession(userId, id as StudySessionId, {
      finalMotivation: body.finalMotivation ?? null,
      focusScore: body.focusScore ?? null,
      fatigueScore: body.fatigueScore ?? null,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof SessionEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Session end failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante la chiusura della sessione.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
