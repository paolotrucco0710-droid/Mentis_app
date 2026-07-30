import { NextResponse } from "next/server";
import { ProgressScopeType } from "@/domain/entities/progress";
import type { ChapterId, CourseId, SubjectId } from "@/domain/ids";
import { resolveDevSubjectId, resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import { getProgress, ProgressEngineError } from "@/progress";

export const runtime = "nodejs";

const VALID_SCOPES = new Set<string>(Object.values(ProgressScopeType));

export async function GET(request: Request) {
  try {
    const userId = resolveDevUserId();
    const { searchParams } = new URL(request.url);
    const scopeType = searchParams.get("scopeType") ?? ProgressScopeType.Subject;
    const scopeIdParam = searchParams.get("scopeId");

    if (!VALID_SCOPES.has(scopeType)) {
      return NextResponse.json(
        {
          error: "scopeType non valido. Usa subject, course o chapter.",
          code: "INVALID_SCOPE",
        },
        { status: 400 }
      );
    }

    let scopeId = scopeIdParam;
    if (scopeType === ProgressScopeType.Subject) {
      scopeId = resolveDevSubjectId(scopeIdParam);
    }

    if (!scopeId) {
      return NextResponse.json(
        {
          error: "scopeId è obbligatorio per course e chapter.",
          code: "SCOPE_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const progress = await getProgress({
      userId,
      scopeType: scopeType as ProgressScopeType,
      scopeId: scopeId as SubjectId | CourseId | ChapterId,
    });

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    if (error instanceof ProgressEngineError || error instanceof FeedEngineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Progress query failed:", error);
    return NextResponse.json(
      {
        error: "Errore interno durante il recupero del progresso.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
