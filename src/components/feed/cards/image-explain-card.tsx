"use client";

import { memo, useEffect, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
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

function ImageExplainCardComponent({
  card,
  atomTitle,
  disabled,
  onContinue,
}: FeedCardProps) {
  const imageId = getImageIdFromPayload(card.payload);
  const conceptTitle = atomTitle?.trim() || "Illustrazione";
  const question =
    getImageQuestionFromPayload(card.payload) ??
    `Quale affermazione su «${conceptTitle}» è corretta?`;
  const quiz = getImageQuizOptionsFromPayload(card.payload);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect =
    quiz !== null && selectedIndex === quiz.correctOptionIndex;

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

  function handleContinue() {
    onContinue({
      outcome: isCorrect
        ? SessionEventOutcome.Success
        : SessionEventOutcome.Failure,
      isCorrect,
    });
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{conceptTitle}</CardTitle>
        <CardDescription>
          {card.prompt && card.prompt !== conceptTitle
            ? card.prompt
            : "Collega l'illustrazione al concetto che stai studiando."}
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
      {quiz ? (
        <>
          <p className="mt-4 text-sm font-medium leading-7">{question}</p>
          <div className="mt-3 space-y-2">
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
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    selected && !revealed && "border-primary bg-accent",
                    showCorrect &&
                      "border-success bg-green-50 dark:bg-green-950/30",
                    showWrong && "border-danger bg-red-50 dark:bg-red-950/30",
                    !selected &&
                      !revealed &&
                      "border-border hover:bg-accent/50"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {revealed ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium">
                {isCorrect
                  ? card.correctFeedback ?? "Corretto!"
                  : card.incorrectFeedback ?? "Rileggi il concetto e riprova."}
              </p>
              {card.explanation ? (
                <p className="text-sm text-muted">{card.explanation}</p>
              ) : null}
              <Button fullWidth disabled={disabled} onClick={handleContinue}>
                Continua
              </Button>
            </div>
          ) : (
            <Button
              className="mt-4"
              fullWidth
              disabled={disabled || selectedIndex === null}
              onClick={() => setRevealed(true)}
            >
              Verifica
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="mt-4 text-sm leading-7">{question}</p>
          <Button
            className="mt-6"
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
    </Card>
  );
}

export const ImageExplainCard = memo(ImageExplainCardComponent);
