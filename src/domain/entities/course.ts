import type { CourseId, SubjectId, UserId } from "../ids";

export interface Course {
  id: CourseId;
  userId: UserId;
  subjectId: SubjectId;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
