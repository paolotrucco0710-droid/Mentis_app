import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FlameIcon,
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
          Continua da dove hai lasciato, gestisci il materiale o avvia una nuova
          sessione di studio.
        </p>
      </section>

      <Card className="bg-gradient-to-br from-accent to-surface">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Continua a studiare</CardTitle>
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="h-3.5 w-3.5" />
                Studio attivo
              </span>
            </Badge>
          </div>
          <CardDescription>
            Riprendi il feed o organizza capitoli e materie nella libreria.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/feed" className="sm:flex-1">
            <Button fullWidth>Riprendi sessione</Button>
          </Link>
          <Link href="/library" className="sm:flex-1">
            <Button fullWidth variant="secondary">
              Apri libreria
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>La tua libreria</CardTitle>
            <CardDescription>
              Materie, capitoli, upload ed eliminazione materiale.
            </CardDescription>
          </CardHeader>
          <Link href="/library">
            <Button variant="secondary">Gestisci materiale</Button>
          </Link>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carica un capitolo</CardTitle>
            <CardDescription>
              PDF o immagini: Mentis crea atoms e card automaticamente.
            </CardDescription>
          </CardHeader>
          <Link href="/upload">
            <Button variant="secondary">Vai all&apos;upload</Button>
          </Link>
        </Card>
      </div>

      <Section title="Accesso rapido">
        <div className="flex flex-wrap gap-3">
          <Link href="/search">
            <Button variant="ghost">Cerca nella libreria</Button>
          </Link>
          <Link href="/upload">
            <Button variant="ghost">Upload</Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}
