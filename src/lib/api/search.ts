import type { SearchResults } from "@/course/types";
import { env } from "@/lib/env";
import { apiFetch } from "./client";
import { fetchWithQueryCache, queryCacheKeys } from "./query-cache";

export async function searchLibrary(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      subjects: [],
      courses: [],
      chapters: [],
      atoms: [],
    };
  }

  return fetchWithQueryCache(
    queryCacheKeys.search(trimmed),
    async () => {
      const params = new URLSearchParams({ q: trimmed });
      const data = await apiFetch<{ results: SearchResults }>(
        `/api/v1/search?${params.toString()}`
      );
      return data.results;
    },
    env.queryCacheTtlSeconds * 1000
  );
}
