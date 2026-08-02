"use client";

import { memo, useEffect, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, fetchImageUrl } from "@/lib/api";
import type { FeedCardProps } from "../card-utils";
import { getImageIdFromPayload } from "../card-utils";

function ImageExplainCardComponent({
  card,
  atomTitle,
  disabled,
  onContinue,
}: FeedCardProps) {
  const imageId = getImageIdFromPayload(card.payload);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const conceptTitle = atomTitle?.trim() || card.prompt || "Concetto visivo";

  useEffect(() => {
    if (!imageId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchImageUrl(imageId);
        if (!cancelled) {
          setImageUrl(result.url);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 404)) {
          setImageUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{conceptTitle}</CardTitle>
        <CardDescription>
          {card.prompt && card.prompt !== conceptTitle
            ? card.prompt
            : "Studia il contenuto e collega ciò che vedi al concetto."}
        </CardDescription>
      </CardHeader>
      {imageUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
          <OptimizedImage
            src={imageUrl}
            alt={conceptTitle}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-accent/40 text-sm text-muted">
          {imageId ? "Caricamento immagine..." : "Immagine del concetto"}
        </div>
      )}
      <p className="mt-4 text-sm leading-7">{card.text}</p>
      {card.explanation ? (
        <p className="mt-3 rounded-xl bg-accent/60 p-4 text-sm text-muted">
          {card.explanation}
        </p>
      ) : null}
      <Button
        className="mt-6"
        fullWidth
        disabled={disabled}
        onClick={() =>
          onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
        }
      >
        Ho capito
      </Button>
    </Card>
  );
}

export const ImageExplainCard = memo(ImageExplainCardComponent);
