import type { FeedResponse } from "@/domain/entities/feed-item";
import type { StudySession } from "@/domain/entities/study-session";
import type { KnowledgeSourceId, StudySessionId, SubjectId } from "@/domain/ids";
import type { EndSessionResult } from "@/session/types";
import { apiFetch } from "./client";

export async function createStudySession(
  subjectId?: SubjectId
): Promise<StudySession> {
  const data = await apiFetch<{ session: StudySession }>("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify({ subjectId }),
  });
  return data.session;
}

export async function fetchNextFeedItem(input: {
  sessionId: StudySessionId;
  subjectId: SubjectId;
  knowledgeSourceId?: KnowledgeSourceId;
}): Promise<FeedResponse> {
  const params = new URLSearchParams({
    sessionId: input.sessionId,
    subjectId: input.subjectId,
  });

  if (input.knowledgeSourceId) {
    params.set("knowledgeSourceId", input.knowledgeSourceId);
  }

  return apiFetch<FeedResponse>(`/api/v1/feed/next?${params.toString()}`);
}

export async function pauseSession(sessionId: StudySessionId): Promise<void> {
  await apiFetch(`/api/v1/sessions/${sessionId}/pause`, { method: "POST" });
}

export async function resumeSession(sessionId: StudySessionId): Promise<void> {
  await apiFetch(`/api/v1/sessions/${sessionId}/resume`, { method: "POST" });
}

export async function endSession(
  sessionId: StudySessionId
): Promise<EndSessionResult> {
  return apiFetch<EndSessionResult>(`/api/v1/sessions/${sessionId}/end`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
