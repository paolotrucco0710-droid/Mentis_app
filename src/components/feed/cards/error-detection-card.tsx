"use client";

import { useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { isErrorDetectionPayload } from "../card-utils";

export function ErrorDetectionCard({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isErrorDetectionPayload(card.payload) ? card.payload : null;
  const [revealed, setRevealed] = useState(false);
  const [foundError, setFoundError] = useState<boolean | null>(null);

  if (!payload) {
    return null;
  }

  const isCorrect = foundError === (payload.errorIndices.length > 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Trova l&apos;errore</CardTitle>
        <CardDescription>Individua cosa non va nel testo seguente.</CardDescription>
      </CardHeader>
      <p className="rounded-xl border border-border bg-surface p-4 text-sm leading-7">
        {payload.text}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant={foundError === true ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => setFoundError(true)}
        >
          Ho trovato un errore
        </Button>
        <Button
          variant={foundError === false ? "primary" : "secondary"}
          disabled={disabled || revealed}
          onClick={() => setFoundError(false)}
        >
          Sembra corretto
        </Button>
      </div>
      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Correzione:</p>
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
      ) : (
        <Button
          className="mt-6"
          fullWidth
          disabled={disabled || foundError === null}
          onClick={() => setRevealed(true)}
        >
          Mostra correzione
        </Button>
      )}
    </Card>
  );
}
