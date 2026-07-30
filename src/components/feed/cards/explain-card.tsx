import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import type { FeedCardProps } from "../card-utils";
import { SessionEventOutcome } from "@/domain/enums";

export function ExplainCard({ card, disabled, onContinue }: FeedCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{card.prompt ?? "Spiegazione"}</CardTitle>
        <CardDescription>Leggi con attenzione, poi continua.</CardDescription>
      </CardHeader>
      <div className="space-y-4 text-sm leading-7 text-foreground">
        <p className="text-base font-medium">{card.text}</p>
        {card.explanation ? (
          <p className="rounded-xl bg-accent/60 p-4 text-muted">
            {card.explanation}
          </p>
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
