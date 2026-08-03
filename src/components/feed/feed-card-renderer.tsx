"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import { CardType } from "@/domain/enums";
import type { AtomId } from "@/domain/ids";
import type { Card } from "@/domain/entities/card";
import { Loader } from "@/components/ui";
import type { CardAnswerResult } from "./card-utils";

const ExplainCard = dynamic(
  () => import("./cards/explain-card").then((module) => module.ExplainCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const ImageExplainCard = dynamic(
  () =>
    import("./cards/image-explain-card").then((module) => module.ImageExplainCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const QuizCard = dynamic(
  () => import("./cards/quiz-card").then((module) => module.QuizCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const TrueFalseCard = dynamic(
  () => import("./cards/true-false-card").then((module) => module.TrueFalseCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const BlurtingCard = dynamic(
  () => import("./cards/blurting-card").then((module) => module.BlurtingCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const FeynmanCard = dynamic(
  () => import("./cards/feynman-card").then((module) => module.FeynmanCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const ErrorDetectionCard = dynamic(
  () =>
    import("./cards/error-detection-card").then(
      (module) => module.ErrorDetectionCard
    ),
  { loading: () => <Loader label="Caricamento card..." /> }
);
const FallbackCard = dynamic(
  () => import("./cards/fallback-card").then((module) => module.FallbackCard),
  { loading: () => <Loader label="Caricamento card..." /> }
);

function FeedCardRendererComponent({
  card,
  atomId,
  atomTitle,
  imageUrl,
  disabled,
  onAnswer,
  onSkip,
}: {
  card: Card;
  atomId?: AtomId;
  atomTitle?: string;
  imageUrl?: string | null;
  disabled?: boolean;
  onAnswer: (result: CardAnswerResult) => void;
  onSkip: () => void;
}) {
  const props = {
    card,
    atomId,
    atomTitle,
    imageUrl,
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

export const FeedCardRenderer = memo(FeedCardRendererComponent);
