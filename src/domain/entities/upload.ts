import type {
  CourseId,
  ImageId,
  KnowledgeSourceId,
  SubjectId,
  UploadId,
  UserId,
} from "../ids";
import type { UploadStatus } from "../enums";

export interface Upload {
  id: UploadId;
  userId: UserId;
  subjectId: SubjectId | null;
  courseId: CourseId | null;
  knowledgeSourceId: KnowledgeSourceId | null;
  status: UploadStatus;
  imageIds: ImageId[];
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}
