"use client";

import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";

function hasExpandableExplanation(card: FeedCardProps["card"]): boolean {
  const summary = card.text?.trim() ?? "";
  const explanation = card.explanation?.trim() ?? "";

  return explanation.length > 0 && explanation !== summary;
}

function ExplainCardComponent({
  card,
  atomTitle,
  imageUrl,
  imageCaption,
  disabled,
  onContinue,
}: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = hasExpandableExplanation(card);
  const conceptTitle = atomTitle?.trim() || card.prompt || "Concetto";

  const handleContinue = useCallback(() => {
    onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true });
  }, [onContinue]);

  return (
    <FeedCardSurface className="pb-4">
      <FeedCardTitle>{conceptTitle}</FeedCardTitle>
      <FeedCardHint>Fissa l&apos;idea in una frase. Scorri su quando sei pronto.</FeedCardHint>

      {imageUrl ? (
        <figure className="space-y-2">
          <div className="relative min-h-[180px] max-h-[min(48vh,400px)] w-full overflow-hidden rounded-2xl border border-border bg-muted/20">
            <OptimizedImage
              src={imageUrl}
              alt={imageCaption ?? conceptTitle}
              fill
              priority
              objectFit="contain"
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          </div>
          {imageCaption ? (
            <figcaption className="text-center text-xs text-muted">
              {imageCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="space-y-4 text-base leading-7 text-foreground">
        <p className="text-lg font-medium leading-8">{card.text}</p>
        {canExpand && !expanded ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={disabled}
            onClick={() => setExpanded(true)}
          >
            Approfondisci
          </Button>
        ) : null}
        {canExpand && expanded ? (
          <div className="space-y-3">
            <p className="rounded-2xl bg-accent/60 p-4 text-sm text-muted">
              {card.explanation}
            </p>
            <Button
              variant="ghost"
              fullWidth
              disabled={disabled}
              onClick={() => setExpanded(false)}
            >
              Mostra solo il riassunto
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-auto pt-2">
        <Button fullWidth disabled={disabled} onClick={handleContinue}>
          Ho capito
        </Button>
      </div>
    </FeedCardSurface>
  );
}

export const ExplainCard = memo(ExplainCardComponent);
