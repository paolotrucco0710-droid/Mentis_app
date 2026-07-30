import type { CourseId, SubjectId, UserId } from "@/domain/ids";
import type { Image, KnowledgeSource, Upload } from "@/domain/entities";

export interface StoredFile {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;
  width?: number | null;
  height?: number | null;
}

export interface StorageProvider {
  save(storageKey: string, data: Buffer, mimeType: string): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export interface ChapterUploadInput {
  userId: UserId;
  subjectId: SubjectId;
  courseId?: CourseId | null;
  title: string;
  language?: string;
  files: UploadFileInput[];
}

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ChapterUploadResult {
  upload: Upload;
  knowledgeSource: KnowledgeSource;
  images: Image[];
  combinedHash: string;
  totalSizeBytes: number;
}
