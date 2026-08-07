import type { ImageId, KnowledgeSourceId, UploadId, UserId } from "@/domain/ids";
import type { Image, Upload } from "@/domain/entities";
import type { UploadStatus } from "@/domain/enums";
import { Prisma } from "@prisma/client";
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
  masterStorageKey?: string | null;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  pageNumber?: number | null;
  caption?: string | null;
  sourcePageImageId?: string | null;
  bboxNormalized?: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null;
  detectionConfidence?: number | null;
  pipelineVersion?: string | null;
  fallbackToFullPage?: boolean;
  regionType?: string | null;
  containsText?: boolean | null;
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
  const { bboxNormalized, ...rest } = input;
  const record = await prisma.image.create({
    data: {
      ...rest,
      sizeBytes: BigInt(input.sizeBytes),
      ...(bboxNormalized === undefined
        ? {}
        : {
            bboxNormalized:
              bboxNormalized === null
                ? Prisma.JsonNull
                : bboxNormalized,
          }),
    },
  });
  return toImage(record);
}
