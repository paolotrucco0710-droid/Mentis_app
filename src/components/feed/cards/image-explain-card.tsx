import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { SessionEventOutcome } from "@/domain/enums";
import type { FeedCardProps } from "../card-utils";

export function ImageExplainCard({ card, disabled, onContinue }: FeedCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{card.prompt ?? "Concetto visivo"}</CardTitle>
        <CardDescription>Studia il contenuto e collega ciò che vedi al concetto.</CardDescription>
      </CardHeader>
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-accent/40 text-sm text-muted">
        Immagine del concetto
      </div>
      <p className="mt-4 text-sm leading-7">{card.text}</p>
      {card.explanation ? (
        <p className="mt-3 rounded-xl bg-accent/60 p-4 text-sm text-muted">
          {card.explanation}
        </p>
      ) : null}
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
