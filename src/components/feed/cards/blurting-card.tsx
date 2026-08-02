"use client";

import { memo, useState } from "react";
import type { RetrievalFeedback } from "@/ai/retrieval-feedback";
import { Button, Card, CardDescription, CardHeader, CardTitle, Loader, TextArea } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, evaluateRetrievalResponse } from "@/lib/api";
import type { FeedCardProps } from "../card-utils";
import { isBlurtingPayload } from "../card-utils";
import { RetrievalFeedbackPanel } from "./retrieval-feedback-panel";

export function BlurtingCardComponent({
  card,
  atomId,
  disabled,
  onContinue,
}: FeedCardProps) {
  const payload = isBlurtingPayload(card.payload) ? card.payload : null;
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<RetrievalFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payload) {
    return null;
  }

  async function handleEvaluate() {
    if (!atomId) {
      setError("Contesto del concetto mancante. Ricarica la pagina.");
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const result = await evaluateRetrievalResponse({
        atomId,
        cardId: card.id,
        userAnswer: answer,
      });
      setFeedback(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Valutazione non riuscita. Riprova."
      );
    } finally {
      setEvaluating(false);
    }
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
        disabled={disabled || evaluating || feedback !== null}
      />
      {evaluating ? (
        <div className="mt-4">
          <Loader label="Valutazione in corso..." />
        </div>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-danger">{error}</p>
      ) : null}
      {feedback ? (
        <div className="mt-4 space-y-4">
          <RetrievalFeedbackPanel feedback={feedback} />
          <div>
            <p className="text-sm font-medium">Punti chiave da ricordare:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
              {payload.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({
                outcome: SessionEventOutcome.Success,
                isCorrect: feedback.isCorrect,
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
          disabled={disabled || evaluating || answer.trim().length < 5}
          onClick={() => void handleEvaluate()}
        >
          Valuta risposta
        </Button>
      )}
    </Card>
  );
}

export const BlurtingCard = memo(BlurtingCardComponent);
