"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError, login } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") ?? "/home";

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            await login({ email, password });
            router.push(nextPath.startsWith("/") ? nextPath : "/home");
            router.refresh();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Accesso non riuscito. Riprova."
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
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary">
          Password dimenticata?
        </Link>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button fullWidth type="submit" disabled={loading}>
        {loading ? "Accesso in corso..." : "Accedi"}
      </Button>
    </form>
  );
}
