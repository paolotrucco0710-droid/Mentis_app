import type { PremiumPlan } from "@/domain/enums";
import type { UserPreferences } from "@/domain/entities";
import type { UserId } from "@/domain/ids";

export interface UserProfileView {
  id: UserId;
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  timezone: string;
  schoolGrade: string | null;
  schoolYear: string | null;
  personalGoals: string[];
  preferences: UserPreferences;
  profileImageUrl: string | null;
  premiumPlan: PremiumPlan;
  registeredAt: Date;
  lastAccessAt: Date | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  schoolGrade?: string | null;
  schoolYear?: string | null;
  personalGoals?: string[];
  preferences?: Partial<UserPreferences>;
  profileImageUrl?: string | null;
}

export interface UserStatisticsToday {
  studyTimeMs: number;
  cardsCompleted: number;
  atomsCompleted: number;
  reviewsCompleted: number;
  accuracy: number;
  averageMastery: number | null;
  dailyGoalMinutes: number | null;
  dailyGoalProgressPercent: number;
}

export interface UserStatisticsStreak {
  current: number;
  studiedToday: boolean;
}

export interface UserStatisticsLifetime {
  totalStudyTimeMs: number;
  totalCardsCompleted: number;
  totalAtomsMastered: number;
  totalSessions: number;
  averageMastery: number;
  memoryHealth: number | null;
  pendingReviews: number;
}

export interface UserRecentSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null;
  cardsViewed: number;
  correctAnswerCount: number;
  subjectId: string | null;
}

export interface UserStatisticsView {
  today: UserStatisticsToday;
  streak: UserStatisticsStreak;
  lifetime: UserStatisticsLifetime;
  recentSessions: UserRecentSession[];
}

export interface DailyStatisticsView {
  date: string;
  studyTimeMs: number;
  cardsCompleted: number;
  accuracy: number;
  dailyStreak: number;
}
