export { ApiError, apiFetch } from "./client";
export {
  fetchWithQueryCache,
  getCachedQuery,
  invalidateQuery,
  invalidateQueryPrefix,
  queryCacheKeys,
} from "./query-cache";
export {
  createStudySession,
  fetchNextFeedItem,
  pauseSession,
  endSession,
} from "./feed";
export { fetchSessionDetail } from "./sessions";
export {
  login,
  register,
  logout,
  fetchCurrentUser,
  requestPasswordReset,
  resetPassword,
  fetchAuthSessions,
  revokeAuthSession,
} from "./auth";
export { submitCardResponse } from "./progress";
export type { SubmitCardResponseInput } from "./progress";
export {
  fetchSubjects,
  fetchSubjectDetail,
  createSubject,
  updateSubject,
  deleteSubject,
} from "./subjects";
export { fetchLibraryOverview } from "./library";
export { searchLibrary } from "./search";
export {
  deleteChapter,
  deleteKnowledgeSource,
  fetchChapters,
  uploadChapter,
  startKnowledgeSourceProcessing,
  fetchProcessingJob,
  fetchChapterByKnowledgeSource,
} from "./course";
export {
  fetchProfile,
  updateProfile,
  fetchProfileStatistics,
  fetchDailyStatisticsHistory,
  changePassword,
  deleteAccount,
} from "./profile";
export type {
  UserProfileView,
  UserStatisticsView,
  DailyStatisticsView,
  UpdateProfileInput,
} from "@/profile";
export {
  fetchImageUrl,
  fetchAvatarUrl,
  uploadAvatar,
} from "./storage";
export { fetchAICostSummary, fetchAIJobCosts } from "./ai-costs";
export {
  trackAnalyticsEvent,
  fetchAnalyticsOverview,
  fetchOnboardingFunnel,
  fetchLearningMetrics,
  fetchStudyTimeInsights,
  fetchAIUsageInsights,
  fetchAnalyticsErrors,
  fetchFeatureUsage,
} from "./analytics";
