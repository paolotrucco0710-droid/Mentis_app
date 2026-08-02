import type { RetrievalFeedback } from "@/ai/retrieval-feedback";
import type { AtomId, CardId } from "@/domain/ids";
import { apiFetch } from "./client";

export async function evaluateRetrievalResponse(input: {
  atomId: AtomId;
  cardId: CardId;
  userAnswer: string;
}): Promise<RetrievalFeedback> {
  const data = await apiFetch<{ feedback: RetrievalFeedback }>(
    "/api/v1/ai/evaluate-response",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return data.feedback;
}
