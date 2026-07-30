"use client";

import { CardType } from "@/domain/enums";
import type { CardAnswerResult, FeedCardProps } from "./card-utils";
import { BlurtingCard } from "./cards/blurting-card";
import { ErrorDetectionCard } from "./cards/error-detection-card";
import { ExplainCard } from "./cards/explain-card";
import { FallbackCard } from "./cards/fallback-card";
import { FeynmanCard } from "./cards/feynman-card";
import { ImageExplainCard } from "./cards/image-explain-card";
import { QuizCard } from "./cards/quiz-card";
import { TrueFalseCard } from "./cards/true-false-card";
import type { Card } from "@/domain/entities/card";

export function FeedCardRenderer({
  card,
  disabled,
  onAnswer,
  onSkip,
}: {
  card: Card;
  disabled?: boolean;
  onAnswer: (result: CardAnswerResult) => void;
  onSkip: () => void;
}) {
  const props: FeedCardProps = {
    card,
    disabled,
    onContinue: onAnswer,
    onSkip,
  };

  switch (card.type) {
    case CardType.Explain:
      return <ExplainCard {...props} />;
    case CardType.ImageExplain:
      return <ImageExplainCard {...props} />;
    case CardType.Quiz:
    case CardType.MultipleChoice:
      return <QuizCard {...props} />;
    case CardType.TrueFalse:
      return <TrueFalseCard {...props} />;
    case CardType.Blurting:
      return <BlurtingCard {...props} />;
    case CardType.Feynman:
      return <FeynmanCard {...props} />;
    case CardType.ErrorDetection:
      return <ErrorDetectionCard {...props} />;
    default:
      return <FallbackCard {...props} />;
  }
}
