import { NextResponse } from "next/server";
import type { SubjectId } from "@/domain/ids";
import { scheduleKnowledgeSourceProcessing } from "@/ai";
import { env } from "@/lib/env";
import {
  UploadPipelineError,
  formDataToUploadFiles,
  parseCourseId,
  processChapterUpload,
  resolveDevUserId,
} from "@/upload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = await resolveDevUserId(request);
    const subjectId = formData.get("subjectId");

    if (typeof subjectId !== "string" || subjectId.trim() === "") {
      return NextResponse.json(
        { error: "subjectId è obbligatorio.", code: "MISSING_SUBJECT" },
        { status: 400 }
      );
    }

    const title = formData.get("title");
    const language = formData.get("language");
    const files = await formDataToUploadFiles(formData);

    const result = await processChapterUpload({
      userId,
      subjectId: subjectId as SubjectId,
      courseId: parseCourseId(formData.get("courseId")),
      title:
        typeof title === "string" && title.trim() !== ""
          ? title.trim()
          : "Nuovo capitolo",
      language: typeof language === "string" ? language : "it",
      files,
    });

    if (env.autoProcessAfterUpload) {
      scheduleKnowledgeSourceProcessing(result.knowledgeSource.id, userId);
    }

    return NextResponse.json(
      {
        uploadId: result.upload.id,
        knowledgeSourceId: result.knowledgeSource.id,
        chapterId: result.chapter.id,
        courseId: result.upload.courseId,
        status: result.upload.status,
        pageCount: result.knowledgeSource.pageCount,
        sourceType: result.knowledgeSource.sourceType,
        imageCount: result.images.length,
        totalSizeBytes: result.totalSizeBytes,
        processingScheduled: env.autoProcessAfterUpload,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UploadPipelineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Errore interno durante l'upload.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
