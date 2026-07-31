import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressScopeType } from "@/domain/entities/progress";
import type { ChapterId, CourseId, SubjectId, UserId } from "@/domain/ids";
import { ProgressEngineError } from "@/progress/errors";

const assertSubjectOwned = vi.fn();
const assertCourseOwned = vi.fn();
const findChapterById = vi.fn();

vi.mock("@/course/helpers", () => ({
  assertSubjectOwned: (...args: unknown[]) => assertSubjectOwned(...args),
  assertCourseOwned: (...args: unknown[]) => assertCourseOwned(...args),
}));

vi.mock("@/db/repositories/chapters", () => ({
  findChapterById: (...args: unknown[]) => findChapterById(...args),
}));

describe("assertProgressScopeOwned", () => {
  const userId = "00000000-0000-4000-8000-000000000001" as UserId;
  const subjectId = "00000000-0000-4000-8000-000000000002" as SubjectId;
  const courseId = "00000000-0000-4000-8000-000000000003" as CourseId;
  const chapterId = "00000000-0000-4000-8000-000000000004" as ChapterId;

  beforeEach(() => {
    assertSubjectOwned.mockReset();
    assertCourseOwned.mockReset();
    findChapterById.mockReset();
    assertSubjectOwned.mockResolvedValue({ id: subjectId });
    assertCourseOwned.mockResolvedValue({ id: courseId, subjectId });
    findChapterById.mockResolvedValue({ id: chapterId, subjectId });
  });

  it("checks subject ownership for subject scope", async () => {
    const { assertProgressScopeOwned } = await import("@/progress/scope-access");

    await assertProgressScopeOwned(userId, ProgressScopeType.Subject, subjectId);

    expect(assertSubjectOwned).toHaveBeenCalledWith(userId, subjectId);
  });

  it("checks course ownership for course scope", async () => {
    const { assertProgressScopeOwned } = await import("@/progress/scope-access");

    await assertProgressScopeOwned(userId, ProgressScopeType.Course, courseId);

    expect(assertCourseOwned).toHaveBeenCalledWith(userId, courseId);
  });

  it("checks chapter subject ownership for chapter scope", async () => {
    const { assertProgressScopeOwned } = await import("@/progress/scope-access");

    await assertProgressScopeOwned(userId, ProgressScopeType.Chapter, chapterId);

    expect(findChapterById).toHaveBeenCalledWith(chapterId);
    expect(assertSubjectOwned).toHaveBeenCalledWith(userId, subjectId);
  });

  it("rejects unknown chapters", async () => {
    findChapterById.mockResolvedValue(null);
    const { assertProgressScopeOwned } = await import("@/progress/scope-access");

    await expect(
      assertProgressScopeOwned(userId, ProgressScopeType.Chapter, chapterId)
    ).rejects.toBeInstanceOf(ProgressEngineError);
  });
});
