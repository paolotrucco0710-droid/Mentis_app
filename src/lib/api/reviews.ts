import type { DailyReviewPlan, ReviewQueue } from "@/review/types";
import type { SubjectId } from "@/domain/ids";
import { apiFetch } from "./client";

export async function fetchDailyReview(
  subjectId?: SubjectId
): Promise<DailyReviewPlan> {
  const params = subjectId ? `?subjectId=${subjectId}` : "";
  return apiFetch<DailyReviewPlan>(`/api/v1/reviews/daily${params}`);
}

export async function fetchReviewQueue(
  subjectId?: SubjectId
): Promise<ReviewQueue> {
  const params = subjectId ? `?subjectId=${subjectId}` : "";
  return apiFetch<ReviewQueue>(`/api/v1/reviews/queue${params}`);
}

export async function syncReviews(): Promise<{ synced: number }> {
  return apiFetch<{ synced: number }>("/api/v1/reviews/sync", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
