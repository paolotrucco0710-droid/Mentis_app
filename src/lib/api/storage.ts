import type { UserProfileView } from "@/profile/types";
import { apiFetch } from "./client";

export async function fetchImageUrl(
  imageId: string
): Promise<{ url: string; expiresInSeconds: number }> {
  return apiFetch(`/api/v1/images/${imageId}/url`);
}

export async function fetchAvatarUrl(): Promise<{
  url: string;
  expiresInSeconds: number;
}> {
  return apiFetch("/api/v1/profile/avatar");
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
  return data.profile;
}
