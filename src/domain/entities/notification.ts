import type { NotificationId, UserId } from "../ids";
import type {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from "../enums";

export interface Notification {
  id: NotificationId;
  userId: UserId;
  type: NotificationType;
  title: string;
  message: string;
  sentAt: Date | null;
  openedAt: Date | null;
  status: NotificationStatus;
  priority: NotificationPriority;
}
