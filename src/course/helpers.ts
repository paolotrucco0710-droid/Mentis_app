import { countAtomsBySubjectId } from "@/db/repositories/atoms";
import {
  countChaptersByCourseId,
  createChapter,
  findChaptersByCourseId,
} from "@/db/repositories/chapters";
import {
  createCourse,
  findCourseById,
  findCoursesBySubjectId,
} from "@/db/repositories/courses";
import {
  findSubjectById,
  findSubjectsByUserId,
} from "@/db/repositories/subjects";
import type { CourseId, SubjectId, UserId } from "@/domain/ids";
import type { KnowledgeSourceId } from "@/domain/ids";
import { CourseManagementError } from "./errors";

const DEFAULT_COURSE_TITLE = "Materiale del corso";

export async function findOrCreateDefaultCourse(
  userId: UserId,
  subjectId: SubjectId
) {
  const courses = await findCoursesBySubjectId(subjectId);
  const existing = courses.find(
    (course) => course.title === DEFAULT_COURSE_TITLE
  );

  if (existing) {
    return existing;
  }

  return createCourse({
    userId,
    subjectId,
    title: DEFAULT_COURSE_TITLE,
    description: "Capitoli caricati automaticamente",
  });
}

export async function ensureChapterForUpload(input: {
  userId: UserId;
  subjectId: SubjectId;
  courseId?: CourseId | null;
  knowledgeSourceId: KnowledgeSourceId;
  title: string;
}) {
  let courseId = input.courseId ?? null;

  if (courseId) {
    const course = await findCourseById(courseId);
    if (!course || course.userId !== input.userId || course.subjectId !== input.subjectId) {
      throw new CourseManagementError(
        "Corso non trovato per questa materia.",
        "COURSE_NOT_FOUND",
        404
      );
    }
  } else {
    const course = await findOrCreateDefaultCourse(input.userId, input.subjectId);
    courseId = course.id;
  }

  const chapterCount = await countChaptersByCourseId(courseId);
  const chapter = await createChapter({
    courseId,
    subjectId: input.subjectId,
    knowledgeSourceId: input.knowledgeSourceId,
    title: input.title,
    chapterNumber: chapterCount + 1,
    displayOrder: chapterCount,
  });

  return { courseId, chapter };
}

export async function assertSubjectOwned(
  userId: UserId,
  subjectId: SubjectId
) {
  const subject = await findSubjectById(subjectId);
  if (!subject || subject.userId !== userId) {
    throw new CourseManagementError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }
  return subject;
}

export async function getSubjectChapterCount(subjectId: SubjectId) {
  const courses = await findCoursesBySubjectId(subjectId);
  let total = 0;
  for (const course of courses) {
    total += (await findChaptersByCourseId(course.id)).length;
  }
  return total;
}

export async function listSubjectSummaries(userId: UserId) {
  const subjects = await findSubjectsByUserId(userId);

  return Promise.all(
    subjects.map(async (subject) => {
      const courses = await findCoursesBySubjectId(subject.id);
      const chapterCount = await getSubjectChapterCount(subject.id);
      const atomCount = await countAtomsBySubjectId(subject.id);

      return {
        ...subject,
        courseCount: courses.length,
        chapterCount,
        atomCount,
      };
    })
  );
}
