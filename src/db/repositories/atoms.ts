import type { AtomId, KnowledgeSourceId, SubjectId, UserId } from "@/domain/ids";
import type { Atom } from "@/domain/entities";
import { prisma } from "../client";
import { toAtom } from "../mappers";

const atomInclude = {
  prerequisites: { select: { prerequisiteAtomId: true } },
} as const;

export async function findAtomById(id: AtomId): Promise<Atom | null> {
  const record = await prisma.atom.findUnique({
    where: { id },
    include: atomInclude,
  });
  return record ? toAtom(record) : null;
}

export async function findAtomsByIds(ids: AtomId[]): Promise<Atom[]> {
  if (ids.length === 0) {
    return [];
  }

  const records = await prisma.atom.findMany({
    where: { id: { in: ids } },
    include: atomInclude,
  });
  return records.map(toAtom);
}

export async function findAtomsByKnowledgeSourceId(
  knowledgeSourceId: KnowledgeSourceId
): Promise<Atom[]> {
  const records = await prisma.atom.findMany({
    where: { knowledgeSourceId },
    include: atomInclude,
    orderBy: { logicalOrder: "asc" },
  });
  return records.map(toAtom);
}

export async function countAtomsByKnowledgeSourceId(
  knowledgeSourceId: KnowledgeSourceId
): Promise<number> {
  return prisma.atom.count({ where: { knowledgeSourceId } });
}

export async function findAtomsBySubjectId(
  subjectId: SubjectId
): Promise<Atom[]> {
  const records = await prisma.atom.findMany({
    where: { subjectId },
    include: atomInclude,
    orderBy: { logicalOrder: "asc" },
  });
  return records.map(toAtom);
}

export async function findAtomsDependingOnPrerequisite(
  prerequisiteAtomId: AtomId
): Promise<Atom[]> {
  const records = await prisma.atom.findMany({
    where: {
      prerequisites: {
        some: { prerequisiteAtomId },
      },
    },
    include: atomInclude,
  });
  return records.map(toAtom);
}

export async function countAtomsBySubjectId(
  subjectId: SubjectId
): Promise<number> {
  return prisma.atom.count({ where: { subjectId } });
}

export async function searchAtomsByQuery(
  userId: UserId,
  query: string,
  limit = 15
): Promise<Atom[]> {
  const records = await prisma.atom.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
      ],
      subject: { userId, deletedAt: null },
    },
    include: atomInclude,
    orderBy: { logicalOrder: "asc" },
    take: limit,
  });
  return records.map(toAtom);
}
