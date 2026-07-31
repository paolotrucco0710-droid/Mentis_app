import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Reimposta password</CardTitle>
        <CardDescription>
          Scegli una nuova password per il tuo account.
        </CardDescription>
      </CardHeader>
      <Suspense fallback={<p className="text-sm text-muted">Caricamento...</p>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-primary">
          Torna al login
        </Link>
      </p>
    </Card>
  );
}
