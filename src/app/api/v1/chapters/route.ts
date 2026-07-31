import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { CourseId, SubjectId } from "@/domain/ids";
import { listChaptersForUser } from "@/course";
import { resolveDevUserId } from "@/engine/dev";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const courseId = searchParams.get("courseId");

    const chapters = await listChaptersForUser(userId, {
      subjectId: subjectId ? (subjectId as SubjectId) : undefined,
      courseId: courseId ? (courseId as CourseId) : undefined,
    });

    return NextResponse.json({ chapters }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/chapters", request });
  }
}
