import type { UserId } from "@/domain/ids";
import type { Notification } from "@/domain/entities";
import type { NotificationStatus } from "@/domain/enums";
import { prisma } from "../client";
import { toNotification } from "../mappers";

export { findDailyStatistics } from "./daily-statistics";

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
