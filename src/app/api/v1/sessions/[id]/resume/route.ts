import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { StudySessionId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { resumeSession } from "@/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const detail = await resumeSession(userId, id as StudySessionId);

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/sessions/[id]/resume", request });
  }
}
