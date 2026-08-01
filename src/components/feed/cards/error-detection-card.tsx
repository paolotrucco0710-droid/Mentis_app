"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { normalizeErrorDetectionStatement } from "@/ai/error-detection-options";
import type { FeedCardProps } from "../card-utils";
import { isErrorDetectionPayload } from "../card-utils";

export function ErrorDetectionCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isErrorDetectionPayload(card.payload) ? card.payload : null;
  const [foundError, setFoundError] = useState<boolean | null>(null);

  if (!payload) {
    return null;
  }

  const displayText = normalizeErrorDetectionStatement(payload.text);
  const expectsError = payload.hasError ?? payload.errorIndices.length > 0;
  const revealed = foundError !== null;
  const isCorrect = revealed && foundError === expectsError;

  function handleChoice(choice: boolean) {
    if (disabled || revealed) {
      return;
    }

    setFoundError(choice);
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Trova l&apos;errore</CardTitle>
        <CardDescription>
          Leggi l&apos;affermazione: contiene un errore fattuale o è corretta?
        </CardDescription>
      </CardHeader>
      <p className="rounded-xl border border-border bg-surface p-4 text-sm leading-7">
        {displayText}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant={foundError === true ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => handleChoice(true)}
        >
          C&apos;è un errore
        </Button>
        <Button
          variant={foundError === false ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => handleChoice(false)}
        >
          È corretta
        </Button>
      </div>
      {revealed ? (
        <div className="mt-4 space-y-3">
          <p
            className={`text-sm font-medium ${
              isCorrect ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {isCorrect
              ? "Risposta corretta."
              : expectsError
                ? "In questo testo c'è un errore: la risposta giusta era «C'è un errore»."
                : "Il testo era corretto: la risposta giusta era «È corretta»."}
          </p>
          <p className="text-sm font-medium">Spiegazione:</p>
          <p className="rounded-xl bg-accent/60 p-4 text-sm text-muted">
            {payload.correction}
          </p>
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
      ) : null}
    </Card>
  );
}

export const ErrorDetectionCard = memo(ErrorDetectionCardComponent);
