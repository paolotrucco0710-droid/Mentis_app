import type {
  BlurtingCardPayload,
  Card,
  CardPayload,
  ConnectionCardPayload,
  ErrorDetectionCardPayload,
  FeynmanCardPayload,
  ImageLabelRegion,
  QuizCardPayload,
  TrueFalseCardPayload,
} from "@/domain/entities/card";
import { CardType } from "@/domain/enums";
import type { AtomId } from "@/domain/ids";

export function isQuizPayload(
  payload: CardPayload | null
): payload is QuizCardPayload {
  return (
    payload !== null &&
    "options" in payload &&
    Array.isArray(payload.options) &&
    "correctOptionIndex" in payload &&
    typeof payload.correctOptionIndex === "number"
  );
}

export function isConnectionPayload(
  payload: CardPayload | null
): payload is ConnectionCardPayload {
  return (
    isQuizPayload(payload) &&
    "relatedAtomId" in payload &&
    typeof payload.relatedAtomId === "string" &&
    "relatedAtomTitle" in payload &&
    typeof payload.relatedAtomTitle === "string" &&
    payload.relationType === "prerequisite"
  );
}

export function getConnectionPayload(
  payload: CardPayload | null
): ConnectionCardPayload | null {
  return isConnectionPayload(payload) ? payload : null;
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

export function getImageQuestionFromPayload(
  payload: CardPayload | null
): string | null {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "question" in payload &&
    typeof payload.question === "string"
  ) {
    return payload.question;
  }

  return null;
}

export function getImageQuizOptionsFromPayload(
  payload: CardPayload | null
): { options: string[]; correctOptionIndex: number } | null {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "options" in payload &&
    Array.isArray(payload.options) &&
    "correctOptionIndex" in payload &&
    typeof payload.correctOptionIndex === "number"
  ) {
    return {
      options: payload.options.filter(
        (option): option is string => typeof option === "string"
      ),
      correctOptionIndex: payload.correctOptionIndex,
    };
  }

  return null;
}

function isImageLabelRegion(value: unknown): value is ImageLabelRegion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const region = value as ImageLabelRegion;
  return (
    typeof region.id === "string" &&
    typeof region.label === "string" &&
    typeof region.box === "object" &&
    region.box !== null &&
    typeof region.box.top === "number" &&
    typeof region.box.left === "number" &&
    typeof region.box.bottom === "number" &&
    typeof region.box.right === "number"
  );
}

export function getImageLabelingFromPayload(
  payload: CardPayload | null
): {
  regions: ImageLabelRegion[];
  correctRegionId: string;
  targetLabel?: string;
  revealText?: string;
} | null {
  if (
    payload === null ||
    typeof payload !== "object" ||
    !("mode" in payload) ||
    payload.mode !== "tap-zone" ||
    !("regions" in payload) ||
    !Array.isArray(payload.regions) ||
    !("correctRegionId" in payload) ||
    typeof payload.correctRegionId !== "string"
  ) {
    return null;
  }

  const regions = payload.regions.filter(isImageLabelRegion);
  if (regions.length < 2) {
    return null;
  }

  return {
    regions,
    correctRegionId: payload.correctRegionId,
    targetLabel:
      "targetLabel" in payload && typeof payload.targetLabel === "string"
        ? payload.targetLabel
        : undefined,
    revealText:
      "revealText" in payload && typeof payload.revealText === "string"
        ? payload.revealText
        : undefined,
  };
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
    case CardType.Connection:
      return "Collegamento";
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
  atomId?: AtomId;
  atomTitle?: string;
  imageUrl?: string | null;
  imageCaption?: string | null;
  disabled?: boolean;
  onContinue: (result: CardAnswerResult) => void;
  onSkip: () => void;
  registerAdvance?: (action: (() => void) | null) => void;
};
