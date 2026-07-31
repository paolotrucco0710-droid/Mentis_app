import type { SearchResults } from "@/course/types";
import { apiFetch } from "./client";

export async function searchLibrary(query: string): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query });
  const data = await apiFetch<{ results: SearchResults }>(
    `/api/v1/search?${params.toString()}`
  );
  return data.results;
}
