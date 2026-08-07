"use client";

import { memo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";

function FallbackCardComponent({
  card,
  disabled,
  onContinue,
  onSkip,
  registerAdvance,
}: FeedCardProps) {
  const handleContinue = useCallback(() => {
    onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true });
  }, [onContinue]);

  useEffect(() => {
    if (!registerAdvance) {
      return;
    }

    registerAdvance(handleContinue, {
      outcome: SessionEventOutcome.Neutral,
      isCorrect: true,
    });
    return () => registerAdvance(null);
  }, [handleContinue, registerAdvance]);

  return (
    <FeedCardSurface>
      <FeedCardTitle>{card.prompt ?? "Card di studio"}</FeedCardTitle>
      <FeedCardHint>Tipo: {card.type}</FeedCardHint>
      <p className="text-sm leading-7">{card.text}</p>
      <div className="mt-auto pt-4">
        <Button
          fullWidth
          variant="secondary"
          disabled={disabled}
          onClick={onSkip}
        >
          Salta
        </Button>
      </div>
    </FeedCardSurface>
  );
}

export const FallbackCard = memo(FallbackCardComponent);
