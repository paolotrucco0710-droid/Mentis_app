import { getUserAICostSummary } from "@/ai/optimization/metrics";
import {
  createAnalyticsEvent,
  findAnalyticsEventsByUserId,
  groupAnalyticsEventsByName,
} from "@/db/repositories/analytics-events";
import {
  findDailyStatisticsByUserId,
  sumDailyStatisticsByUserId,
} from "@/db/repositories/daily-statistics";
import { findStudySessionsByUserId } from "@/db/repositories/study-sessions";
import { findUserById } from "@/db/repositories/users";
import { findUserAtomStatesByUserId } from "@/db/repositories/user-atom-states";
import { UserAtomLearningState } from "@/domain/enums";
import type { UserId } from "@/domain/ids";
import { MASTERY_STABLE_THRESHOLD } from "@/engine/constants";
import { prisma } from "@/db/client";
import { AnalyticsError } from "./errors";
import { AnalyticsEvents } from "./types";
import type {
  AIUsageInsightView,
  AnalyticsErrorView,
  AnalyticsOverviewView,
  LearningMetricsView,
  OnboardingFunnelView,
  StudyTimeInsightView,
  TrackClientEventInput,
} from "./types";

const FUNNEL_STEPS = [
  { key: "registered", label: "Registrazione", eventName: AnalyticsEvents.AuthRegistered },
  { key: "first_upload", label: "Primo upload", eventName: AnalyticsEvents.FunnelFirstUpload },
  {
    key: "first_study_session",
    label: "Prima sessione di studio",
    eventName: AnalyticsEvents.FunnelFirstStudySession,
  },
  {
    key: "first_card_answered",
    label: "Prima risposta",
    eventName: AnalyticsEvents.FunnelFirstCardAnswered,
  },
  {
    key: "first_ai_completed",
    label: "Prima elaborazione AI",
    eventName: AnalyticsEvents.FunnelFirstAICompleted,
  },
] as const;

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function ingestClientEvent(
  userId: UserId,
  input: TrackClientEventInput
): Promise<void> {
  const name = input.name.trim();
  if (!name) {
    throw new AnalyticsError("Nome evento obbligatorio.", "INVALID_EVENT_NAME", 400);
  }

  await createAnalyticsEvent({
    userId,
    name,
    category: "feature",
    source: "client",
    properties: input.properties,
  });
}

export async function getAnalyticsOverview(
  userId: UserId
): Promise<AnalyticsOverviewView> {
  const [totals, aiSummary, errorCount, latestDaily, eventCount] =
    await Promise.all([
      sumDailyStatisticsByUserId(userId),
      getUserAICostSummary(userId),
      prisma.analyticsEvent.count({
        where: { userId, category: "error" },
      }),
      prisma.dailyStatistics.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.analyticsEvent.count({ where: { userId } }),
    ]);

  const accuracyValues = await prisma.dailyStatistics.findMany({
    where: { userId, cardsCompleted: { gt: 0 } },
    select: { accuracy: true },
  });

  return {
    totalEvents: eventCount,
    studyTimeMs: totals.totalStudyTimeMs,
    cardsCompleted: totals.totalCardsCompleted,
    accuracyPercent: Math.round(average(accuracyValues.map((row) => row.accuracy))),
    aiJobsCompleted: aiSummary.completedJobs,
    aiEstimatedCostUsd: aiSummary.totalEstimatedCostUsd,
    errorCount,
    activeStreak: latestDaily?.dailyStreak ?? 0,
  };
}

export async function getOnboardingFunnel(
  userId: UserId
): Promise<OnboardingFunnelView> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AnalyticsError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  const [
    uploadCount,
    studySessionCount,
    answeredCards,
    completedAiJobs,
    milestoneEvents,
  ] = await Promise.all([
    prisma.upload.count({ where: { userId, status: "completed" } }),
    prisma.studySession.count({ where: { userId } }),
    prisma.dailyStatistics.aggregate({
      where: { userId },
      _sum: { cardsCompleted: true },
    }),
    prisma.aIJob.count({ where: { userId, status: "completed" } }),
    findAnalyticsEventsByUserId(userId, { limit: 200 }),
  ]);

  const milestoneMap = new Map(
    milestoneEvents.map((event) => [event.name, event.occurredAt])
  );

  const completionByKey: Record<string, { completed: boolean; completedAt: Date | null }> =
    {
      registered: { completed: true, completedAt: user.registeredAt },
      first_upload: {
        completed: uploadCount > 0,
        completedAt: milestoneMap.get(AnalyticsEvents.FunnelFirstUpload) ?? null,
      },
      first_study_session: {
        completed: studySessionCount > 0,
        completedAt:
          milestoneMap.get(AnalyticsEvents.FunnelFirstStudySession) ?? null,
      },
      first_card_answered: {
        completed: (answeredCards._sum.cardsCompleted ?? 0) > 0,
        completedAt:
          milestoneMap.get(AnalyticsEvents.FunnelFirstCardAnswered) ?? null,
      },
      first_ai_completed: {
        completed: completedAiJobs > 0,
        completedAt:
          milestoneMap.get(AnalyticsEvents.FunnelFirstAICompleted) ?? null,
      },
    };

  const steps = FUNNEL_STEPS.map((step, index) => {
    const state = completionByKey[step.key];
    const previous = index > 0 ? completionByKey[FUNNEL_STEPS[index - 1].key] : null;
    const conversionFromPrevious =
      previous && previous.completed && state.completed ? 100 : previous?.completed ? 0 : null;

    return {
      key: step.key,
      label: step.label,
      completed: state.completed,
      completedAt: state.completedAt?.toISOString() ?? null,
      conversionFromPrevious,
    };
  });

  const completedSteps = steps.filter((step) => step.completed).length;

  return {
    steps,
    completionRate: Math.round((completedSteps / steps.length) * 100),
  };
}

