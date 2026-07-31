import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { StudySessionId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { endSession } from "@/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      finalMotivation?: number;
      focusScore?: number;
      fatigueScore?: number;
    };

    const result = await endSession(userId, id as StudySessionId, {
      finalMotivation: body.finalMotivation ?? null,
      focusScore: body.focusScore ?? null,
      fatigueScore: body.fatigueScore ?? null,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/sessions/[id]/end", request });
  }
}
