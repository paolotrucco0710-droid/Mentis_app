import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
  Section,
} from "@/components/ui";

const uploadStates = [
  "Empty",
  "File Selected",
  "Uploading",
  "Processing",
  "Completed",
  "Error",
] as const;

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Carica materiale"
        description="Aggiungi PDF o immagini di un capitolo. Mentis farà il resto."
      />

      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="rounded-full bg-accent p-4 text-primary">
            <span className="text-2xl">+</span>
          </div>
          <div className="space-y-1">
            <CardTitle>Trascina qui i file</CardTitle>
            <CardDescription>
              PDF, JPG o PNG. Fino a 50 pagine per capitolo.
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button">Seleziona file</Button>
            <Button type="button" variant="secondary">
              Usa fotocamera
            </Button>
          </div>
        </div>
      </Card>

      <Section title="Stati upload">
        <div className="flex flex-wrap gap-2">
          {uploadStates.map((state) => (
            <Badge key={state} variant="default">
              {state}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Cronologia">
        <EmptyState
          title="Nessun upload ancora"
          description="Quando caricherai il primo capitolo, lo vedrai qui con stato e progresso."
          action={<Button type="button">Importa PDF</Button>}
        />
      </Section>
    </div>
  );
}
