import path from "path";
import { env } from "@/lib/env";
import { createLocalStorageProvider } from "./local-provider";

export type { StorageProvider, StoredFile } from "./types";
export { hashBuffer } from "./local-provider";
export * from "./types";

let storageInstance: ReturnType<typeof createLocalStorageProvider> | null =
  null;

export function getStorageProvider() {
  if (!storageInstance) {
    storageInstance = createLocalStorageProvider(env.uploadStoragePath);
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
