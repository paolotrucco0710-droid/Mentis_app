"use client";

import { memo } from "react";
import { Button } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";

function FallbackCardComponent({ card, disabled, onContinue, onSkip }: FeedCardProps) {
  return (
    <FeedCardSurface>
      <FeedCardTitle>{card.prompt ?? "Card di studio"}</FeedCardTitle>
      <FeedCardHint>Tipo: {card.type}</FeedCardHint>
      <p className="text-sm leading-7">{card.text}</p>
      <div className="mt-auto flex gap-3 pt-4">
        <Button
          className="flex-1"
          variant="secondary"
          disabled={disabled}
          onClick={onSkip}
        >
          Salta
        </Button>
        <Button
          className="flex-1"
          disabled={disabled}
          onClick={() =>
            onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
          }
        >
          Continua
        </Button>
      </div>
    </FeedCardSurface>
  );
}

export const FallbackCard = memo(FallbackCardComponent);
