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

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  language?: string;
  timezone?: string;
  schoolGrade?: string | null;
  schoolYear?: string | null;
  personalGoals?: string[];
  preferences?: UserPreferences;
  profileImageUrl?: string | null;
  accountStatus?: AccountStatus;
  deletedAt?: Date | null;
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

export async function updateUserPasswordHash(
  id: UserId,
  passwordHash: string
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}

export async function updateUser(
  id: UserId,
  input: UpdateUserInput
): Promise<User> {
  const record = await prisma.user.update({
    where: { id },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.schoolGrade !== undefined ? { schoolGrade: input.schoolGrade } : {}),
      ...(input.schoolYear !== undefined ? { schoolYear: input.schoolYear } : {}),
      ...(input.personalGoals !== undefined
        ? { personalGoals: input.personalGoals as Prisma.InputJsonValue }
        : {}),
      ...(input.preferences !== undefined
        ? {
            preferences: input.preferences as unknown as Prisma.InputJsonValue,
          }
        : {}),
      ...(input.profileImageUrl !== undefined
        ? { profileImageUrl: input.profileImageUrl }
        : {}),
      ...(input.accountStatus !== undefined
        ? { accountStatus: input.accountStatus }
        : {}),
      ...(input.deletedAt !== undefined ? { deletedAt: input.deletedAt } : {}),
    },
  });
  return toUser(record);
}
