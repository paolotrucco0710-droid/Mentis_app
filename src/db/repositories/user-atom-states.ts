import type { AtomId, UserId } from "@/domain/ids";
import type { UserAtomState } from "@/domain/entities";
import type { UserAtomLearningState } from "@/domain/enums";
import { prisma } from "../client";
import { toUserAtomState } from "../mappers";

export async function findUserAtomState(
  userId: UserId,
  atomId: AtomId
): Promise<UserAtomState | null> {
  const record = await prisma.userAtomState.findUnique({
    where: { userId_atomId: { userId, atomId } },
  });
  return record ? toUserAtomState(record) : null;
}

export async function findUserAtomStatesByUserId(
  userId: UserId
): Promise<UserAtomState[]> {
  const records = await prisma.userAtomState.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return records.map(toUserAtomState);
}

export async function findDueUserAtomStates(
  userId: UserId,
  before: Date = new Date()
): Promise<UserAtomState[]> {
  const records = await prisma.userAtomState.findMany({
    where: {
      userId,
      nextReviewAt: { lte: before },
      currentStage: { in: ["review", "forgotten", "practicing"] },
    },
    orderBy: { nextReviewAt: "asc" },
  });
  return records.map(toUserAtomState);
}

export interface UpsertUserAtomStateInput {
  userId: UserId;
  atomId: AtomId;
  mastery?: number;
  confidence?: number;
  currentStage?: UserAtomLearningState;
  exposureCount?: number;
  errorCount?: number;
  correctAnswerCount?: number;
  wrongAnswerCount?: number;
  lastViewedAt?: Date | null;
  nextReviewAt?: Date | null;
  averageResponseTimeMs?: number | null;
  totalStudyTimeMs?: number;
  streak?: number;
  estimatedDecay?: number;
  comprehensionLevel?: number;
  lastAlgorithmUsed?: string | null;
}

export async function upsertUserAtomState(
  input: UpsertUserAtomStateInput
): Promise<UserAtomState> {
  const { userId, atomId, totalStudyTimeMs, ...rest } = input;
  const record = await prisma.userAtomState.upsert({
    where: { userId_atomId: { userId, atomId } },
    create: {
      userId,
      atomId,
      totalStudyTimeMs: BigInt(totalStudyTimeMs ?? 0),
      ...rest,
    },
    update: {
      ...rest,
      ...(totalStudyTimeMs !== undefined
        ? { totalStudyTimeMs: BigInt(totalStudyTimeMs) }
        : {}),
    },
  });
  return toUserAtomState(record);
}
