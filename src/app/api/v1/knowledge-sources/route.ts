import { NextResponse } from "next/server";
import type { SubjectId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import {
  CourseManagementError,
  listKnowledgeSourcesForSubject,
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

    const knowledgeSources = await listKnowledgeSourcesForSubject(
      userId,
      subjectId as SubjectId
    );

    return NextResponse.json({ knowledgeSources }, { status: 200 });
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

  console.error("Knowledge sources API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
