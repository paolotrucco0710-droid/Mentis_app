import { SessionsPanel, SettingsAccount } from "@/components/auth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Section,
} from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Impostazioni"
        description="Gestisci account, sessioni e preferenze di studio."
      />

      <Section title="Account">
        <SettingsAccount />
      </Section>

      <Section title="Sessioni attive">
        <SessionsPanel />
      </Section>

      <Section title="App">
        <Card>
          <CardHeader>
            <CardTitle>Versione</CardTitle>
            <CardDescription>Mentis MVP · Milestone 13</CardDescription>
          </CardHeader>
        </Card>
      </Section>
    </div>
  );
}
