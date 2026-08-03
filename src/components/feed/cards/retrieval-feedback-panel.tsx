"use client";

import type { RetrievalFeedback } from "@/ai/retrieval-feedback";

export function RetrievalFeedbackPanel({
  feedback,
}: {
  feedback: RetrievalFeedback;
}) {
  const gap = feedback.gaps[0];
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

      {!feedback.isCorrect && gap ? (
        <p className="mt-2 text-sm text-muted">{gap}</p>
      ) : null}

      {!feedback.isCorrect && showTip ? (
        <p className="mt-2 text-sm text-muted">{feedback.suggestion}</p>
      ) : null}
    </div>
  );
}
