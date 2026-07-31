import { countAtomsByKnowledgeSourceId } from "@/db/repositories/atoms";
import {
  findChapterById,
  findChapterByKnowledgeSourceId,
  findChaptersByCourseId,
  findChaptersBySubjectId,
  softDeleteChapter,
} from "@/db/repositories/chapters";
import {
  createCourse,
  findCourseById,
  findCoursesBySubjectId,
  softDeleteCourse,
  updateCourse,
} from "@/db/repositories/courses";
import {
  findKnowledgeSourceById,
  findKnowledgeSourcesBySubjectId,
  softDeleteKnowledgeSource,
} from "@/db/repositories/knowledge-sources";
import {
  createSubject,
  softDeleteSubject,
  updateSubject,
} from "@/db/repositories/subjects";
import { deleteKnowledgeSourceFiles } from "@/storage";
import type {
  ChapterId,
  CourseId,
  KnowledgeSourceId,
  SubjectId,
  UserId,
} from "@/domain/ids";
import { CourseManagementError } from "./errors";
import {
  assertCourseOwned,
  assertSubjectOwned,
  getSubjectChapterCount,
  listSubjectSummaries,
} from "./helpers";
import type {
  ChapterWithSource,
  CreateCourseInput,
  CreateSubjectInput,
  LibraryOverview,
  SubjectDetail,
  UpdateCourseInput,
  UpdateSubjectInput,
} from "./types";

async function enrichChapter(
  chapter: Awaited<ReturnType<typeof findChaptersBySubjectId>>[number]
): Promise<ChapterWithSource | null> {
  const knowledgeSource = await findKnowledgeSourceById(chapter.knowledgeSourceId);
  if (!knowledgeSource) {
    return null;
  }

  const atomCount = await countAtomsByKnowledgeSourceId(chapter.knowledgeSourceId);

  return {
    ...chapter,
    knowledgeSource,
    atomCount,
  };
}

export async function listChaptersForUser(
  userId: UserId,
  input: { subjectId?: SubjectId; courseId?: CourseId }
): Promise<ChapterWithSource[]> {
  if (!input.subjectId && !input.courseId) {
    throw new CourseManagementError(
      "subjectId o courseId è obbligatorio.",
      "SCOPE_REQUIRED",
      400
    );
  }

  if (input.courseId) {
    const course = await assertCourseOwned(userId, input.courseId);

    if (input.subjectId && course.subjectId !== input.subjectId) {
      throw new CourseManagementError(
        "Il corso non appartiene alla materia indicata.",
        "COURSE_SUBJECT_MISMATCH",
        409
      );
    }

    const chapters = await findChaptersByCourseId(input.courseId);
    return (
      await Promise.all(chapters.map((chapter) => enrichChapter(chapter)))
    ).filter((chapter): chapter is ChapterWithSource => Boolean(chapter));
  }

  await assertSubjectOwned(userId, input.subjectId!);
  const chapters = await findChaptersBySubjectId(input.subjectId!);
  return (
    await Promise.all(chapters.map((chapter) => enrichChapter(chapter)))
  ).filter((chapter): chapter is ChapterWithSource => Boolean(chapter));
}

export async function getLibraryOverview(
  userId: UserId
): Promise<LibraryOverview> {
  const subjects = await listSubjectSummaries(userId);
  const allChapters = (
    await Promise.all(
      subjects.map((subject) => findChaptersBySubjectId(subject.id))
    )
  ).flat();

  const recent = (
    await Promise.all(allChapters.map((chapter) => enrichChapter(chapter)))
  )
    .filter((chapter): chapter is ChapterWithSource => Boolean(chapter))
    .sort(
      (left, right) =>
        right.knowledgeSource.uploadedAt.getTime() -
        left.knowledgeSource.uploadedAt.getTime()
    )
    .slice(0, 8);

  return {
    subjects,
    recentChapters: recent,
  };
}

export async function getSubjectDetail(
  userId: UserId,
  subjectId: SubjectId
): Promise<SubjectDetail> {
  const subject = await assertSubjectOwned(userId, subjectId);
  const courses = await findCoursesBySubjectId(subjectId);
  const chapters = await findChaptersBySubjectId(subjectId);
  const enriched = (
    await Promise.all(chapters.map((chapter) => enrichChapter(chapter)))
  ).filter((chapter): chapter is ChapterWithSource => Boolean(chapter));

  return {
    subject,
    courses,
    chapters: enriched,
  };
}

