import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { CourseId, SubjectId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { assertSubjectOwned } from "@/course/helpers";
import { findChaptersByCourseId, findChaptersBySubjectId } from "@/db/repositories/chapters";
import { countAtomsByKnowledgeSourceId } from "@/db/repositories/atoms";
import { findKnowledgeSourceById } from "@/db/repositories/knowledge-sources";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const courseId = searchParams.get("courseId");

    if (!subjectId && !courseId) {
      return NextResponse.json(
        {
          error: "subjectId o courseId è obbligatorio.",
          code: "SCOPE_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (subjectId) {
      await assertSubjectOwned(userId, subjectId as SubjectId);
    }

    const chapters = courseId
      ? await findChaptersByCourseId(courseId as CourseId)
      : await findChaptersBySubjectId(subjectId as SubjectId);

    const enriched = await Promise.all(
      chapters.map(async (chapter) => {
        const knowledgeSource = await findKnowledgeSourceById(
          chapter.knowledgeSourceId
        );
        if (!knowledgeSource) {
          return null;
        }

        const atomCount = await countAtomsByKnowledgeSourceId(
          chapter.knowledgeSourceId
        );

        return {
          ...chapter,
          knowledgeSource,
          atomCount,
        };
      })
    );

    return NextResponse.json(
      {
        chapters: enriched.filter((chapter) => Boolean(chapter)),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/chapters", request });
  }
}

