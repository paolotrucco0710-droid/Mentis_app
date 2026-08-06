"use client";

import type { RetrievalFeedback } from "@/ai/retrieval-feedback";

export function RetrievalFeedbackPanel({
  feedback,
}: {
  feedback: RetrievalFeedback;
}) {
  const gaps = feedback.gaps.filter(Boolean);
  const strengths = feedback.strengths.filter(Boolean);
  const showTip = Boolean(feedback.suggestion?.trim());

  return (
    <div
      className={`rounded-xl border p-4 ${
        feedback.isCorrect
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-amber-200 bg-amber-50/80"
      }`}
    >
      <p
        className={`text-sm font-medium leading-6 ${
          feedback.isCorrect ? "text-emerald-800" : "text-amber-900"
        }`}
      >
        {feedback.summary}
      </p>

      {strengths.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {!feedback.isCorrect && gaps.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      ) : null}

      {!feedback.isCorrect && showTip ? (
        <p className="mt-2 text-sm text-muted">{feedback.suggestion}</p>
      ) : null}

      {feedback.source === "heuristic" ? (
        <p className="mt-2 text-xs text-muted">
          Valutazione rapida locale — per feedback più preciso configura OpenRouter.
        </p>
      ) : null}
    </div>
  );
}
