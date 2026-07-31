"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserProfileView } from "@/profile/types";
import { StorageAvatar } from "@/components/storage/storage-avatar";
import { Avatar, Button } from "@/components/ui";
import { ApiError, fetchProfile, logout } from "@/lib/api";

export function UserMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchProfile();
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          setProfile(null);
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

  if (!profile) {
    return (
      <Link href="/login" className="text-sm font-medium text-primary">
        Accedi
      </Link>
    );
  }

  const displayName = profile.firstName || profile.email;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="hidden text-sm text-muted sm:inline">
        Ciao, {displayName}
      </span>
      <Link href="/settings" aria-label="Impostazioni account">
        {profile.profileImageUrl ? (
          <StorageAvatar
            name={`${profile.firstName} ${profile.lastName}`.trim() || profile.email}
            imageRef={profile.profileImageUrl}
            className="h-9 w-9 text-xs"
          />
        ) : (
          <Avatar
            name={`${profile.firstName} ${profile.lastName}`.trim() || profile.email}
            className="h-9 w-9 text-xs"
          />
        )}
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
