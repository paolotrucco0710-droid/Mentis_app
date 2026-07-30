import { NextResponse } from "next/server";
import {
  FeedEngineError,
  createFeedSession,
  resolveDevSubjectId,
  resolveDevUserId,
} from "@/engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = resolveDevUserId();
    const body = (await request.json().catch(() => ({}))) as {
      subjectId?: string;
    };
    const subjectId = resolveDevSubjectId(body.subjectId ?? null);
    const session = await createFeedSession({ userId, subjectId });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Feed session creation failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante la creazione della sessione.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