export async function getLearningMetrics(
  userId: UserId
): Promise<LearningMetricsView> {
  const [atomStates, totals, sessions] = await Promise.all([
    findUserAtomStatesByUserId(userId),
    sumDailyStatisticsByUserId(userId),
    findStudySessionsByUserId(userId, 500),
  ]);

  const masteredAtoms = atomStates.filter(
    (state) => state.mastery >= MASTERY_STABLE_THRESHOLD
  ).length;
  const inProgressAtoms = atomStates.filter(
    (state) =>
      state.currentStage !== UserAtomLearningState.Locked &&
      state.mastery < MASTERY_STABLE_THRESHOLD
  ).length;
  const responseTimes = atomStates
    .map((state) => state.averageResponseTimeMs)
    .filter((value): value is number => value !== null && value > 0);

  return {
    masteredAtoms,
    inProgressAtoms,
    averageMastery: Math.round(average(atomStates.map((state) => state.mastery))),
    averageResponseTimeMs: Math.round(average(responseTimes)),
    reviewsCompleted: totals.totalReviewsCompleted,
    studySessionsCompleted: sessions.filter((session) => session.endedAt).length,
  };
}

export async function getStudyTimeInsights(
  userId: UserId
): Promise<StudyTimeInsightView> {
  const [totals, history] = await Promise.all([
    sumDailyStatisticsByUserId(userId),
    findDailyStatisticsByUserId(userId, { limit: 14 }),
  ]);

  const activeDays = history.filter((day) => day.studyTimeMs > 0).length;
  const longestStreak = history.reduce(
    (max, day) => Math.max(max, day.dailyStreak),
    0
  );

  return {
    totalStudyTimeMs: totals.totalStudyTimeMs,
    averageDailyStudyTimeMs:
      activeDays > 0 ? Math.round(totals.totalStudyTimeMs / activeDays) : 0,
    activeDays,
    longestStreak,
    recentDailyMinutes: history
      .slice()
      .reverse()
      .map((day) => ({
        date: day.date.slice(0, 10),
        minutes: Math.round(day.studyTimeMs / 60_000),
      })),
  };
}

export async function getAIUsageInsights(
  userId: UserId
): Promise<AIUsageInsightView> {
  const summary = await getUserAICostSummary(userId);
  return {
    totalJobs: summary.totalJobs,
    completedJobs: summary.completedJobs,
    failedJobs: summary.failedJobs,
    totalInputTokens: summary.totalInputTokens,
    totalOutputTokens: summary.totalOutputTokens,
    totalEstimatedCostUsd: summary.totalEstimatedCostUsd,
    cacheHitRate: summary.cacheHitRate,
  };
}

export async function getRecentAnalyticsErrors(
  userId: UserId,
  limit = 20
): Promise<AnalyticsErrorView[]> {
  const events = await findAnalyticsEventsByUserId(userId, {
    category: "error",
    limit,
  });

  return events.map((event) => {
    const properties =
      event.properties && typeof event.properties === "object"
        ? (event.properties as Record<string, unknown>)
        : {};

    return {
      id: event.id,
      name: event.name,
      message:
        typeof properties.message === "string"
          ? properties.message
          : "Errore non specificato",
      code: typeof properties.code === "string" ? properties.code : null,
      route: typeof properties.route === "string" ? properties.route : null,
      occurredAt: event.occurredAt.toISOString(),
    };
  });
}

export async function getFeatureUsageBreakdown(
  userId: UserId,
  days = 30
): Promise<Array<{ name: string; count: number }>> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  return groupAnalyticsEventsByName(userId, from);
}
