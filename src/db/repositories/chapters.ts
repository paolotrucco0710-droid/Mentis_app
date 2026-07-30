import type { ChapterId, CourseId } from "@/domain/ids";
import type { Chapter } from "@/domain/entities";
import type { DifficultyLevel } from "@/domain/enums";
import { prisma } from "../client";
import { toChapter } from "../mappers";

export interface CreateChapterInput {
  courseId: CourseId;
  subjectId: string;
  knowledgeSourceId: string;
  title: string;
  chapterNumber?: number | null;
  displayOrder?: number;
  estimatedStudyTimeMinutes?: number | null;
  difficultyLevel?: DifficultyLevel | null;
  atomCount?: number;
}

export async function findChapterById(id: ChapterId): Promise<Chapter | null> {
  const record = await prisma.chapter.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toChapter(record) : null;
}

export async function findChaptersByCourseId(
  courseId: CourseId
): Promise<Chapter[]> {
  const records = await prisma.chapter.findMany({
    where: { courseId, deletedAt: null },
    orderBy: { displayOrder: "asc" },
  });
  return records.map(toChapter);
}

export async function createChapter(
  input: CreateChapterInput
): Promise<Chapter> {
  const record = await prisma.chapter.create({ data: input });
  return toChapter(record);
}
