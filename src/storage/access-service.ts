import { findImageById } from "@/db/repositories/uploads";
import { findUserById } from "@/db/repositories/users";
import type { ImageId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { getStorageSignedUrl, isStorageKey } from "@/storage";
import { StorageError } from "@/storage/errors";

export async function getImageSignedUrlForUser(
  userId: UserId,
  imageId: ImageId
): Promise<{ url: string; expiresInSeconds: number }> {
  const image = await findImageById(imageId);
  if (!image || image.ownerId !== userId) {
    throw new StorageError("Immagine non trovata.", "IMAGE_NOT_FOUND", 404);
  }

  const expiresInSeconds = env.storageSignedUrlTtlSeconds;
  const url = await getStorageSignedUrl(image.storageKey, expiresInSeconds);
  return { url, expiresInSeconds };
}

export async function getAvatarSignedUrlForUser(
  userId: UserId
): Promise<{ url: string; expiresInSeconds: number } | null> {
  const user = await findUserById(userId);
  if (!user?.profileImageUrl || !isStorageKey(user.profileImageUrl)) {
    return null;
  }

  const expiresInSeconds = env.storageSignedUrlTtlSeconds;
  const url = await getStorageSignedUrl(
    user.profileImageUrl,
    expiresInSeconds
  );
  return { url, expiresInSeconds };
}

export async function resolveProfileImageUrl(
  profileImageUrl: string | null
): Promise<string | null> {
  if (!profileImageUrl) {
    return null;
  }

  if (!isStorageKey(profileImageUrl)) {
    return profileImageUrl;
  }

  return getStorageSignedUrl(profileImageUrl);
}
