import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function LoginPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Accedi a Mentis</CardTitle>
        <CardDescription>
          Continua il tuo percorso di studio attivo.
        </CardDescription>
      </CardHeader>
      <Suspense fallback={<p className="text-sm text-muted">Caricamento...</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-5 text-center text-sm text-muted">
        Non hai un account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Registrati
        </Link>
      </p>
    </Card>
  );
}
