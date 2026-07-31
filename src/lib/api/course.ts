import type { ChapterId, CourseId, SubjectId } from "@/domain/ids";
import type { ChapterWithSource } from "@/course/types";
import { apiFetch } from "./client";
import { invalidateLibraryCache } from "./library";
import { invalidateQueryPrefix } from "./query-cache";

export async function deleteChapter(chapterId: ChapterId): Promise<void> {
  await apiFetch(`/api/v1/chapters/${chapterId}`, { method: "DELETE" });
  invalidateLibraryCache();
  invalidateQueryPrefix("search:");
}

export async function fetchChapters(input: {
  subjectId?: SubjectId;
  courseId?: CourseId;
}): Promise<ChapterWithSource[]> {
  const params = new URLSearchParams();
  if (input.subjectId) {
    params.set("subjectId", input.subjectId);
  }
  if (input.courseId) {
    params.set("courseId", input.courseId);
  }

  const data = await apiFetch<{ chapters: ChapterWithSource[] }>(
    `/api/v1/chapters?${params.toString()}`
  );
  return data.chapters;
}

export async function deleteKnowledgeSource(
  knowledgeSourceId: string
): Promise<void> {
  await apiFetch(`/api/v1/knowledge-sources/${knowledgeSourceId}`, {
    method: "DELETE",
  });
}

export interface UploadChapterResult {
  uploadId: string;
  knowledgeSourceId: string;
  chapterId: string;
  courseId: string | null;
  status: string;
  pageCount: number;
  sourceType: string;
  imageCount: number;
  totalSizeBytes: number;
  processingScheduled: boolean;
}

export async function uploadChapter(input: {
  subjectId: SubjectId;
  courseId?: CourseId;
  title: string;
  files: File[];
}): Promise<UploadChapterResult> {
  const formData = new FormData();
  formData.set("subjectId", input.subjectId);
  formData.set("title", input.title);
  if (input.courseId) {
    formData.set("courseId", input.courseId);
  }
  for (const file of input.files) {
    formData.append("files", file);
  }

  const result = await apiFetch<UploadChapterResult>("/api/v1/upload", {
    method: "POST",
    body: formData,
  });
  invalidateLibraryCache();
  invalidateQueryPrefix("search:");
  return result;
}

export async function startKnowledgeSourceProcessing(
  knowledgeSourceId: string
): Promise<unknown> {
  return apiFetch(`/api/v1/knowledge-sources/${knowledgeSourceId}/process`, {
    method: "POST",
  });
}

export async function fetchProcessingJob(jobId: string) {
  return apiFetch<{ job: {
    id: string;
    status: string;
    currentStep: string | null;
    errorMessage: string | null;
    knowledgeSourceId: string;
  } }>(`/api/v1/ai-jobs/${jobId}`);
}

export async function fetchChapterByKnowledgeSource(
  knowledgeSourceId: string
): Promise<ChapterWithSource> {
  const data = await apiFetch<{ chapter: ChapterWithSource }>(
    `/api/v1/knowledge-sources/${knowledgeSourceId}`
  );
  return data.chapter;
}
