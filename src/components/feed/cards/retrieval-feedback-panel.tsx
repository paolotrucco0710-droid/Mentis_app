"use client";

import type { RetrievalFeedback } from "@/ai/retrieval-feedback";

export function RetrievalFeedbackPanel({
  feedback,
}: {
  feedback: RetrievalFeedback;
}) {
  const gap = feedback.gaps[0];
  const strength = feedback.strengths[0];

  return (
    <div className="space-y-2 rounded-xl border border-border bg-accent/40 p-4">
      <p
        className={`text-sm font-semibold leading-6 ${
          feedback.isCorrect ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {feedback.summary}
      </p>

      {strength ? (
        <p className="text-sm text-muted">{strength}</p>
      ) : null}

      {gap ? (
        <p className="text-sm text-muted">
          <span className="font-medium text-foreground">Manca:</span> {gap}
        </p>
      ) : null}

      <p className="text-sm text-muted">
        <span className="font-medium text-foreground">Prossimo passo:</span>{" "}
        {feedback.suggestion}
      </p>

      {feedback.source === "heuristic" ? (
        <p className="text-xs text-muted">
          Valutazione rapida locale. Per feedback AI completo configura
          OPENAI_API_KEY.
        </p>
      ) : null}
    </div>
  );
}
