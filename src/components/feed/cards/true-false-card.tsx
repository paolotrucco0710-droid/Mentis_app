"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { cn } from "@/lib/utils";
import type { FeedCardProps } from "../card-utils";
import { isTrueFalsePayload } from "../card-utils";

export function TrueFalseCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isTrueFalsePayload(card.payload) ? card.payload : null;
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!payload) {
    return null;
  }

  const isCorrect = answer === payload.correctAnswer;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Vero o falso?</CardTitle>
        <CardDescription>Valuta l&apos;affermazione.</CardDescription>
      </CardHeader>
      <p className="rounded-xl bg-accent/50 p-4 text-base leading-7">
        {payload.statement}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const label = value ? "Vero" : "Falso";
          const selected = answer === value;
          const showCorrect = revealed && value === payload.correctAnswer;
          const showWrong = revealed && selected && !isCorrect;

          return (
            <button
              key={label}
              type="button"
              disabled={disabled || revealed}
              onClick={() => setAnswer(value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                selected && !revealed && "border-primary bg-accent",
                showCorrect && "border-success bg-green-50 dark:bg-green-950/30",
                showWrong && "border-danger bg-red-50 dark:bg-red-950/30",
                !selected && !revealed && "border-border hover:bg-accent/50"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">
            {isCorrect ? "Esatto!" : "Non proprio."}
          </p>
          {card.explanation ? (
            <p className="text-sm text-muted">{card.explanation}</p>
          ) : null}
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({
                outcome: isCorrect
                  ? SessionEventOutcome.Success
                  : SessionEventOutcome.Failure,
                isCorrect,
              })
            }
          >
            Continua
          </Button>
        </div>
      ) : (
        <Button
          className="mt-6"
          fullWidth
          disabled={disabled || answer === null}
          onClick={() => setRevealed(true)}
        >
          Verifica
        </Button>
      )}
    </Card>
  );
}

export const TrueFalseCard = memo(TrueFalseCardComponent);
