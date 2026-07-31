import path from "path";
import { createStorageProvider } from "./create-provider";

export type { StorageProvider, StoredFile } from "./types";
export { StorageError } from "./errors";
export { hashBuffer } from "./hash";
export { deleteKnowledgeSourceFiles, deleteStorageKeys } from "./cleanup";
export {
  buildLocalStorageAccessUrl,
  verifyStorageAccessSignature,
} from "./signed-url";
export * from "./types";

let storageInstance: ReturnType<typeof createStorageProvider> | null = null;

export function getStorageProvider() {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}

export function buildPageStorageKey(
  knowledgeSourceId: string,
  pageNumber: number,
  extension: string
): string {
  const padded = String(pageNumber).padStart(3, "0");
  return path.posix.join(knowledgeSourceId, "pages", `${padded}.${extension}`);
}

export function buildPdfStorageKey(knowledgeSourceId: string): string {
  return path.posix.join(knowledgeSourceId, "document.pdf");
}

export function buildAvatarStorageKey(userId: string, extension: string): string {
  return path.posix.join("users", userId, `avatar.${extension}`);
}

export function isStorageKey(value: string): boolean {
  return (
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("data:")
  );
}

export async function getStorageSignedUrl(
  storageKey: string,
  expiresInSeconds?: number
): Promise<string> {
  const storage = getStorageProvider();
  return storage.getSignedUrl(storageKey, expiresInSeconds);
}
