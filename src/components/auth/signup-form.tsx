"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError, register } from "@/lib/api";

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            await register({ firstName, email, password });
            router.push("/onboarding");
            router.refresh();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Registrazione non riuscita. Riprova."
            );
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      <Input
        label="Nome"
        name="firstName"
        autoComplete="given-name"
        placeholder="Paolo"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        required
      />
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
      <Input
        label="Password"
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
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button fullWidth type="submit" disabled={loading}>
        {loading ? "Registrazione..." : "Registrati"}
      </Button>
    </form>
  );
}
