import type { ChapterId, CourseId, KnowledgeSourceId, SubjectId } from "../ids";
import type { DifficultyLevel } from "../enums";

export interface Chapter {
  id: ChapterId;
  courseId: CourseId;
  subjectId: SubjectId;
  knowledgeSourceId: KnowledgeSourceId;
  title: string;
  chapterNumber: number | null;
  displayOrder: number;
  estimatedStudyTimeMinutes: number | null;
  difficultyLevel: DifficultyLevel | null;
  atomCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
