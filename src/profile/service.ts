import { hashPassword, verifyPassword } from "@/auth/password";
import { revokeAllAuthSessionsForUser } from "@/db/repositories/auth-sessions";
import {
  findDailyStatistics,
  findDailyStatisticsByUserId,
  sumDailyStatisticsByUserId,
  toDateOnly,
} from "@/db/repositories/daily-statistics";
import { findScheduledReviewsByUserId } from "@/db/repositories/reviews";
import { findStudySessionsByUserId } from "@/db/repositories/study-sessions";
import { findUserAtomStatesByUserId } from "@/db/repositories/user-atom-states";
import {
  findUserById,
  updateUser,
  updateUserPasswordHash,
} from "@/db/repositories/users";
import { UserAtomLearningState, AccountStatus } from "@/domain/enums";
import type { UserId } from "@/domain/ids";
import { prisma } from "@/db/client";
import { MASTERY_STABLE_THRESHOLD } from "@/engine/constants";
import { previousDay, startOfDay } from "@/progress/statistics";
import {
  buildAvatarStorageKey,
  deleteStorageKeys,
  getStorageProvider,
  isStorageKey,
} from "@/storage";
import { processImage } from "@/upload/image-processing";
import { ProfileError } from "./errors";
import { toUserProfileView } from "./mappers";
import type {
  DailyStatisticsView,
  UpdateProfileInput,
  UserProfileView,
  UserStatisticsView,
} from "./types";

const SUPPORTED_LANGUAGES = new Set(["it", "en"]);
const MIN_DAILY_GOAL_MINUTES = 5;
const MAX_DAILY_GOAL_MINUTES = 240;

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined) {
    return undefined as never;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertValidPreferences(
  preferences: UpdateProfileInput["preferences"]
): void {
  if (!preferences) {
    return;
  }

  if (
    preferences.language !== undefined &&
    !SUPPORTED_LANGUAGES.has(preferences.language)
  ) {
    throw new ProfileError(
      "Lingua non supportata.",
      "INVALID_LANGUAGE",
      400
    );
  }

  if (
    preferences.dailyGoalMinutes !== undefined &&
    preferences.dailyGoalMinutes !== null &&
    (preferences.dailyGoalMinutes < MIN_DAILY_GOAL_MINUTES ||
      preferences.dailyGoalMinutes > MAX_DAILY_GOAL_MINUTES)
  ) {
    throw new ProfileError(
      `L'obiettivo giornaliero deve essere tra ${MIN_DAILY_GOAL_MINUTES} e ${MAX_DAILY_GOAL_MINUTES} minuti.`,
      "INVALID_DAILY_GOAL",
      400
    );
  }
}

export async function getUserProfile(userId: UserId): Promise<UserProfileView> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }
  return toUserProfileView(user);
}

export async function updateUserProfile(
  userId: UserId,
  input: UpdateProfileInput
): Promise<UserProfileView> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  if (input.firstName !== undefined && !input.firstName.trim()) {
    throw new ProfileError("Il nome è obbligatorio.", "INVALID_FIRST_NAME", 400);
  }

  assertValidPreferences(input.preferences);

  const mergedPreferences = input.preferences
    ? { ...user.preferences, ...input.preferences }
    : user.preferences;

  const updated = await updateUser(userId, {
    ...(input.firstName !== undefined
      ? { firstName: input.firstName.trim() }
      : {}),
    ...(input.lastName !== undefined
      ? { lastName: input.lastName.trim() }
      : {}),
    ...(input.schoolGrade !== undefined
      ? { schoolGrade: normalizeOptionalString(input.schoolGrade) }
      : {}),
    ...(input.schoolYear !== undefined
      ? { schoolYear: normalizeOptionalString(input.schoolYear) }
      : {}),
    ...(input.personalGoals !== undefined
      ? {
          personalGoals: input.personalGoals
            .map((goal) => goal.trim())
            .filter(Boolean),
        }
      : {}),
    ...(input.preferences !== undefined
      ? {
          preferences: mergedPreferences,
          language: mergedPreferences.language,
          timezone: mergedPreferences.timezone,
        }
      : {}),
    ...(input.profileImageUrl !== undefined
      ? { profileImageUrl: normalizeOptionalString(input.profileImageUrl) }
      : {}),
  });

  return toUserProfileView(updated);
}

