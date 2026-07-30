import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FlameIcon,
  ProgressBar,
  Section,
} from "@/components/ui";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="accent">Obiettivo giornaliero</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Cosa devi fare adesso?
        </h1>
        <p className="max-w-2xl text-muted">
          Continua da dove hai lasciato e mantieni vivo lo streak di studio.
        </p>
      </section>

      <Card className="bg-gradient-to-br from-accent to-surface">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Continua a studiare</CardTitle>
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="h-3.5 w-3.5" />3 giorni
              </span>
            </Badge>
          </div>
          <CardDescription>
            Materia consigliata: Generale. Ultima sessione ieri sera.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/feed" className="sm:flex-1">
            <Button fullWidth>Riprendi sessione</Button>
          </Link>
          <Link href="/upload" className="sm:flex-1">
            <Button fullWidth variant="secondary">
              Carica materiale
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progresso giornaliero</CardTitle>
            <CardDescription>12 minuti su 30 minuti</CardDescription>
          </CardHeader>
          <ProgressBar value={40} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Livello attuale</CardTitle>
            <CardDescription>XP 1.240 · Prossimo livello a 1.500</CardDescription>
          </CardHeader>
          <ProgressBar value={62} />
        </Card>
      </div>

      <Section title="Attività recenti">
        <Card>
          <CardDescription>
            Nessuna attività recente. Avvia una sessione per vedere qui i tuoi
            progressi.
          </CardDescription>
        </Card>
      </Section>
    </div>
  );
}
