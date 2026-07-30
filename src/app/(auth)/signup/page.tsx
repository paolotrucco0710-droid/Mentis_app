import Link from "next/link";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

export default function SignupPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Crea il tuo account</CardTitle>
        <CardDescription>
          Inizia a studiare con un percorso personalizzato.
        </CardDescription>
      </CardHeader>
      <form className="space-y-4">
        <Input label="Nome" placeholder="Paolo" />
        <Input label="Email" type="email" placeholder="paolo@mentis.it" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <Button fullWidth type="button">
          Registrati
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Accedi
        </Link>
      </p>
    </Card>
  );
}
