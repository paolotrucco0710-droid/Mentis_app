"use client";

import type { RetrievalFeedback } from "@/ai/retrieval-feedback";

export function RetrievalFeedbackPanel({
  feedback,
}: {
  feedback: RetrievalFeedback;
}) {
  return (
    <div className="space-y-4">
      <p
        className={`text-sm font-medium ${
          feedback.isCorrect ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {feedback.summary}
      </p>

      {feedback.strengths.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Punti forti</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {feedback.strengths.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {feedback.gaps.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Da integrare</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {feedback.gaps.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl bg-accent/60 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">Suggerimento</p>
        <p className="mt-1">{feedback.suggestion}</p>
      </div>

      {feedback.source === "heuristic" ? (
        <p className="text-xs text-muted">
          Valutazione rapida locale. Per feedback AI completo configura
          OPENAI_API_KEY.
        </p>
      ) : null}
    </div>
  );
}
