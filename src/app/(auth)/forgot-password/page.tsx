import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Recupera password</CardTitle>
        <CardDescription>
          Inserisci la tua email per ricevere un link di reset.
        </CardDescription>
      </CardHeader>
      <ForgotPasswordForm />
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-primary">
          Torna al login
        </Link>
      </p>
    </Card>
  );
}
