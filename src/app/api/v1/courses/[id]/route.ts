import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { CourseId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import {
  deleteCourseForUser,
  updateCourseForUser
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
    return handleApiRouteError(error, { route: "/api/v1/courses/[id]", request });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    await deleteCourseForUser(userId, id as CourseId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/courses/[id]", request });
  }
}

