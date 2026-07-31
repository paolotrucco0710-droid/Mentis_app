import type { AnalyticsEventCategory, AnalyticsEventSource } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { getDb, type DbTx } from "../transaction";
import type { UserId } from "@/domain/ids";

export interface CreateAnalyticsEventInput {
  userId?: UserId | null;
  name: string;
  category: AnalyticsEventCategory;
  source: AnalyticsEventSource;
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}

export async function createAnalyticsEvent(
  input: CreateAnalyticsEventInput,
  tx?: DbTx
): Promise<void> {
  await getDb(tx).analyticsEvent.create({
    data: {
      userId: input.userId ?? null,
      name: input.name,
      category: input.category,
      source: input.source,
      properties: (input.properties ?? {}) as Prisma.InputJsonValue,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function countAnalyticsEventsByName(
  userId: UserId,
  name: string,
  tx?: DbTx
): Promise<number> {
  return getDb(tx).analyticsEvent.count({
    where: { userId, name },
  });
}

export async function findAnalyticsEventsByUserId(
  userId: UserId,
  options?: {
    category?: AnalyticsEventCategory;
    limit?: number;
    from?: Date;
  }
) {
  return prisma.analyticsEvent.findMany({
    where: {
      userId,
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.from ? { occurredAt: { gte: options.from } } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: options?.limit,
  });
}

export async function countAnalyticsEventsByCategory(
  userId: UserId,
  category: AnalyticsEventCategory,
  from?: Date
): Promise<number> {
  return prisma.analyticsEvent.count({
    where: {
      userId,
      category,
      ...(from ? { occurredAt: { gte: from } } : {}),
    },
  });
}

export async function groupAnalyticsEventsByName(
  userId: UserId,
  from?: Date
): Promise<Array<{ name: string; count: number }>> {
  const groups = await prisma.analyticsEvent.groupBy({
    by: ["name"],
    where: {
      userId,
      ...(from ? { occurredAt: { gte: from } } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { name: "desc" } },
  });

  return groups.map((group) => ({
    name: group.name,
    count: group._count._all,
  }));
}
