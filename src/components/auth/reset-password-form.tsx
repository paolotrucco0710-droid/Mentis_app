"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError, resetPassword } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-danger">
          Link non valido o scaduto. Richiedi un nuovo reset password.
        </p>
        <Link href="/forgot-password" className="font-medium text-primary">
          Richiedi nuovo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          Password aggiornata. Ora puoi accedere con le nuove credenziali.
        </p>
        <Link href="/login" className="font-medium text-primary">
          Vai al login
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
          setError("Le password non coincidono.");
          return;
        }
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            await resetPassword({ token, password });
            setDone(true);
            router.refresh();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Reset non riuscito. Riprova."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Nuova password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••"
        hint="Almeno 8 caratteri"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        required
      />
      <Input
        label="Conferma password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        minLength={8}
        required
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button fullWidth type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Reimposta password"}
      </Button>
    </form>
  );
}
