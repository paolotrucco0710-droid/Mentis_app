import type { AnalyticsEventCategory, AnalyticsEventSource } from "@prisma/client";

export const AnalyticsEvents = {
  AuthRegistered: "auth.registered",
  AuthLoggedIn: "auth.logged_in",
  AuthLoggedOut: "auth.logged_out",
  AuthLoginFailed: "auth.login_failed",
  AuthPasswordResetRequested: "auth.password_reset_requested",
  AuthPasswordResetCompleted: "auth.password_reset_completed",
  UploadStarted: "upload.started",
  UploadCompleted: "upload.completed",
  UploadFailed: "upload.failed",
  AIJobQueued: "ai.job_queued",
  AIJobCompleted: "ai.job_completed",
  AIJobFailed: "ai.job_failed",
  StudySessionOpened: "study.session_opened",
  StudySessionPaused: "study.session_paused",
  StudySessionResumed: "study.session_resumed",
  StudySessionEnded: "study.session_ended",
  StudyCardOpened: "study.card_opened",
  StudyCardAnswered: "study.card_answered",
  FeatureSearch: "feature.search",
  FeatureLibraryViewed: "feature.library_viewed",
  FeaturePageViewed: "feature.page_viewed",
  FunnelFirstUpload: "funnel.first_upload",
  FunnelFirstStudySession: "funnel.first_study_session",
  FunnelFirstCardAnswered: "funnel.first_card_answered",
  FunnelFirstAICompleted: "funnel.first_ai_completed",
  ErrorApi: "error.api",
  ErrorPipeline: "error.pipeline",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export interface TrackAnalyticsEventInput {
  userId?: string | null;
  name: AnalyticsEventName | string;
  category: AnalyticsEventCategory;
  source: AnalyticsEventSource;
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface AnalyticsOverviewView {
  totalEvents: number;
  studyTimeMs: number;
  cardsCompleted: number;
  accuracyPercent: number;
  aiJobsCompleted: number;
  aiEstimatedCostUsd: number;
  errorCount: number;
  activeStreak: number;
}

export interface FunnelStepView {
  key: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  conversionFromPrevious: number | null;
}

export interface OnboardingFunnelView {
  steps: FunnelStepView[];
  completionRate: number;
}

export interface LearningMetricsView {
  masteredAtoms: number;
  inProgressAtoms: number;
  averageMastery: number;
  averageResponseTimeMs: number;
  reviewsCompleted: number;
  studySessionsCompleted: number;
}

export interface StudyTimeInsightView {
  totalStudyTimeMs: number;
  averageDailyStudyTimeMs: number;
  activeDays: number;
  longestStreak: number;
  recentDailyMinutes: Array<{ date: string; minutes: number }>;
}

export interface AIUsageInsightView {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
  cacheHitRate: number;
}

export interface AnalyticsErrorView {
  id: string;
  name: string;
  message: string;
  code: string | null;
  route: string | null;
  occurredAt: string;
}

export interface TrackClientEventInput {
  name: string;
  properties?: Record<string, unknown>;
}
