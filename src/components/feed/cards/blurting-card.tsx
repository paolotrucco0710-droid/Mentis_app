"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { RetrievalFeedback } from "@/ai/retrieval-feedback";
import { Button, Loader, TextArea } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import { ApiError, evaluateRetrievalResponse } from "@/lib/api";
import {
  buildBlurtingSteps,
  canAdvanceBlurtingStep,
  combineBlurtingAnswers,
  getBlurtingContinueLabel,
  getBlurtingStepPrompt,
  type BlurtingFlowPhase,
} from "../blurting-progressive";
import type { FeedCardProps } from "../card-utils";
import { isBlurtingPayload } from "../card-utils";
import { FeedCardHint, FeedCardSurface, FeedCardTitle } from "../feed-card-surface";
import { RetrievalFeedbackPanel } from "./retrieval-feedback-panel";

export function BlurtingCardComponent({
  card,
  atomId,
  disabled,
  onContinue,
  registerAdvance,
}: FeedCardProps) {
  const payload = isBlurtingPayload(card.payload) ? card.payload : null;
  const steps = useMemo(
    () => buildBlurtingSteps(payload?.keyPoints ?? []),
    [payload?.keyPoints]
  );
  const [phase, setPhase] = useState<BlurtingFlowPhase>("ready");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [feedback, setFeedback] = useState<RetrievalFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(() => {
    if (!feedback) {
      return;
    }

    onContinue({
      outcome: SessionEventOutcome.Success,
      isCorrect: feedback.isCorrect,
    });
  }, [feedback, onContinue]);

  useEffect(() => {
    if (!registerAdvance) {
      return;
    }

    registerAdvance(phase === "feedback" && feedback ? handleContinue : null);
    return () => registerAdvance(null);
  }, [feedback, handleContinue, phase, registerAdvance]);

  if (!payload) {
    return null;
  }

  const totalSteps = steps.length;
  const canAdvance = canAdvanceBlurtingStep(currentAnswer, stepIndex, totalSteps);

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

  function handleStart() {
    setPhase("recall");
    setStepIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setFeedback(null);
    setError(null);
  }

  function handleStepAdvance() {
    const nextAnswers = [...answers];
    nextAnswers[stepIndex] = currentAnswer;
    setAnswers(nextAnswers);

    if (stepIndex >= totalSteps - 1) {
      void handleEvaluate(
        combineBlurtingAnswers(steps, nextAnswers)
      );
      return;
    }

    setStepIndex(stepIndex + 1);
    setCurrentAnswer(nextAnswers[stepIndex + 1] ?? "");
  }

  if (phase === "ready") {
    return (
      <FeedCardSurface>
        <FeedCardTitle>Blurting</FeedCardTitle>
        <FeedCardHint>
          {payload.prompt ||
            "Richiama il concetto a mente, un passo alla volta."}
        </FeedCardHint>
        <div className="flex flex-1 flex-col justify-end">
          <Button fullWidth disabled={disabled} onClick={handleStart}>
            Inizia
          </Button>
        </div>
      </FeedCardSurface>
    );
  }

  if (phase === "feedback" && feedback) {
    return (
      <FeedCardSurface>
        <FeedCardTitle>Blurting</FeedCardTitle>
        <RetrievalFeedbackPanel feedback={feedback} />
        {!feedback.isCorrect ? (
          <div>
            <p className="text-sm font-medium">Da ricordare:</p>
            <p className="mt-1 text-sm text-muted">{payload.keyPoints[0]}</p>
          </div>
        ) : null}
        <Button fullWidth disabled={disabled} onClick={handleContinue}>
          Continua
        </Button>
      </FeedCardSurface>
    );
  }

  return (
    <FeedCardSurface>
      <FeedCardTitle>Blurting</FeedCardTitle>
      <div
        className="flex items-center gap-2"
        aria-label={`Passo ${stepIndex + 1} di ${totalSteps}`}
      >
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= stepIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
      <FeedCardHint>{getBlurtingStepPrompt(stepIndex, totalSteps)}</FeedCardHint>
      <TextArea
        label={totalSteps === 1 ? "La tua risposta" : `Punto ${stepIndex + 1}`}
        value={currentAnswer}
        onChange={(event) => setCurrentAnswer(event.target.value)}
        placeholder="Scrivi liberamente..."
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
        onClick={handleStepAdvance}
      >
        {getBlurtingContinueLabel(stepIndex, totalSteps)}
      </Button>
    </FeedCardSurface>
  );
}

export const BlurtingCard = memo(BlurtingCardComponent);
