import type { KnowledgeSourceId, SubjectId, UserId } from "../ids";
import type {
  KnowledgeSourceProcessingStatus,
  KnowledgeSourceType,
} from "../enums";

export interface KnowledgeSource {
  id: KnowledgeSourceId;
  userId: UserId;
  subjectId: SubjectId;
  title: string;
  sourceType: KnowledgeSourceType;
  pageCount: number;
  language: string;
  uploadedAt: Date;
  processedAt: Date | null;
  parserVersion: string | null;
  promptVersion: string | null;
  processingStatus: KnowledgeSourceProcessingStatus;
  fileSizeBytes: number;
  fileHash: string;
  deletedAt: Date | null;
}