export async function changeUserPassword(
  userId: UserId,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  if (!currentPassword || !newPassword) {
    throw new ProfileError(
      "Password attuale e nuova password sono obbligatorie.",
      "INVALID_INPUT",
      400
    );
  }

  if (newPassword.length < 8) {
    throw new ProfileError(
      "La nuova password deve avere almeno 8 caratteri.",
      "WEAK_PASSWORD",
      400
    );
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ProfileError(
      "Password attuale non corretta.",
      "INVALID_PASSWORD",
      401
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordHash(userId, passwordHash);
  await revokeAllAuthSessionsForUser(userId);
}

export async function deleteUserAccount(userId: UserId): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  await updateUser(userId, {
    accountStatus: AccountStatus.Deleted,
    deletedAt: new Date(),
  });
  await revokeAllAuthSessionsForUser(userId);
}

function buildTodayStats(
  todayStats: Awaited<ReturnType<typeof findDailyStatistics>>,
  dailyGoalMinutes: number | null
): UserStatisticsView["today"] {
  const studyTimeMs = todayStats?.studyTimeMs ?? 0;
  const goalMs = (dailyGoalMinutes ?? 0) * 60_000;
  const dailyGoalProgressPercent =
    goalMs > 0 ? Math.min(Math.round((studyTimeMs / goalMs) * 100), 100) : 0;

  return {
    studyTimeMs,
    cardsCompleted: todayStats?.cardsCompleted ?? 0,
    atomsCompleted: todayStats?.atomsCompleted ?? 0,
    reviewsCompleted: todayStats?.reviewsCompleted ?? 0,
    accuracy: todayStats?.accuracy ?? 0,
    averageMastery: todayStats?.averageMastery ?? null,
    dailyGoalMinutes,
    dailyGoalProgressPercent,
  };
}

export async function getUserStatistics(
  userId: UserId
): Promise<UserStatisticsView> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  const today = startOfDay(new Date());
  const yesterday = previousDay(today);

  const [
    todayStats,
    yesterdayStats,
    totals,
    atomStates,
    pendingReviews,
    recentSessions,
  ] = await Promise.all([
    findDailyStatistics(userId, today),
    findDailyStatistics(userId, yesterday),
    sumDailyStatisticsByUserId(userId),
    findUserAtomStatesByUserId(userId),
    findScheduledReviewsByUserId(userId),
    findStudySessionsByUserId(userId, 5),
  ]);

  const studiedToday = (todayStats?.cardsCompleted ?? 0) > 0;
  const currentStreak = studiedToday
    ? (todayStats?.dailyStreak ?? 0)
    : yesterdayStats && yesterdayStats.cardsCompleted > 0
      ? yesterdayStats.dailyStreak
      : 0;

  const atomsMastered = atomStates.filter(
    (state) =>
      state.mastery >= MASTERY_STABLE_THRESHOLD ||
      state.currentStage === UserAtomLearningState.Mastered
  ).length;

  const averageMastery =
    atomStates.length > 0
      ? Math.round(
          atomStates.reduce((sum, state) => sum + state.mastery, 0) /
            atomStates.length
        )
      : 0;

  const memoryHealth =
    atomStates.length > 0
      ? Math.round(
          atomStates.reduce(
            (sum, state) => sum + (1 - state.estimatedDecay) * 100,
            0
          ) / atomStates.length
        )
      : null;

  return {
    today: buildTodayStats(todayStats, user.preferences.dailyGoalMinutes),
    streak: {
      current: currentStreak,
      studiedToday,
    },
    lifetime: {
      totalStudyTimeMs: totals.totalStudyTimeMs,
      totalCardsCompleted: totals.totalCardsCompleted,
      totalAtomsMastered: atomsMastered,
      totalSessions: await prisma.studySession.count({ where: { userId } }),
      averageMastery,
      memoryHealth,
      pendingReviews: pendingReviews.length,
    },
    recentSessions: recentSessions.map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMs: session.durationMs,
      cardsViewed: session.cardsViewed,
      correctAnswerCount: session.correctAnswerCount,
      subjectId: session.subjectId,
    })),
  };
}

export async function getDailyStatisticsHistory(
  userId: UserId,
  days: number
): Promise<DailyStatisticsView[]> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  const safeDays = Math.min(Math.max(days, 1), 90);
  const to = startOfDay(new Date());
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (safeDays - 1));

  const records = await findDailyStatisticsByUserId(userId, {
    from: toDateOnly(from),
    to,
    limit: safeDays,
  });

  return records
    .map((record) => ({
      date: record.date,
      studyTimeMs: record.studyTimeMs,
      cardsCompleted: record.cardsCompleted,
      accuracy: record.accuracy,
      dailyStreak: record.dailyStreak,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function uploadUserAvatar(
  userId: UserId,
  file: { buffer: Buffer; mimeType: string }
): Promise<UserProfileView> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ProfileError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  if (!file.mimeType.startsWith("image/")) {
    throw new ProfileError(
      "Il file deve essere un'immagine.",
      "INVALID_FILE_TYPE",
      400
    );
  }

  const processed = await processImage(file.buffer, file.mimeType);
  const storageKey = buildAvatarStorageKey(userId, processed.extension);
  const storage = getStorageProvider();
  const previousKey =
    user.profileImageUrl && isStorageKey(user.profileImageUrl)
      ? user.profileImageUrl
      : null;

  try {
    await storage.save(storageKey, processed.buffer, processed.mimeType);
    const updated = await updateUser(userId, {
      profileImageUrl: storageKey,
    });

    if (previousKey && previousKey !== storageKey) {
      await deleteStorageKeys([previousKey]);
    }

    return toUserProfileView(updated);
  } catch (error) {
    await deleteStorageKeys([storageKey]);
    throw error;
  }
}
