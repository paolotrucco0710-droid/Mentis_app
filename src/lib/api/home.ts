import type { HomeContinueContext } from "@/home";
import { apiFetch } from "./client";

export async function fetchHomeContinueContext(): Promise<HomeContinueContext> {
  const data = await apiFetch<{ context: HomeContinueContext }>(
    "/api/v1/home/continue"
  );
  return data.context;
}
