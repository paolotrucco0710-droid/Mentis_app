import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { ChapterId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { deleteChapterForUser } from "@/course";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    await deleteChapterForUser(userId, id as ChapterId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/chapters/[id]", request });
  }
}

