import { NextResponse } from "next/server";
import { SessionEventOutcome } from "@/domain/enums";
import type {
  AtomId,
  CardId,
  StudySessionId,
} from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { ProgressEngineError, recordCardResponse } from "@/progress";
import { SessionEngineError } from "@/session";

export const runtime = "nodejs";

const VALID_OUTCOMES = new Set<string>(Object.values(SessionEventOutcome));

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      sessionId?: string;
      cardId?: string;
      atomId?: string;
      outcome?: string;
      isCorrect?: boolean;
      responseTimeMs?: number;
      durationMs?: number;
      declaredConfidence?: number;
      feedPosition?: number;
    };

    if (!body.sessionId || !body.cardId || !body.atomId || !body.outcome) {
      return NextResponse.json(
        {
          error: "sessionId, cardId, atomId e outcome sono obbligatori.",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    if (!VALID_OUTCOMES.has(body.outcome)) {
      return NextResponse.json(
        {
          error: "outcome non valido.",
          code: "INVALID_OUTCOME",
        },
        { status: 400 }
      );
    }

    const result = await recordCardResponse({
      userId,
      sessionId: body.sessionId as StudySessionId,
      cardId: body.cardId as CardId,
      atomId: body.atomId as AtomId,
      outcome: body.outcome as SessionEventOutcome,
      isCorrect: body.isCorrect,
      responseTimeMs: body.responseTimeMs,
      durationMs: body.durationMs,
      declaredConfidence: body.declaredConfidence,
      feedPosition: body.feedPosition,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (
      error instanceof ProgressEngineError ||
      error instanceof SessionEngineError
    ) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Progress response failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante l'aggiornamento del progresso.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
