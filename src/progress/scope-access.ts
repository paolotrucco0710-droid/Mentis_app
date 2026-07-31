import type { ChapterId, CourseId, SubjectId, UserId } from "@/domain/ids";
import { findChapterById } from "@/db/repositories/chapters";
import {
  assertCourseOwned,
  assertSubjectOwned,
} from "@/course/helpers";
import { ProgressScopeType } from "@/domain/entities/progress";
import { ProgressEngineError } from "./errors";

export async function assertProgressScopeOwned(
  userId: UserId,
  scopeType: ProgressScopeType,
  scopeId: string
): Promise<void> {
  switch (scopeType) {
    case ProgressScopeType.Subject:
      await assertSubjectOwned(userId, scopeId as SubjectId);
      return;
    case ProgressScopeType.Course:
      await assertCourseOwned(userId, scopeId as CourseId);
      return;
    case ProgressScopeType.Chapter: {
      const chapter = await findChapterById(scopeId as ChapterId);
      if (!chapter) {
        throw new ProgressEngineError(
          "Capitolo non trovato.",
          "CHAPTER_NOT_FOUND",
          404
        );
      }
      await assertSubjectOwned(userId, chapter.subjectId);
      return;
    }
    default:
      throw new ProgressEngineError(
        "scopeType non valido.",
        "INVALID_SCOPE",
        400
      );
  }
}
