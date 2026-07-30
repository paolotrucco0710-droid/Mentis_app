import type { KnowledgeSourceId, UserId } from "@/domain/ids";
import type { KnowledgeSource } from "@/domain/entities";
import type {
  KnowledgeSourceProcessingStatus,
  KnowledgeSourceType,
} from "@/domain/enums";
import { prisma } from "../client";
import { toKnowledgeSource } from "../mappers";

export interface CreateKnowledgeSourceInput {
  userId: UserId;
  subjectId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  pageCount?: number;
  language?: string;
  fileSizeBytes: number;
  fileHash: string;
}

export async function findKnowledgeSourceById(
  id: KnowledgeSourceId
): Promise<KnowledgeSource | null> {
  const record = await prisma.knowledgeSource.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toKnowledgeSource(record) : null;
}

export async function findKnowledgeSourcesByUserId(
  userId: UserId
): Promise<KnowledgeSource[]> {
  const records = await prisma.knowledgeSource.findMany({
    where: { userId, deletedAt: null },
    orderBy: { uploadedAt: "desc" },
  });
  return records.map(toKnowledgeSource);
}

export async function createKnowledgeSource(
  input: CreateKnowledgeSourceInput
): Promise<KnowledgeSource> {
  const record = await prisma.knowledgeSource.create({
    data: {
      ...input,
      fileSizeBytes: BigInt(input.fileSizeBytes),
    },
  });
  return toKnowledgeSource(record);
}

export async function updateKnowledgeSourceStatus(
  id: KnowledgeSourceId,
  status: KnowledgeSourceProcessingStatus,
  processedAt?: Date | null
): Promise<KnowledgeSource> {
  const record = await prisma.knowledgeSource.update({
    where: { id },
    data: {
      processingStatus: status,
      processedAt: processedAt ?? undefined,
    },
  });
  return toKnowledgeSource(record);
}
