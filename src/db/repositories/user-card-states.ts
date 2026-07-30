import type { CardId, UserId } from "@/domain/ids";
import type { UserCardState } from "@/domain/entities";
import { prisma } from "../client";
import { toUserCardState } from "../mappers";

export async function findUserCardState(
  userId: UserId,
  cardId: CardId
): Promise<UserCardState | null> {
  const record = await prisma.userCardState.findUnique({
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
  input: UpsertUserCardStateInput
): Promise<UserCardState> {
  const { userId, cardId, ...rest } = input;
  const record = await prisma.userCardState.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId, ...rest },
    update: rest,
  });
  return toUserCardState(record);
}
