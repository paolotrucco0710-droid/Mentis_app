import type { AtomId, CardId } from "@/domain/ids";
import type { Card } from "@/domain/entities";
import { prisma } from "../client";
import { toCard } from "../mappers";

export async function findCardById(id: CardId): Promise<Card | null> {
  const record = await prisma.card.findUnique({ where: { id } });
  return record ? toCard(record) : null;
}

export async function findCardsByAtomId(atomId: AtomId): Promise<Card[]> {
  const records = await prisma.card.findMany({
    where: { atomId },
    orderBy: { order: "asc" },
  });
  return records.map(toCard);
}

export async function findCardsByAtomIds(atomIds: AtomId[]): Promise<Card[]> {
  if (atomIds.length === 0) {
    return [];
  }

  const records = await prisma.card.findMany({
    where: { atomId: { in: atomIds } },
    orderBy: [{ atomId: "asc" }, { order: "asc" }],
  });
  return records.map(toCard);
}
