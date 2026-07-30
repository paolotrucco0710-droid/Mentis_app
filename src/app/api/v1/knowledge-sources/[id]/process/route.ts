import { NextResponse } from "next/server";
import type { KnowledgeSourceId } from "@/domain/ids";
import { AIProcessingError, processKnowledgeSource } from "@/ai";
import { resolveDevUserId } from "@/upload";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = resolveDevUserId();
    const result = await processKnowledgeSource(
      id as KnowledgeSourceId,
      userId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AIProcessingError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("AI processing failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante l'elaborazione AI.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
