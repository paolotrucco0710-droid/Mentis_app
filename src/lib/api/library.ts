import type { LibraryOverview } from "@/course/types";
import { apiFetch } from "./client";

export async function fetchLibraryOverview(): Promise<LibraryOverview> {
  const data = await apiFetch<{ overview: LibraryOverview }>("/api/v1/library");
  return data.overview;
}
