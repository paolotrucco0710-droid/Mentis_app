import type {
  DailyStatisticsView,
  UpdateProfileInput,
  UserProfileView,
  UserStatisticsView,
} from "@/profile";
import { env } from "@/lib/env";
import { apiFetch } from "./client";
import {
  fetchWithQueryCache,
  invalidateQuery,
  invalidateQueryPrefix,
  queryCacheKeys,
} from "./query-cache";

export async function fetchProfile(): Promise<UserProfileView> {
  return fetchWithQueryCache(
    queryCacheKeys.profile,
    async () => {
      const data = await apiFetch<{ profile: UserProfileView }>("/api/v1/profile");
      return data.profile;
    },
    env.queryCacheTtlSeconds * 1000
  );
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<UserProfileView> {
  const data = await apiFetch<{ profile: UserProfileView }>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  invalidateProfileCache();
  return data.profile;
}

export async function fetchProfileStatistics(): Promise<UserStatisticsView> {
  return fetchWithQueryCache(
    queryCacheKeys.profileStatistics,
    async () => {
      const data = await apiFetch<{ statistics: UserStatisticsView }>(
        "/api/v1/profile/statistics"
      );
      return data.statistics;
    },
    env.queryCacheTtlSeconds * 1000
  );
}

export async function fetchDailyStatisticsHistory(
  days = 7
): Promise<DailyStatisticsView[]> {
  return fetchWithQueryCache(
    queryCacheKeys.profileDailyHistory(days),
    async () => {
      const data = await apiFetch<{ history: DailyStatisticsView[] }>(
        `/api/v1/profile/statistics/daily?days=${days}`
      );
      return data.history;
    },
    env.queryCacheTtlSeconds * 1000
  );
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch("/api/v1/profile/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAccount(): Promise<void> {
  await apiFetch("/api/v1/profile", { method: "DELETE" });
  invalidateProfileCache();
}

export function invalidateProfileCache(): void {
  invalidateQuery(queryCacheKeys.profile);
  invalidateQuery(queryCacheKeys.profileStatistics);
  invalidateQueryPrefix("profile:daily:");
  invalidateQuery(queryCacheKeys.avatarUrl);
}
