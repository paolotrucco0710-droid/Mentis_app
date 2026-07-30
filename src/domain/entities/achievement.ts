import type { AchievementId } from "../ids";
import type { AchievementCategory } from "../enums";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  category: AchievementCategory;
  level: number;
  icon: string;
  condition: string;
  reward: string | null;
}

export interface UserAchievement {
  userId: import("../ids").UserId;
  achievementId: AchievementId;
  earnedAt: Date;
  progress: number;
}
