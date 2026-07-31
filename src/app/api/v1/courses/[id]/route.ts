import { NextResponse } from "next/server";
import type { CourseId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import {
  CourseManagementError,
  deleteCourseForUser,
  updateCourseForUser,
} from "@/course";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
    };

    const course = await updateCourseForUser(userId, id as CourseId, body);
    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    await deleteCourseForUser(userId, id as CourseId);
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

  console.error("Course API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
