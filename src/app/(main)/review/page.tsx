import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/ui";

export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ripasso"
        description="Le revisioni programmate dal Review Engine compariranno qui."
        action={<Button type="button">Sincronizza revisioni</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>In scadenza</CardTitle>
            <CardDescription>0 concetti</CardDescription>
          </CardHeader>
          <Badge variant="warning">Nessuna urgenza</Badge>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In ritardo</CardTitle>
            <CardDescription>0 concetti</CardDescription>
          </CardHeader>
          <Badge variant="danger">Tutto aggiornato</Badge>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Oggi</CardTitle>
            <CardDescription>Tempo stimato: 0 min</CardDescription>
          </CardHeader>
          <ProgressBar value={0} />
        </Card>
      </div>

      <Section title="Coda revisioni">
        <EmptyState
          title="Nessuna revisione in coda"
          description="Studia qualche card per attivare il sistema di ripasso intelligente."
          action={
            <Button type="button" variant="secondary">
              Vai allo studio
            </Button>
          }
        />
      </Section>
    </div>
  );
}
