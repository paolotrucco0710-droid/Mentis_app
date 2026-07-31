import { findImagesByKnowledgeSourceId } from "@/db/repositories/uploads";
import type { KnowledgeSourceId } from "@/domain/ids";
import { getStorageProvider } from "./index";

export async function deleteKnowledgeSourceFiles(
  knowledgeSourceId: KnowledgeSourceId
): Promise<void> {
  const images = await findImagesByKnowledgeSourceId(knowledgeSourceId);
  const storage = getStorageProvider();
  const keys = [...new Set(images.map((image) => image.storageKey))];

  await Promise.all(
    keys.map(async (storageKey) => {
      try {
        await storage.delete(storageKey);
      } catch (error) {
        console.error(`Failed to delete storage object ${storageKey}:`, error);
      }
    })
  );
}

export async function deleteStorageKeys(storageKeys: string[]): Promise<void> {
  const storage = getStorageProvider();
  const uniqueKeys = [...new Set(storageKeys)];

  await Promise.all(
    uniqueKeys.map(async (storageKey) => {
      try {
        await storage.delete(storageKey);
      } catch (error) {
        console.error(`Failed to delete storage object ${storageKey}:`, error);
      }
    })
  );
}
