import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { SessionEventOutcome } from "@/domain/enums";
import type {
  AtomId,
  CardId,
  KnowledgeSourceId,
  StudySessionId,
} from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { recordCardResponse } from "@/progress";

export const runtime = "nodejs";

const VALID_OUTCOMES = new Set<string>(Object.values(SessionEventOutcome));

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const parsedBody = await parseJsonBody<{
      sessionId?: string;
      cardId?: string;
      atomId?: string;
      outcome?: string;
      isCorrect?: boolean;
      responseTimeMs?: number;
      durationMs?: number;
      declaredConfidence?: number;
      feedPosition?: number;
      includeNextFeed?: boolean;
      knowledgeSourceId?: string;
    }>(request);

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body = parsedBody.data;

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
      includeNextFeed: body.includeNextFeed === true,
      ...(body.knowledgeSourceId
        ? { knowledgeSourceId: body.knowledgeSourceId as KnowledgeSourceId }
        : {}),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/progress/responses", request });
  }
}
