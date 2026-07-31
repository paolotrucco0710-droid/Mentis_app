import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { SubjectId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import {
  createCourseForUser,
  listCoursesForSubject
} from "@/course";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId è obbligatorio.", code: "SUBJECT_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const courses = await listCoursesForSubject(userId, subjectId as SubjectId);
    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/courses", request });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      subjectId?: string;
      title?: string;
      description?: string | null;
    };

    if (!body.subjectId || !body.title?.trim()) {
      return NextResponse.json(
        {
          error: "subjectId e title sono obbligatori.",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const course = await createCourseForUser(userId, {
      subjectId: body.subjectId as SubjectId,
      title: body.title,
      description: body.description ?? null,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/courses", request });
  }
}