export async function createSubjectForUser(
  userId: UserId,
  input: CreateSubjectInput
) {
  const subjects = await listSubjectSummaries(userId);

  return createSubject({
    userId,
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    displayOrder: subjects.length,
  });
}

export async function updateSubjectForUser(
  userId: UserId,
  subjectId: SubjectId,
  input: UpdateSubjectInput
) {
  await assertSubjectOwned(userId, subjectId);
  return updateSubject(subjectId, {
    name: input.name?.trim(),
    color: input.color,
    icon: input.icon,
  });
}

export async function deleteSubjectForUser(
  userId: UserId,
  subjectId: SubjectId
) {
  await assertSubjectOwned(userId, subjectId);
  await softDeleteSubject(subjectId);
}

export async function createCourseForUser(
  userId: UserId,
  input: CreateCourseInput
) {
  await assertSubjectOwned(userId, input.subjectId);
  return createCourse({
    userId,
    subjectId: input.subjectId,
    title: input.title.trim(),
    description: input.description ?? null,
  });
}

export async function updateCourseForUser(
  userId: UserId,
  courseId: CourseId,
  input: UpdateCourseInput
) {
  const course = await findCourseById(courseId);
  if (!course || course.userId !== userId) {
    throw new CourseManagementError("Corso non trovato.", "COURSE_NOT_FOUND", 404);
  }

  return updateCourse(courseId, {
    title: input.title?.trim(),
    description: input.description,
  });
}

export async function deleteCourseForUser(
  userId: UserId,
  courseId: CourseId
) {
  const course = await findCourseById(courseId);
  if (!course || course.userId !== userId) {
    throw new CourseManagementError("Corso non trovato.", "COURSE_NOT_FOUND", 404);
  }

  await softDeleteCourse(courseId);
}

export async function deleteChapterForUser(
  userId: UserId,
  chapterId: ChapterId
) {
  const chapter = await findChapterById(chapterId);
  if (!chapter) {
    throw new CourseManagementError("Capitolo non trovato.", "CHAPTER_NOT_FOUND", 404);
  }

  await assertSubjectOwned(userId, chapter.subjectId);
  await softDeleteChapter(chapterId);
}

export async function deleteKnowledgeSourceForUser(
  userId: UserId,
  knowledgeSourceId: KnowledgeSourceId
) {
  const knowledgeSource = await findKnowledgeSourceById(knowledgeSourceId);
  if (!knowledgeSource || knowledgeSource.userId !== userId) {
    throw new CourseManagementError(
      "Materiale non trovato.",
      "KNOWLEDGE_SOURCE_NOT_FOUND",
      404
    );
  }

  await deleteKnowledgeSourceFiles(knowledgeSourceId);
  await softDeleteKnowledgeSource(knowledgeSourceId);
}

export async function listCoursesForSubject(
  userId: UserId,
  subjectId: SubjectId
) {
  await assertSubjectOwned(userId, subjectId);
  return findCoursesBySubjectId(subjectId);
}

export async function listKnowledgeSourcesForSubject(
  userId: UserId,
  subjectId: SubjectId
) {
  await assertSubjectOwned(userId, subjectId);
  return findKnowledgeSourcesBySubjectId(subjectId);
}

export async function getSubjectStats(userId: UserId, subjectId: SubjectId) {
  await assertSubjectOwned(userId, subjectId);
  const courses = await findCoursesBySubjectId(subjectId);
  const chapterCount = await getSubjectChapterCount(subjectId);
  const knowledgeSources = await findKnowledgeSourcesBySubjectId(subjectId);

  return {
    courseCount: courses.length,
    chapterCount,
    knowledgeSourceCount: knowledgeSources.length,
  };
}

export async function getChapterByKnowledgeSource(
  userId: UserId,
  knowledgeSourceId: KnowledgeSourceId
) {
  const knowledgeSource = await findKnowledgeSourceById(knowledgeSourceId);
  if (!knowledgeSource || knowledgeSource.userId !== userId) {
    throw new CourseManagementError(
      "Materiale non trovato.",
      "KNOWLEDGE_SOURCE_NOT_FOUND",
      404
    );
  }

  const chapter = await findChapterByKnowledgeSourceId(knowledgeSourceId);
  if (!chapter) {
    throw new CourseManagementError(
      "Capitolo non trovato.",
      "CHAPTER_NOT_FOUND",
      404
    );
  }

  const enriched = await enrichChapter(chapter);
  if (!enriched) {
    throw new CourseManagementError(
      "Capitolo non trovato.",
      "CHAPTER_NOT_FOUND",
      404
    );
  }

  return enriched;
}
