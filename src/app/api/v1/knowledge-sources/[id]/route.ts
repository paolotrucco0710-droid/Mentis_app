import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { KnowledgeSourceId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import {
  deleteKnowledgeSourceForUser,
  getChapterByKnowledgeSource
} from "@/course";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const chapter = await getChapterByKnowledgeSource(
      userId,
      id as KnowledgeSourceId
    );

    return NextResponse.json({ chapter }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/knowledge-sources/[id]", request });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    await deleteKnowledgeSourceForUser(userId, id as KnowledgeSourceId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/knowledge-sources/[id]", request });
  }
}

