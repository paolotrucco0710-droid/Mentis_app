"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle, TextArea } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";
import { isBlurtingPayload } from "../card-utils";

export function BlurtingCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const payload = isBlurtingPayload(card.payload) ? card.payload : null;
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (!payload) {
    return null;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Blurting</CardTitle>
        <CardDescription>
          {payload.prompt || "Scrivi tutto ciò che ricordi senza guardare gli appunti."}
        </CardDescription>
      </CardHeader>
      <TextArea
        label="La tua risposta"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Scrivi liberamente..."
        disabled={disabled || revealed}
      />
      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Punti chiave da ricordare:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {payload.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({
                outcome: SessionEventOutcome.Success,
                isCorrect: answer.trim().length > 20,
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
          disabled={disabled || answer.trim().length < 5}
          onClick={() => setRevealed(true)}
        >
          Mostra punti chiave
        </Button>
      )}
    </Card>
  );
}

export const BlurtingCard = memo(BlurtingCardComponent);
