import { access, mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";
import { hashBuffer } from "./hash";
import { buildLocalStorageAccessUrl } from "./signed-url";

export function createLocalStorageProvider(
  rootPath: string,
  signedUrlTtlSeconds: number
): StorageProvider {
  const absoluteRoot = path.resolve(rootPath);

  async function resolvePath(storageKey: string): Promise<string> {
    const normalized = path
      .normalize(storageKey)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(absoluteRoot, normalized);

    if (!fullPath.startsWith(absoluteRoot)) {
      throw new Error("Invalid storage key");
    }

    return fullPath;
  }

  return {
    async save(storageKey, data, mimeType) {
      const filePath = await resolvePath(storageKey);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, data);

      return {
        storageKey,
        mimeType,
        sizeBytes: data.length,
        hash: hashBuffer(data),
      };
    },

    async read(storageKey) {
      const filePath = await resolvePath(storageKey);
      return readFile(filePath);
    },

    async delete(storageKey) {
      const filePath = await resolvePath(storageKey);
      await unlink(filePath);
    },

    async exists(storageKey) {
      const filePath = await resolvePath(storageKey);
      try {
        await access(filePath);
        return true;
      } catch {
        return false;
      }
    },

    async getSignedUrl(storageKey, expiresInSeconds) {
      return buildLocalStorageAccessUrl(
        storageKey,
        expiresInSeconds ?? signedUrlTtlSeconds
      );
    },
  };
}
