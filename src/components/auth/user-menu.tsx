"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicUser } from "@/auth/types";
import { Avatar, Button } from "@/components/ui";
import { ApiError, fetchCurrentUser, logout } from "@/lib/api";

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchCurrentUser();
        if (!cancelled) {
          setUser(result.user);
        }
      } catch (err) {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          setUser(null);
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
    return <span className="hidden text-sm text-muted sm:inline">...</span>;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-primary">
        Accedi
      </Link>
    );
  }

  const displayName = user.firstName || user.email;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="hidden text-sm text-muted sm:inline">
        Ciao, {displayName}
      </span>
      <Link href="/settings" aria-label="Impostazioni account">
        <Avatar
          name={`${user.firstName} ${user.lastName}`.trim() || user.email}
          className="h-9 w-9 text-xs"
        />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        {loggingOut ? "Uscita..." : "Esci"}
      </Button>
    </div>
  );
}
