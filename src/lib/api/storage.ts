import type { UserProfileView } from "@/profile/types";
import { env } from "@/lib/env";
import { apiFetch } from "./client";
import {
  fetchWithQueryCache,
  invalidateQuery,
  queryCacheKeys,
} from "./query-cache";
import { invalidateProfileCache } from "./profile";

export async function fetchImageUrl(
  imageId: string
): Promise<{ url: string; expiresInSeconds: number }> {
  return fetchWithQueryCache(
    queryCacheKeys.imageUrl(imageId),
    () => apiFetch(`/api/v1/images/${imageId}/url`),
    Math.min(env.queryCacheTtlSeconds, 300) * 1000
  );
}

export async function fetchAvatarUrl(): Promise<{
  url: string;
  expiresInSeconds: number;
}> {
  return fetchWithQueryCache(
    queryCacheKeys.avatarUrl,
    () => apiFetch("/api/v1/profile/avatar"),
    Math.min(env.queryCacheTtlSeconds, 300) * 1000
  );
}

export async function uploadAvatar(file: File): Promise<UserProfileView> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiFetch<{ profile: UserProfileView }>(
    "/api/v1/profile/avatar",
    {
      method: "POST",
      body: formData,
    }
  );
  invalidateQuery(queryCacheKeys.avatarUrl);
  invalidateProfileCache();
  return data.profile;
}
