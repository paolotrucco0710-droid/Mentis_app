import { NextResponse } from "next/server";
import type { SubjectId } from "@/domain/ids";
import { resolveDevSubjectId, resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { getReviewQueue, ReviewEngineError } from "@/review";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectIdParam = searchParams.get("subjectId");
    const subjectId = subjectIdParam
      ? (resolveDevSubjectId(subjectIdParam) as SubjectId)
      : null;

    const queue = await getReviewQueue({ userId, subjectId });

    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    if (error instanceof ReviewEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Review queue failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante il recupero della coda revisioni.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
