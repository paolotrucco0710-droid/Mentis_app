import type { Chapter, Course, KnowledgeSource, Subject } from "@/domain/entities";
import type { Atom } from "@/domain/entities";
import type {
  ChapterId,
  CourseId,
  KnowledgeSourceId,
  SubjectId,
  UserId,
} from "@/domain/ids";

export interface SubjectSummary extends Subject {
  courseCount: number;
  chapterCount: number;
  atomCount: number;
}

export interface ChapterWithSource extends Chapter {
  knowledgeSource: KnowledgeSource;
  atomCount: number;
}

export interface SubjectDetail {
  subject: Subject;
  courses: Course[];
  chapters: ChapterWithSource[];
}

export interface LibraryOverview {
  subjects: SubjectSummary[];
  recentChapters: ChapterWithSource[];
}

export interface SearchResults {
  query: string;
  subjects: Subject[];
  courses: Course[];
  chapters: Chapter[];
  atoms: Atom[];
}

export interface CreateSubjectInput {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateSubjectInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateCourseInput {
  subjectId: SubjectId;
  title: string;
  description?: string | null;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string | null;
}

export type {
  ChapterId,
  CourseId,
  KnowledgeSourceId,
  SubjectId,
  UserId,
};
