import type {
  DailyStatisticsView,
  UpdateProfileInput,
  UserProfileView,
  UserStatisticsView,
} from "@/profile";
import { apiFetch } from "./client";

export async function fetchProfile(): Promise<UserProfileView> {
  const data = await apiFetch<{ profile: UserProfileView }>("/api/v1/profile");
  return data.profile;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<UserProfileView> {
  const data = await apiFetch<{ profile: UserProfileView }>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.profile;
}

export async function fetchProfileStatistics(): Promise<UserStatisticsView> {
  const data = await apiFetch<{ statistics: UserStatisticsView }>(
    "/api/v1/profile/statistics"
  );
  return data.statistics;
}

export async function fetchDailyStatisticsHistory(
  days = 7
): Promise<DailyStatisticsView[]> {
  const data = await apiFetch<{ history: DailyStatisticsView[] }>(
    `/api/v1/profile/statistics/daily?days=${days}`
  );
  return data.history;
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
}
