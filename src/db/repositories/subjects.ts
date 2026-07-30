import type { SubjectId, UserId } from "@/domain/ids";
import type { Subject } from "@/domain/entities";
import { prisma } from "../client";
import { toSubject } from "../mappers";

export interface CreateSubjectInput {
  userId: UserId;
  name: string;
  color: string;
  icon: string;
  displayOrder?: number;
}

export async function findSubjectById(id: SubjectId): Promise<Subject | null> {
  const record = await prisma.subject.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toSubject(record) : null;
}

export async function findSubjectsByUserId(userId: UserId): Promise<Subject[]> {
  const records = await prisma.subject.findMany({
    where: { userId, deletedAt: null },
    orderBy: { displayOrder: "asc" },
  });
  return records.map(toSubject);
}

export async function createSubject(
  input: CreateSubjectInput
): Promise<Subject> {
  const record = await prisma.subject.create({ data: input });
  return toSubject(record);
}
