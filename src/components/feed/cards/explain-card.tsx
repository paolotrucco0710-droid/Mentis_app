"use client";

import { memo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import type { FeedCardProps } from "../card-utils";
import { SessionEventOutcome } from "@/domain/enums";

function hasExpandableExplanation(card: FeedCardProps["card"]): boolean {
  const summary = card.text?.trim() ?? "";
  const explanation = card.explanation?.trim() ?? "";

  return explanation.length > 0 && explanation !== summary;
}

function ExplainCardComponent({ card, disabled, onContinue }: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = hasExpandableExplanation(card);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{card.prompt ?? "Spiegazione"}</CardTitle>
        <CardDescription>
          Fissa l&apos;idea in una frase. Approfondisci solo se ti serve.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4 text-sm leading-7 text-foreground">
        <p className="text-lg font-medium leading-8">{card.text}</p>
        {canExpand && !expanded ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={disabled}
            onClick={() => setExpanded(true)}
          >
            Approfondisci
          </Button>
        ) : null}
        {canExpand && expanded ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-accent/60 p-4 text-muted">
              {card.explanation}
            </p>
            <Button
              variant="ghost"
              fullWidth
              disabled={disabled}
              onClick={() => setExpanded(false)}
            >
              Mostra solo il riassunto
            </Button>
          </div>
        ) : null}
      </div>
      <Button
        className="mt-6"
        fullWidth
        disabled={disabled}
        onClick={() =>
          onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
        }
      >
        Ho capito
      </Button>
    </Card>
  );
}

export const ExplainCard = memo(ExplainCardComponent);
