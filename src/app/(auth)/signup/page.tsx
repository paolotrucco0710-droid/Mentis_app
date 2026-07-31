import Link from "next/link";
import { SignupForm } from "@/components/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function SignupPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Crea il tuo account</CardTitle>
        <CardDescription>
          Inizia a studiare con un percorso personalizzato.
        </CardDescription>
      </CardHeader>
      <SignupForm />
      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Accedi
        </Link>
      </p>
    </Card>
  );
}
