import type { ImageId, KnowledgeSourceId, UserId } from "../ids";

export interface Image {
  id: ImageId;
  knowledgeSourceId: KnowledgeSourceId;
  ownerId: UserId;
  storageKey: string;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pageNumber: number | null;
  caption: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}
