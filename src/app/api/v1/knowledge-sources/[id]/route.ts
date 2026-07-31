import { NextResponse } from "next/server";
import type { KnowledgeSourceId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import {
  CourseManagementError,
  deleteKnowledgeSourceForUser,
  getChapterByKnowledgeSource,
} from "@/course";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = resolveDevUserId();
    const { id } = await context.params;
    const chapter = await getChapterByKnowledgeSource(
      userId,
      id as KnowledgeSourceId
    );

    return NextResponse.json({ chapter }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = resolveDevUserId();
    const { id } = await context.params;
    await deleteKnowledgeSourceForUser(userId, id as KnowledgeSourceId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof CourseManagementError || error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Knowledge source API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
