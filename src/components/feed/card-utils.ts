import type {
  BlurtingCardPayload,
  Card,
  CardPayload,
  ErrorDetectionCardPayload,
  FeynmanCardPayload,
  QuizCardPayload,
  TrueFalseCardPayload,
} from "@/domain/entities/card";
import { CardType } from "@/domain/enums";

export function isQuizPayload(
  payload: CardPayload | null
): payload is QuizCardPayload {
  return (
    payload !== null &&
    "options" in payload &&
    Array.isArray(payload.options) &&
    "correctOptionIndex" in payload
  );
}

export function isTrueFalsePayload(
  payload: CardPayload | null
): payload is TrueFalseCardPayload {
  return (
    payload !== null &&
    "statement" in payload &&
    "correctAnswer" in payload
  );
}

export function isBlurtingPayload(
  payload: CardPayload | null
): payload is BlurtingCardPayload {
  return (
    payload !== null &&
    "prompt" in payload &&
    "keyPoints" in payload &&
    Array.isArray(payload.keyPoints)
  );
}

export function isFeynmanPayload(
  payload: CardPayload | null
): payload is FeynmanCardPayload {
  return (
    payload !== null &&
    "prompt" in payload &&
    "evaluationCriteria" in payload &&
    Array.isArray(payload.evaluationCriteria)
  );
}

export function isErrorDetectionPayload(
  payload: CardPayload | null
): payload is ErrorDetectionCardPayload {
  return (
    payload !== null &&
    "text" in payload &&
    "correction" in payload
  );
}

export function getImageIdFromPayload(
  payload: CardPayload | null
): string | null {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "imageId" in payload &&
    typeof payload.imageId === "string"
  ) {
    return payload.imageId;
  }

  return null;
}

export function getCardTypeLabel(type: CardType): string {
  switch (type) {
    case CardType.Explain:
      return "Spiegazione";
    case CardType.ImageExplain:
      return "Immagine";
    case CardType.Quiz:
    case CardType.MultipleChoice:
      return "Quiz";
    case CardType.TrueFalse:
      return "Vero o falso";
    case CardType.Blurting:
      return "Blurting";
    case CardType.Feynman:
      return "Feynman";
    case CardType.ErrorDetection:
      return "Trova l'errore";
    default:
      return "Card";
  }
}

export interface CardAnswerResult {
  outcome: import("@/domain/enums").SessionEventOutcome;
  isCorrect?: boolean;
}

export type FeedCardProps = {
  card: Card;
  disabled?: boolean;
  onContinue: (result: CardAnswerResult) => void;
  onSkip: () => void;
};
