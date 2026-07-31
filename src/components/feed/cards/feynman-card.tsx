"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle, TextArea } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { isFeynmanPayload } from "../card-utils";

export function FeynmanCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isFeynmanPayload(card.payload) ? card.payload : null;
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (!payload) {
    return null;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Tecnica Feynman</CardTitle>
        <CardDescription>
          {payload.prompt || "Spiega il concetto come se lo stessi insegnando a un amico."}
        </CardDescription>
      </CardHeader>
      <TextArea
        label="La tua spiegazione"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Usa parole semplici..."
        disabled={disabled || revealed}
      />
      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Criteri di valutazione:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {payload.evaluationCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({
                outcome: SessionEventOutcome.Neutral,
                isCorrect: answer.trim().length > 30,
              })
            }
          >
            Continua
          </Button>
        </div>
      ) : (
        <Button
          className="mt-4"
          fullWidth
          disabled={disabled || answer.trim().length < 10}
          onClick={() => setRevealed(true)}
        >
          Valuta spiegazione
        </Button>
      )}
    </Card>
  );
}

export const FeynmanCard = memo(FeynmanCardComponent);
