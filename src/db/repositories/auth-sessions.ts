import type { UserId } from "@/domain/ids";
import { prisma } from "../client";

export interface CreateAuthSessionInput {
  userId: UserId;
  refreshTokenHash: string;
  expiresAt: Date;
  deviceId?: string | null;
  deviceLabel?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  pushToken?: string | null;
}

export interface AuthSessionRecord {
  id: string;
  userId: UserId;
  refreshTokenHash: string;
  deviceId: string | null;
  deviceLabel: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  pushToken: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

function mapSession(record: {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceId: string | null;
  deviceLabel: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  pushToken: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}): AuthSessionRecord {
  return {
    ...record,
    userId: record.userId as UserId,
  };
}

export async function createAuthSession(
  input: CreateAuthSessionInput
): Promise<AuthSessionRecord> {
  const record = await prisma.authSession.create({
    data: input,
  });
  return mapSession(record);
}

export async function findAuthSessionById(
  id: string
): Promise<AuthSessionRecord | null> {
  const record = await prisma.authSession.findUnique({ where: { id } });
  return record ? mapSession(record) : null;
}

export async function findAuthSessionByRefreshTokenHash(
  refreshTokenHash: string
): Promise<AuthSessionRecord | null> {
  const record = await prisma.authSession.findUnique({
    where: { refreshTokenHash },
  });
  return record ? mapSession(record) : null;
}

export async function findActiveAuthSessionsByUserId(
  userId: UserId
): Promise<AuthSessionRecord[]> {
  const now = new Date();
  const records = await prisma.authSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { lastUsedAt: "desc" },
  });
  return records.map(mapSession);
}

export async function touchAuthSession(id: string): Promise<void> {
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.authSession.updateMany({
    where: {
      id,
      lastUsedAt: { lt: staleBefore },
    },
    data: { lastUsedAt: new Date() },
  });
}

export async function revokeAuthSession(id: string): Promise<void> {
  await prisma.authSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllAuthSessionsForUser(userId: UserId): Promise<void> {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function rotateAuthSessionRefreshToken(input: {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
}): Promise<AuthSessionRecord> {
  const record = await prisma.authSession.update({
    where: { id: input.id },
    data: {
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      lastUsedAt: new Date(),
      revokedAt: null,
    },
  });
  return mapSession(record);
}
