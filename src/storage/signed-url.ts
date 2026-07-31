import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function createStorageAccessSignature(
  storageKey: string,
  expiresAt: number
): string {
  return createHmac("sha256", env.storageSigningSecret)
    .update(`${storageKey}:${expiresAt}`)
    .digest("base64url");
}

export function verifyStorageAccessSignature(
  storageKey: string,
  expiresAt: number,
  token: string
): boolean {
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = createStorageAccessSignature(storageKey, expiresAt);
  const left = Buffer.from(expected);
  const right = Buffer.from(token);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function buildLocalStorageAccessUrl(
  storageKey: string,
  expiresInSeconds: number
): string {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const token = createStorageAccessSignature(storageKey, expiresAt);
  const params = new URLSearchParams({
    key: storageKey,
    expires: String(expiresAt),
    token,
  });

  return `${env.appUrl}/api/v1/storage/access?${params.toString()}`;
}
