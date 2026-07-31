import type { UserId } from "@/domain/ids";
import { prisma } from "../client";

export interface PasswordResetTokenRecord {
  id: string;
  userId: UserId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

function mapToken(record: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}): PasswordResetTokenRecord {
  return {
    ...record,
    userId: record.userId as UserId,
  };
}

export async function createPasswordResetToken(input: {
  userId: UserId;
  tokenHash: string;
  expiresAt: Date;
}): Promise<PasswordResetTokenRecord> {
  const record = await prisma.passwordResetToken.create({ data: input });
  return mapToken(record);
}

export async function findPasswordResetTokenByHash(
  tokenHash: string
): Promise<PasswordResetTokenRecord | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  return record ? mapToken(record) : null;
}

export async function markPasswordResetTokenUsed(id: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function invalidatePasswordResetTokensForUser(
  userId: UserId
): Promise<void> {
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}
