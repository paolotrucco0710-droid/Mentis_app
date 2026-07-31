"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError, requestPasswordReset } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            setMessage(null);
            setResetUrl(null);
            const result = await requestPasswordReset(email);
            setMessage(result.message);
            setResetUrl(result.resetUrl ?? null);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Richiesta non riuscita. Riprova."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="paolo@mentis.it"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface-elevated p-4 text-sm">
          <p className="text-foreground">{message}</p>
          {resetUrl ? (
            <p className="break-all text-muted">
              Link di sviluppo:{" "}
              <Link href={resetUrl} className="font-medium text-primary">
                reimposta password
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <Button fullWidth type="submit" disabled={loading}>
        {loading ? "Invio in corso..." : "Invia link di reset"}
      </Button>
    </form>
  );
}
