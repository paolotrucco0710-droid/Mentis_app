import { NextResponse } from "next/server";
import { evaluateRetrievalAnswer } from "@/ai/retrieval-feedback";
import { findAtomById } from "@/db/repositories/atoms";
import { findCardById } from "@/db/repositories/cards";
import { assertSubjectOwned } from "@/course/helpers";
import { CardType } from "@/domain/enums";
import type { AtomId, CardId } from "@/domain/ids";
import {
  isBlurtingPayload,
  isFeynmanPayload,
} from "@/components/feed/card-utils";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { resolveDevUserId } from "@/engine/dev";

export const runtime = "nodejs";

const SUPPORTED_TYPES = new Set<string>([CardType.Blurting, CardType.Feynman]);

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const parsedBody = await parseJsonBody<{
      atomId?: string;
      cardId?: string;
      userAnswer?: string;
    }>(request);

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const { atomId, cardId, userAnswer } = parsedBody.data;

    if (!atomId || !cardId || userAnswer === undefined) {
      return NextResponse.json(
        {
          error: "atomId, cardId e userAnswer sono obbligatori.",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    const [atom, card] = await Promise.all([
      findAtomById(atomId as AtomId),
      findCardById(cardId as CardId),
    ]);

    if (!atom || !card || card.atomId !== atom.id) {
      return NextResponse.json(
        { error: "Card o atomo non trovati.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await assertSubjectOwned(userId, atom.subjectId);

    if (!SUPPORTED_TYPES.has(card.type)) {
      return NextResponse.json(
        {
          error: "Questo tipo di card non supporta la valutazione AI.",
          code: "UNSUPPORTED_CARD_TYPE",
        },
        { status: 400 }
      );
    }

    const blurtingPayload = isBlurtingPayload(card.payload) ? card.payload : null;
    const feynmanPayload = isFeynmanPayload(card.payload) ? card.payload : null;

    if (!blurtingPayload && !feynmanPayload) {
      return NextResponse.json(
        { error: "Payload card non valido.", code: "INVALID_CARD_PAYLOAD" },
        { status: 400 }
      );
    }

    const feedback = await evaluateRetrievalAnswer({
      mode: card.type === CardType.Blurting ? "blurting" : "feynman",
      atomTitle: atom.title,
      atomSummary: atom.summary,
      atomExplanation: atom.explanation,
      prompt:
        blurtingPayload?.prompt ??
        feynmanPayload?.prompt ??
        card.text ??
        atom.title,
      referencePoints:
        blurtingPayload?.keyPoints ?? feynmanPayload?.evaluationCriteria ?? [],
      userAnswer,
    });

    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, {
      route: "/api/v1/ai/evaluate-response",
      request,
    });
  }
}
