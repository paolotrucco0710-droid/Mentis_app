import type { CardId, UserId } from "@/domain/ids";
import type { UserCardState } from "@/domain/entities";
import { getDb, type DbTx } from "../transaction";
import { toUserCardState } from "../mappers";

export async function findUserCardState(
  userId: UserId,
  cardId: CardId,
  tx?: DbTx
): Promise<UserCardState | null> {
  const record = await getDb(tx).userCardState.findUnique({
    where: { userId_cardId: { userId, cardId } },
  });
  return record ? toUserCardState(record) : null;
}

export interface UpsertUserCardStateInput {
  userId: UserId;
  cardId: CardId;
  viewCount?: number;
  correctAnswerCount?: number;
  wrongAnswerCount?: number;
  averageResponseTimeMs?: number | null;
  lastAnsweredAt?: Date | null;
  confidence?: number;
  perceivedDifficulty?: number;
  skipped?: boolean;
  liked?: boolean | null;
}

export async function upsertUserCardState(
  input: UpsertUserCardStateInput,
  tx?: DbTx
): Promise<UserCardState> {
  const { userId, cardId, ...rest } = input;
  const record = await getDb(tx).userCardState.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId, ...rest },
    update: rest,
  });
  return toUserCardState(record);
}

export async function findUserCardStatesByUserAndCardIds(
  userId: UserId,
  cardIds: CardId[]
): Promise<UserCardState[]> {
  if (cardIds.length === 0) {
    return [];
  }

  const records = await getDb().userCardState.findMany({
    where: { userId, cardId: { in: cardIds } },
  });
  return records.map(toUserCardState);
}
