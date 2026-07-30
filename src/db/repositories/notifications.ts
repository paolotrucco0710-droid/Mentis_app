import type { UserId } from "@/domain/ids";
import type { DailyStatistics, Notification } from "@/domain/entities";
import type { NotificationStatus } from "@/domain/enums";
import { prisma } from "../client";
import { toDailyStatistics, toNotification } from "../mappers";

export async function findDailyStatistics(
  userId: UserId,
  date: Date
): Promise<DailyStatistics | null> {
  const record = await prisma.dailyStatistics.findUnique({
    where: { userId_date: { userId, date } },
  });
  return record ? toDailyStatistics(record) : null;
}

export async function findNotificationsByUserId(
  userId: UserId,
  status?: NotificationStatus
): Promise<Notification[]> {
  const records = await prisma.notification.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { sentAt: "desc" },
  });
  return records.map(toNotification);
}
