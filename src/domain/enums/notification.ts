export enum NotificationType {
  ReviewReminder = "review_reminder",
  StreakReminder = "streak_reminder",
  Achievement = "achievement",
  ProcessingComplete = "processing_complete",
  ProcessingFailed = "processing_failed",
  System = "system",
}

export enum NotificationStatus {
  Pending = "pending",
  Sent = "sent",
  Opened = "opened",
  Dismissed = "dismissed",
}

export enum NotificationPriority {
  Low = "low",
  Normal = "normal",
  High = "high",
}

export enum AchievementCategory {
  Study = "study",
  Mastery = "mastery",
  Streak = "streak",
  Review = "review",
  Exploration = "exploration",
}
