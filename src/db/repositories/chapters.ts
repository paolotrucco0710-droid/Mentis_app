import type { ChapterId, CourseId, KnowledgeSourceId, SubjectId, UserId } from "@/domain/ids";
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

export interface UpdateChapterInput {
  title?: string;
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

export async function findChaptersBySubjectId(
  subjectId: SubjectId
): Promise<Chapter[]> {
  const records = await prisma.chapter.findMany({
    where: { subjectId, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  return records.map(toChapter);
}

export async function countChaptersByCourseId(
  courseId: CourseId
): Promise<number> {
  return prisma.chapter.count({
    where: { courseId, deletedAt: null },
  });
}

export async function createChapter(
  input: CreateChapterInput
): Promise<Chapter> {
  const record = await prisma.chapter.create({ data: input });
  return toChapter(record);
}

export async function updateChapter(
  id: ChapterId,
  input: UpdateChapterInput
): Promise<Chapter> {
  const record = await prisma.chapter.update({
    where: { id },
    data: input,
  });
  return toChapter(record);
}

export async function softDeleteChapter(id: ChapterId): Promise<void> {
  const now = new Date();
  const chapter = await prisma.chapter.findUnique({ where: { id } });
  if (!chapter) {
    return;
  }

  await prisma.$transaction([
    prisma.chapter.update({
      where: { id },
      data: { deletedAt: now },
    }),
    prisma.knowledgeSource.update({
      where: { id: chapter.knowledgeSourceId },
      data: { deletedAt: now },
    }),
  ]);
}

export async function searchChaptersByTitle(
  userId: UserId,
  query: string,
  limit = 10
): Promise<Chapter[]> {
  const records = await prisma.chapter.findMany({
    where: {
      deletedAt: null,
      title: { contains: query, mode: "insensitive" },
      subject: { userId, deletedAt: null },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return records.map(toChapter);
}

export async function findChapterByKnowledgeSourceId(
  knowledgeSourceId: KnowledgeSourceId
): Promise<Chapter | null> {
  const record = await prisma.chapter.findFirst({
    where: { knowledgeSourceId, deletedAt: null },
  });
  return record ? toChapter(record) : null;
}
