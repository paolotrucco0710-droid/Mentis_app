import Link from "next/link";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Accedi a Mentis</CardTitle>
        <CardDescription>
          Continua il tuo percorso di studio attivo.
        </CardDescription>
      </CardHeader>
      <form className="space-y-4">
        <Input label="Email" type="email" placeholder="paolo@mentis.it" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <Button fullWidth type="button">
          Accedi
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Non hai un account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Registrati
        </Link>
      </p>
    </Card>
  );
}
