import type { LibraryOverview } from "@/course/types";
import { env } from "@/lib/env";
import { apiFetch } from "./client";
import {
  fetchWithQueryCache,
  invalidateQuery,
  queryCacheKeys,
} from "./query-cache";

export async function fetchLibraryOverview(): Promise<LibraryOverview> {
  return fetchWithQueryCache(
    queryCacheKeys.library,
    async () => {
      const data = await apiFetch<{ overview: LibraryOverview }>("/api/v1/library");
      return data.overview;
    },
    env.queryCacheTtlSeconds * 1000
  );
}

export function invalidateLibraryCache(): void {
  invalidateQuery(queryCacheKeys.library);
}
