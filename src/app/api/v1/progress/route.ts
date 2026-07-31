import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { ProgressScopeType } from "@/domain/entities/progress";
import type { ChapterId, CourseId, SubjectId } from "@/domain/ids";
import { resolveDevUserId, resolveRequestedSubjectId } from "@/engine/dev";
import { getProgress } from "@/progress";
import { assertProgressScopeOwned } from "@/progress/scope-access";

export const runtime = "nodejs";

const VALID_SCOPES = new Set<string>(Object.values(ProgressScopeType));

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
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
      scopeId = await resolveRequestedSubjectId(userId, scopeIdParam);
    } else if (!scopeId) {
      return NextResponse.json(
        {
          error: "scopeId è obbligatorio per course e chapter.",
          code: "SCOPE_ID_REQUIRED",
        },
        { status: 400 }
      );
    } else {
      await assertProgressScopeOwned(
        userId,
        scopeType as ProgressScopeType,
        scopeId
      );
    }

    const progress = await getProgress({
      userId,
      scopeType: scopeType as ProgressScopeType,
      scopeId: scopeId as SubjectId | CourseId | ChapterId,
    });

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/progress", request });
  }
}
