"use client";

import { useEffect, useState } from "react";
import type { PublicUser } from "@/auth/types";
import { Button, Card, Input, Loader } from "@/components/ui";
import { ApiError, fetchCurrentUser, logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export function SettingsAccount() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchCurrentUser();
        if (!cancelled) {
          setUser(result.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Impossibile caricare il profilo."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <Card className="flex justify-center py-10">
        <Loader />
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card>
        <p className="text-sm text-danger">
          {error ?? "Profilo non disponibile."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <Input label="Nome" value={user.firstName} readOnly />
      <Input label="Cognome" value={user.lastName || "—"} readOnly />
      <Input label="Email" value={user.email} readOnly />
      <p className="text-xs text-muted">
        La modifica del profilo sarà disponibile nella prossima milestone.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        {loggingOut ? "Uscita..." : "Esci"}
      </Button>
    </Card>
  );
}
