import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  ProgressBar,
  Section,
  SettingsIcon,
} from "@/components/ui";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Profilo"
        description="Statistiche e impostazioni del tuo account."
        action={
          <Link href="/settings">
            <Button variant="secondary" type="button">
              <SettingsIcon className="h-4 w-4" />
              Impostazioni
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name="Paolo Dev" className="h-16 w-16 text-lg" />
          <div>
            <h2 className="text-xl font-semibold">Paolo Dev</h2>
            <p className="text-sm text-muted">paolo.dev@mentis.local</p>
            <Badge className="mt-2" variant="accent">
              Piano Free
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Streak</CardTitle>
            <CardDescription>3 giorni consecutivi</CardDescription>
          </CardHeader>
          <ProgressBar value={30} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mastery media</CardTitle>
            <CardDescription>Su tutte le materie</CardDescription>
          </CardHeader>
          <ProgressBar value={0} />
        </Card>
      </div>

      <Section title="Abbonamento">
        <Card>
          <CardHeader>
            <CardTitle>Mentis Free</CardTitle>
            <CardDescription>
              Funzionalità base incluse. Upgrade disponibile in futuro.
            </CardDescription>
          </CardHeader>
          <Button type="button" variant="secondary">
            Scopri Mentis Premium
          </Button>
        </Card>
      </Section>
    </div>
  );
}
