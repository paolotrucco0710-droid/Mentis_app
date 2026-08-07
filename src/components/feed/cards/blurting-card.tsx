"use client";

import { memo, useCallback, useEffect, useState } from "react";
import type { RetrievalFeedback } from "@/ai/retrieval-feedback";
import { Button, Loader } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, evaluateRetrievalResponse } from "@/lib/api";
import {
  combineBlurtingAnswers,
  getBlurtingContinueLabel,
  getBlurtingStepPrompt,
  type BlurtingFlowPhase,
} from "../blurting-progressive";
import type { FeedCardProps } from "../card-utils";
import { isBlurtingPayload } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";
import { RetrievalVoiceInput } from "../retrieval-voice-input";
import { RetrievalFeedbackPanel } from "./retrieval-feedback-panel";

export function BlurtingCardComponent({
  card,
  atomId,
  disabled,
  onContinue,
  registerAdvance,
}: FeedCardProps) {
  const payload = isBlurtingPayload(card.payload) ? card.payload : null;
  const [phase, setPhase] = useState<BlurtingFlowPhase>("ready");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<RetrievalFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recallPrompt = payload?.prompt ?? "";

  const handleContinue = useCallback(() => {
    if (!feedback) {
      return;
    }

    onContinue({
      outcome: SessionEventOutcome.Success,
      isCorrect: feedback.isCorrect,
    });
  }, [feedback, onContinue]);

  const handleStart = useCallback(() => {
    setPhase("recall");
    setAnswer("");
    setFeedback(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!registerAdvance) {
      return;
    }

    if (phase === "feedback" && feedback) {
      registerAdvance(handleContinue);
      return () => registerAdvance(null);
    }

    if (phase === "ready") {
      registerAdvance(handleStart);
      return () => registerAdvance(null);
    }

    registerAdvance(null);
    return () => registerAdvance(null);
  }, [feedback, handleContinue, handleStart, phase, registerAdvance]);

  if (!payload) {
    return null;
  }

  const canAdvance = answer.trim().length >= 5;

  async function handleEvaluate(combinedAnswer: string) {
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
        userAnswer: combinedAnswer,
      });
      setFeedback(result);
      setPhase("feedback");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Valutazione non riuscita. Riprova."
      );
    } finally {
      setEvaluating(false);
    }
  }

  if (phase === "ready") {
    return (
      <FeedCardSurface>
        <FeedCardTitle>Blurting</FeedCardTitle>
        <FeedCardHint>
          {recallPrompt || "Richiama il concetto a mente. Scorri su quando sei pronto."}
        </FeedCardHint>
      </FeedCardSurface>
    );
  }

  if (phase === "feedback" && feedback) {
    return (
      <FeedCardSurface>
        <FeedCardTitle>Blurting</FeedCardTitle>
        <RetrievalFeedbackPanel feedback={feedback} />
        {!feedback.isCorrect && payload.keyPoints.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Punti di riferimento:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
              {payload.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </FeedCardSurface>
    );
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>Blurting</FeedCardTitle>
      <FeedCardHint>{getBlurtingStepPrompt(recallPrompt)}</FeedCardHint>
      <RetrievalVoiceInput
        label="La tua risposta"
        value={answer}
        onChange={setAnswer}
        placeholder="Scrivi o parla liberamente..."
        disabled={disabled || evaluating}
      />
      {evaluating ? (
        <div className="mt-2">
          <Loader label="Valutazione in corso..." />
        </div>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        className="mt-2"
        fullWidth
        disabled={disabled || evaluating || !canAdvance}
        onClick={() => void handleEvaluate(combineBlurtingAnswers([answer]))}
      >
        {getBlurtingContinueLabel()}
      </Button>
    </FeedCardSurface>
  );
}

export const BlurtingCard = memo(BlurtingCardComponent);
