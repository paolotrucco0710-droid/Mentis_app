"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, fetchImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeedCardProps } from "../card-utils";
import {
  getImageIdFromPayload,
  getImageLabelingFromPayload,
  getImageQuestionFromPayload,
  getImageQuizOptionsFromPayload,
} from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";
import { useAutoContinue } from "../use-auto-continue";

function ImageExplainCardComponent({
  card,
  atomTitle,
  imageUrl: initialImageUrl,
  disabled,
  onContinue,
}: FeedCardProps) {
  const imageId = getImageIdFromPayload(card.payload);
  const conceptTitle = atomTitle?.trim() || "Illustrazione";
  const labeling = getImageLabelingFromPayload(card.payload);
  const question =
    getImageQuestionFromPayload(card.payload) ??
    (labeling?.targetLabel
      ? `Tocca la zona che corrisponde a «${labeling.targetLabel}».`
      : `Quale affermazione su «${conceptTitle}» è corretta?`);
  const quiz = labeling ? null : getImageQuizOptionsFromPayload(card.payload);
  const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const imageUrl = initialImageUrl ?? fetchedImageUrl;
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = labeling
    ? selectedRegionId === labeling.correctRegionId
    : quiz !== null && selectedIndex === quiz.correctOptionIndex;

  const continueWithResult = useCallback(() => {
    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }, [isCorrect, onContinue]);

  useAutoContinue(revealed && (labeling !== null || quiz !== null), continueWithResult);

  useEffect(() => {
    if (initialImageUrl || !imageId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchImageUrl(imageId);
        if (!cancelled) {
          setFetchedImageUrl(result.url);
          setImageLoadError(false);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 404)) {
          setFetchedImageUrl(null);
          setImageLoadError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageId, initialImageUrl, reloadKey]);

  function handleImageRetry() {
    setImageLoadError(false);
    setFetchedImageUrl(null);
    setReloadKey((value) => value + 1);
  }

  function handleSelectRegion(regionId: string) {
    if (disabled || revealed || !labeling) {
      return;
    }

    setSelectedRegionId(regionId);
    setRevealed(true);
  }

  function handleSelect(index: number) {
    if (disabled || revealed || !quiz) {
      return;
    }

    setSelectedIndex(index);
    setRevealed(true);
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>{conceptTitle}</FeedCardTitle>
      <FeedCardHint>
        {card.prompt && card.prompt !== conceptTitle
          ? card.prompt
          : labeling
            ? "Individua la parte giusta dello schema."
            : "Collega l'illustrazione al concetto."}
      </FeedCardHint>

      <p className="text-sm font-medium leading-7">{question}</p>

      {imageUrl && !imageLoadError ? (
        <div className="relative h-[min(55vh,460px)] min-h-[220px] w-full overflow-hidden rounded-2xl border border-border bg-muted/20">
          <OptimizedImage
            src={imageUrl}
            alt={conceptTitle}
            fill
            priority
            objectFit="contain"
            sizes="(max-width: 768px) 100vw, 100vw"
            onError={() => setImageLoadError(true)}
          />
          {labeling
            ? labeling.regions.map((region, index) => {
                const selected = selectedRegionId === region.id;
                const isTarget = region.id === labeling.correctRegionId;
                const showCorrect = revealed && isTarget;
                const showWrong = revealed && selected && !isCorrect;

                return (
                  <button
                    key={region.id}
                    type="button"
                    aria-label={
                      revealed
                        ? region.label
                        : `Zona ${index + 1}`
                    }
                    disabled={disabled || revealed}
                    onClick={() => handleSelectRegion(region.id)}
                    className={cn(
                      "absolute rounded-xl border-2 transition-colors",
                      !revealed &&
                        "border-primary/50 bg-primary/10 hover:bg-primary/20",
                      showCorrect &&
                        "border-success bg-green-500/25",
                      showWrong &&
                        "border-danger bg-red-500/25",
                      revealed &&
                        !showCorrect &&
                        !showWrong &&
                        "border-border/70 bg-black/5"
                    )}
                    style={{
                      top: `${region.box.top * 100}%`,
                      left: `${region.box.left * 100}%`,
                      width: `${(region.box.right - region.box.left) * 100}%`,
                      height: `${(region.box.bottom - region.box.top) * 100}%`,
                    }}
                  >
                    {revealed ? (
                      <span className="absolute inset-x-1 bottom-1 rounded-md bg-background/90 px-1.5 py-0.5 text-center text-[11px] font-medium leading-tight text-foreground">
                        {region.label}
                      </span>
                    ) : null}
                  </button>
                );
              })
            : null}
        </div>
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-accent/40 px-4 text-center text-sm text-muted">
          <p>
            {imageLoadError
              ? "Immagine non disponibile."
              : imageId
                ? "Caricamento immagine..."
                : "Immagine del concetto"}
          </p>
          {imageLoadError ? (
            <Button type="button" variant="secondary" onClick={handleImageRetry}>
              Riprova caricamento
            </Button>
          ) : null}
        </div>
      )}

      {imageUrl && imageLoadError ? (
        <Button type="button" variant="secondary" onClick={handleImageRetry}>
          Riprova caricamento immagine
        </Button>
      ) : null}

      {labeling ? (
        revealed ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isCorrect
                ? card.correctFeedback ?? "Corretto!"
                : card.incorrectFeedback ?? "Rileggi il concetto e riprova."}
            </p>
            {labeling.revealText ?? card.explanation ? (
              <p className="text-sm text-muted">
                {labeling.revealText ?? card.explanation}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Tocca una zona dell&apos;immagine per rispondere.
          </p>
        )
      ) : quiz ? (
        <>
          <div className="space-y-2">
            {quiz.options.map((option, index) => {
              const selected = selectedIndex === index;
              const showCorrect =
                revealed && index === quiz.correctOptionIndex;
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
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isCorrect
                  ? card.correctFeedback ?? "Corretto!"
                  : card.incorrectFeedback ?? "Rileggi il concetto e riprova."}
              </p>
              {card.explanation ? (
                <p className="text-sm text-muted">{card.explanation}</p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <Button
          fullWidth
          disabled={disabled}
          onClick={() =>
            onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
          }
        >
          Ho collegato l&apos;immagine al concetto
        </Button>
      )}
    </FeedCardSurface>
  );
}

export const ImageExplainCard = memo(ImageExplainCardComponent);
