import { searchAtomsByQuery } from "@/db/repositories/atoms";
import { searchChaptersByTitle } from "@/db/repositories/chapters";
import { searchCoursesByTitle } from "@/db/repositories/courses";
import { searchSubjectsByName } from "@/db/repositories/subjects";
import type { UserId } from "@/domain/ids";
import type { SearchResults } from "./types";

export async function searchLibrary(
  userId: UserId,
  query: string
): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      subjects: [],
      courses: [],
      chapters: [],
      atoms: [],
    };
  }

  const [subjects, courses, chapters, atoms] = await Promise.all([
    searchSubjectsByName(userId, trimmed),
    searchCoursesByTitle(userId, trimmed),
    searchChaptersByTitle(userId, trimmed),
    searchAtomsByQuery(userId, trimmed),
  ]);

  return {
    query: trimmed,
    subjects,
    courses,
    chapters,
    atoms,
  };
}
