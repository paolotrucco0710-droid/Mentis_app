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
  const question =
    getImageQuestionFromPayload(card.payload) ??
    `Quale affermazione su «${conceptTitle}» è corretta?`;
  const quiz = getImageQuizOptionsFromPayload(card.payload);
  const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
  const imageUrl = initialImageUrl ?? fetchedImageUrl;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect =
    quiz !== null && selectedIndex === quiz.correctOptionIndex;

  const continueWithResult = useCallback(() => {
    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }, [isCorrect, onContinue]);

  useAutoContinue(revealed && quiz !== null, continueWithResult);

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
        }
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 404)) {
          setFetchedImageUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageId, initialImageUrl]);

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
          : "Collega l'illustrazione al concetto."}
      </FeedCardHint>

      {imageUrl ? (
        <div className="relative min-h-[200px] max-h-[min(50vh,420px)] w-full overflow-hidden rounded-2xl border border-border bg-muted/20">
          <OptimizedImage
            src={imageUrl}
            alt={conceptTitle}
            fill
            priority
            objectFit="contain"
            sizes="(max-width: 768px) 100vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-accent/40 text-sm text-muted">
          {imageId ? "Caricamento immagine..." : "Immagine del concetto"}
        </div>
      )}

      {quiz ? (
        <>
          <p className="text-sm font-medium leading-7">{question}</p>
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
        <>
          <p className="text-sm leading-7">{question}</p>
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
            }
          >
            Ho collegato l&apos;immagine al concetto
          </Button>
        </>
      )}
    </FeedCardSurface>
  );
}

export const ImageExplainCard = memo(ImageExplainCardComponent);
