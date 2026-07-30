import { NextResponse } from "next/server";
import { ReviewOutcome } from "@/domain/enums";
import type { ReviewId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { completeReviewForUser, ReviewEngineError } from "@/review";

export const runtime = "nodejs";

const VALID_OUTCOMES = new Set<string>(Object.values(ReviewOutcome));

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = resolveDevUserId();
    const { id } = await context.params;
    const body = (await request.json()) as { outcome?: string };

    if (!body.outcome || !VALID_OUTCOMES.has(body.outcome)) {
      return NextResponse.json(
        {
          error: "outcome obbligatorio: success, partial o failure.",
          code: "INVALID_OUTCOME",
        },
        { status: 400 }
      );
    }

    const result = await completeReviewForUser(
      userId,
      id as ReviewId,
      body.outcome as ReviewOutcome
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ReviewEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Review completion failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante il completamento della revisione.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
