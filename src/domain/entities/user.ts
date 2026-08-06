import type { PremiumPlan, AccountStatus } from "../enums";

export interface UserPreferences {
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  dailyGoalMinutes: number | null;
  onboardingCompletedAt: string | null;
}

export interface User {
  id: import("../ids").UserId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  registeredAt: Date;
  lastAccessAt: Date | null;
  language: string;
  timezone: string;
  schoolGrade: string | null;
  schoolYear: string | null;
  personalGoals: string[];
  preferences: UserPreferences;
  profileImageUrl: string | null;
  premiumPlan: PremiumPlan;
  accountStatus: AccountStatus;
  deletedAt: Date | null;
}
