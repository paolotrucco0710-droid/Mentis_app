import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Section,
  TextArea,
} from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Impostazioni"
        description="Personalizza lingua, obiettivi e preferenze di studio."
      />

      <Section title="Account">
        <Card className="space-y-4">
          <Input label="Nome" defaultValue="Paolo" />
          <Input label="Email" defaultValue="paolo.dev@mentis.local" />
          <Button type="button">Salva modifiche</Button>
        </Card>
      </Section>

      <Section title="Studio">
        <Card className="space-y-4">
          <Input
            label="Obiettivo giornaliero (minuti)"
            type="number"
            defaultValue="30"
          />
          <TextArea
            label="Obiettivi personali"
            defaultValue="Preparare i compiti e migliorare il ripasso."
          />
        </Card>
      </Section>

      <Section title="App">
        <Card>
          <CardHeader>
            <CardTitle>Versione</CardTitle>
            <CardDescription>Mentis MVP · Milestone 10</CardDescription>
          </CardHeader>
        </Card>
      </Section>
    </div>
  );
}
