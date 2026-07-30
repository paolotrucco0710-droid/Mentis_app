import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";

export function FallbackCard({ card, disabled, onContinue, onSkip }: FeedCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{card.prompt ?? "Card di studio"}</CardTitle>
        <CardDescription>Tipo: {card.type}</CardDescription>
      </CardHeader>
      <p className="text-sm leading-7">{card.text}</p>
      <div className="mt-6 flex gap-3">
        <Button
          className="flex-1"
          variant="secondary"
          disabled={disabled}
          onClick={onSkip}
        >
          Salta
        </Button>
        <Button
          className="flex-1"
          disabled={disabled}
          onClick={() =>
            onContinue({ outcome: SessionEventOutcome.Neutral, isCorrect: true })
          }
        >
          Continua
        </Button>
      </div>
    </Card>
  );
}
