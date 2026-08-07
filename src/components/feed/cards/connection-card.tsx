"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { SessionEventOutcome } from "@/domain/enums";
import { cn } from "@/lib/utils";
import type { FeedCardProps } from "../card-utils";
import { isConnectionPayload } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";

export function ConnectionCardComponent({
  card,
  atomTitle,
  disabled,
  onContinue,
  registerAdvance,
}: FeedCardProps) {
  const payload = isConnectionPayload(card.payload) ? card.payload : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect =
    payload !== null && selectedIndex === payload.correctOptionIndex;

  const continueWithResult = useCallback(() => {
    if (selectedIndex === null || !payload) {
      return;
    }

    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }, [isCorrect, onContinue, payload, selectedIndex]);

  useEffect(() => {
    if (!registerAdvance) {
      return;
    }

    const canAdvance = revealed && selectedIndex !== null;
    registerAdvance(
      canAdvance ? continueWithResult : null,
      canAdvance
        ? {
            outcome: isCorrect
              ? SessionEventOutcome.Success
              : SessionEventOutcome.Failure,
            isCorrect,
          }
        : null
    );
    return () => registerAdvance(null);
  }, [
    continueWithResult,
    isCorrect,
    registerAdvance,
    revealed,
    selectedIndex,
  ]);

  if (!payload) {
    return null;
  }

  function handleSelect(index: number) {
    if (disabled || revealed) {
      return;
    }

    setSelectedIndex(index);
    setRevealed(true);
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>Collegamento</FeedCardTitle>
      <FeedCardHint>
        {atomTitle
          ? `«${payload.relatedAtomTitle}» ↔ «${atomTitle}»`
          : `Collega «${payload.relatedAtomTitle}» al concetto attuale.`}
      </FeedCardHint>
      <p className="text-sm font-medium leading-7">{payload.question}</p>

      <div className="space-y-2">
        {payload.options.map((option, index) => {
          const selected = selectedIndex === index;
          const showCorrect = revealed && index === payload.correctOptionIndex;
          const showWrong = revealed && selected && !isCorrect;

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              disabled={disabled || revealed}
              onClick={() => handleSelect(index)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3.5 text-left text-sm leading-relaxed whitespace-normal transition-colors",
                selected && !revealed && "border-primary bg-accent",
                showCorrect &&
                  "border-success bg-green-50 dark:bg-green-950/30",
                showWrong && "border-danger bg-red-50 dark:bg-red-950/30",
                !selected &&
                  !revealed &&
                  "border-border bg-surface hover:bg-accent/50"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <p className="text-sm font-medium">
          {isCorrect
            ? card.correctFeedback ?? "Corretto!"
            : card.incorrectFeedback ?? "Rileggi il legame tra i concetti."}
        </p>
      ) : null}
    </FeedCardSurface>
  );
}

export const ConnectionCard = memo(ConnectionCardComponent);
