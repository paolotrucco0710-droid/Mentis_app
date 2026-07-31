import type { ImageId, KnowledgeSourceId, UploadId, UserId } from "@/domain/ids";
import type { Image, Upload } from "@/domain/entities";
import type { UploadStatus } from "@/domain/enums";
import { prisma } from "../client";
import { toImage, toUpload } from "../mappers";

export interface CreateUploadInput {
  userId: UserId;
  subjectId?: string | null;
  courseId?: string | null;
  knowledgeSourceId?: string | null;
  status?: UploadStatus;
  imageIds?: string[];
}

export async function findUploadById(id: UploadId): Promise<Upload | null> {
  const record = await prisma.upload.findUnique({ where: { id } });
  return record ? toUpload(record) : null;
}

export async function createUpload(input: CreateUploadInput): Promise<Upload> {
  const record = await prisma.upload.create({
    data: {
      ...input,
      imageIds: input.imageIds ?? [],
    },
  });
  return toUpload(record);
}

export async function updateUploadStatus(
  id: UploadId,
  status: UploadStatus,
  errorMessage?: string | null
): Promise<Upload> {
  const record = await prisma.upload.update({
    where: { id },
    data: {
      status,
      errorMessage,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    },
  });
  return toUpload(record);
}

export interface CreateImageInput {
  knowledgeSourceId: string;
  ownerId: UserId;
  storageKey: string;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  pageNumber?: number | null;
  caption?: string | null;
}

export async function findImageById(id: ImageId): Promise<Image | null> {
  const record = await prisma.image.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toImage(record) : null;
}

export async function findImagesByKnowledgeSourceId(
  knowledgeSourceId: KnowledgeSourceId
): Promise<Image[]> {
  const records = await prisma.image.findMany({
    where: { knowledgeSourceId, deletedAt: null },
    orderBy: { pageNumber: "asc" },
  });
  return records.map(toImage);
}

export async function createImage(input: CreateImageInput): Promise<Image> {
  const record = await prisma.image.create({
    data: {
      ...input,
      sizeBytes: BigInt(input.sizeBytes),
    },
  });
  return toImage(record);
}
