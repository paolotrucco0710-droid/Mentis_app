import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Loader,
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/ui";

const pipelineSteps = [
  "Upload",
  "OCR",
  "Parsing",
  "Atomizzazione",
  "Knowledge Graph",
  "Generazione Card",
  "Validazione",
  "Indicizzazione",
  "Completato",
];

export default function ProcessingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Elaborazione in corso"
        description="La pipeline AI sta trasformando il capitolo in atoms e card."
      />

      <Card>
        <CardHeader>
          <CardTitle>Capitolo: Introduzione</CardTitle>
          <CardDescription>
            Stato attuale: Atomizzazione. Nessun avanzamento simulato.
          </CardDescription>
        </CardHeader>
        <ProgressBar value={45} label="Progresso pipeline" />
        <div className="mt-6">
          <Loader label="Elaborazione attiva..." />
        </div>
      </Card>

      <Section title="Pipeline AI">
        <div className="grid gap-3 sm:grid-cols-2">
          {pipelineSteps.map((step, index) => (
            <Card
              key={step}
              className={index < 4 ? "border-primary/30 bg-accent/40" : ""}
            >
              <CardDescription className="font-medium text-foreground">
                {index + 1}. {step}
              </CardDescription>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
