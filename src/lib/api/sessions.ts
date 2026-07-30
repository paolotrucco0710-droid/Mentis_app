import type { SessionDetail } from "@/session/types";
import type { StudySessionId } from "@/domain/ids";
import { apiFetch } from "./client";

export async function fetchSessionDetail(
  sessionId: StudySessionId
): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/v1/sessions/${sessionId}`);
}
