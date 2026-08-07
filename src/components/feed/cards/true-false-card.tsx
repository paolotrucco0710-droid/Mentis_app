"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { SessionEventOutcome } from "@/domain/enums";
import { cn } from "@/lib/utils";
import type { FeedCardProps } from "../card-utils";
import { isTrueFalsePayload } from "../card-utils";
import { FeedCardSurface, FeedCardTitle } from "../feed-card-surface";

export function TrueFalseCardComponent({
  card,
  disabled,
  onContinue,
  registerAdvance,
}: FeedCardProps) {
  const payload = isTrueFalsePayload(card.payload) ? card.payload : null;
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = payload !== null && answer === payload.correctAnswer;

  const continueWithResult = useCallback(() => {
    if (answer === null) {
      return;
    }

    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }, [answer, isCorrect, onContinue]);

  useEffect(() => {
    if (!registerAdvance) {
      return;
    }

    registerAdvance(
      revealed ? continueWithResult : null,
      revealed
        ? {
            outcome: isCorrect
              ? SessionEventOutcome.Success
              : SessionEventOutcome.Failure,
            isCorrect,
          }
        : null
    );
    return () => registerAdvance(null);
  }, [continueWithResult, isCorrect, registerAdvance, revealed]);

  if (!payload) {
    return null;
  }

  function handleSelect(value: boolean) {
    if (disabled || revealed) {
      return;
    }

    setAnswer(value);
    setRevealed(true);
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>Vero o falso?</FeedCardTitle>
      <p className="rounded-2xl bg-accent/50 px-4 py-4 text-base leading-7">
        {payload.statement}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const label = value ? "Vero" : "Falso";
          const selected = answer === value;
          const showCorrect = revealed && value === payload.correctAnswer;
          const showWrong = revealed && selected && !isCorrect;

          return (
            <button
              key={label}
              type="button"
              disabled={disabled || revealed}
              onClick={() => handleSelect(value)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-sm font-semibold transition-colors",
                selected && !revealed && "border-primary bg-accent",
                showCorrect && "border-success bg-green-50 dark:bg-green-950/30",
                showWrong && "border-danger bg-red-50 dark:bg-red-950/30",
                !selected && !revealed && "border-border bg-surface hover:bg-accent/50"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isCorrect ? "Esatto!" : "Non proprio."}
          </p>
          {card.explanation ? (
            <p className="text-sm text-muted">{card.explanation}</p>
          ) : null}
        </div>
      ) : null}
    </FeedCardSurface>
  );
}

export const TrueFalseCard = memo(TrueFalseCardComponent);
