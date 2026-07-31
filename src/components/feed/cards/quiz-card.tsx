"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { cn } from "@/lib/utils";
import type { FeedCardProps } from "../card-utils";
import { isQuizPayload } from "../card-utils";

export function QuizCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isQuizPayload(card.payload) ? card.payload : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!payload) {
    return null;
  }

  const isCorrect = selectedIndex === payload.correctOptionIndex;

  function handleSubmit() {
    if (selectedIndex === null) {
      return;
    }

    setRevealed(true);
  }

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
        <CardTitle>{payload.question}</CardTitle>
        <CardDescription>Scegli la risposta corretta.</CardDescription>
      </CardHeader>
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
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                selected && !revealed && "border-primary bg-accent",
                showCorrect && "border-success bg-green-50 dark:bg-green-950/30",
                showWrong && "border-danger bg-red-50 dark:bg-red-950/30",
                !selected && !revealed && "border-border hover:bg-accent/50"
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
            {isCorrect ? card.correctFeedback ?? "Corretto!" : card.incorrectFeedback ?? "Riprova la prossima volta."}
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
          className="mt-6"
          fullWidth
          disabled={disabled || selectedIndex === null}
          onClick={handleSubmit}
        >
          Verifica risposta
        </Button>
      )}
    </Card>
  );
}

export const QuizCard = memo(QuizCardComponent);
