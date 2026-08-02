"use client";

import { memo, useState } from "react";
import type { RetrievalFeedback } from "@/ai/retrieval-feedback";
import { Button, Card, CardDescription, CardHeader, CardTitle, Loader, TextArea } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, evaluateRetrievalResponse } from "@/lib/api";
import type { FeedCardProps } from "../card-utils";
import { isFeynmanPayload } from "../card-utils";
import { RetrievalFeedbackPanel } from "./retrieval-feedback-panel";

export function FeynmanCardComponent({
  card,
  atomId,
  disabled,
  onContinue,
}: FeedCardProps) {
  const payload = isFeynmanPayload(card.payload) ? card.payload : null;
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
            <p className="text-sm font-medium">Criteri di riferimento:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
              {payload.evaluationCriteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </div>
          <Button
            fullWidth
            disabled={disabled}
            onClick={() =>
              onContinue({
                outcome: SessionEventOutcome.Neutral,
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
          disabled={disabled || evaluating || answer.trim().length < 10}
          onClick={() => void handleEvaluate()}
        >
          Valuta spiegazione
        </Button>
      )}
    </Card>
  );
}

export const FeynmanCard = memo(FeynmanCardComponent);
