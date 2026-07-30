import type { UserId } from "@/domain/ids";
import type { User, UserPreferences } from "@/domain/entities";
import type { AccountStatus, PremiumPlan } from "@/domain/enums";
import type { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { toUser } from "../mappers";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  language?: string;
  timezone?: string;
  preferences?: UserPreferences;
  premiumPlan?: PremiumPlan;
  accountStatus?: AccountStatus;
}

export async function findUserById(id: UserId): Promise<User | null> {
  const record = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toUser(record) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const record = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  return record ? toUser(record) : null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const record = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: input.passwordHash,
      language: input.language ?? "it",
      timezone: input.timezone ?? "Europe/Rome",
      preferences: (input.preferences ?? {}) as Prisma.InputJsonValue,
      premiumPlan: input.premiumPlan,
      accountStatus: input.accountStatus,
    },
  });
  return toUser(record);
}

export async function updateUserLastAccess(id: UserId): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { lastAccessAt: new Date() },
  });
}
