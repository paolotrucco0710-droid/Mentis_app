"use client";

import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { isErrorDetectionPayload } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";
import { useAutoContinue } from "../use-auto-continue";

export function ErrorDetectionCardComponent({
  card,
  disabled,
  onContinue,
}: FeedCardProps) {
  const payload = isErrorDetectionPayload(card.payload) ? card.payload : null;
  const [revealed, setRevealed] = useState(false);
  const [foundError, setFoundError] = useState<boolean | null>(null);

  const isCorrect =
    payload !== null && foundError === (payload.errorIndices.length > 0);

  const continueWithResult = useCallback(() => {
    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }, [isCorrect, onContinue]);

  useAutoContinue(revealed, continueWithResult);

  if (!payload) {
    return null;
  }

  function handleSelect(value: boolean) {
    if (disabled || revealed) {
      return;
    }

    setFoundError(value);
    setRevealed(true);
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>Trova l&apos;errore</FeedCardTitle>
      <FeedCardHint>Individua cosa non va nel testo.</FeedCardHint>
      <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm leading-7">
        {payload.text}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          variant={foundError === true ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => handleSelect(true)}
        >
          Ho trovato un errore
        </Button>
        <Button
          variant={foundError === false ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => handleSelect(false)}
        >
          Sembra corretto
        </Button>
      </div>
      {revealed ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Correzione</p>
          <p className="rounded-2xl bg-accent/60 p-4 text-sm text-muted">
            {payload.correction}
          </p>
        </div>
      ) : null}
    </FeedCardSurface>
  );
}

export const ErrorDetectionCard = memo(ErrorDetectionCardComponent);
