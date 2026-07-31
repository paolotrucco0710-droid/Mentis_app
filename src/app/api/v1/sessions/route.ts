import { NextResponse } from "next/server";
import { resolveDevSubjectId, resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { openSession, SessionEngineError } from "@/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json().catch(() => ({}))) as {
      subjectId?: string;
      device?: string;
      appVersion?: string;
      initialMotivation?: number;
    };
    const subjectId = resolveDevSubjectId(body.subjectId ?? null);
    const session = await openSession(userId, {
      subjectId,
      device: body.device ?? null,
      appVersion: body.appVersion ?? null,
      initialMotivation: body.initialMotivation ?? null,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof SessionEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Session creation failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante la creazione della sessione.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
