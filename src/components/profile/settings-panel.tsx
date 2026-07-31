"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfileView } from "@/profile/types";
import { SessionsPanel } from "@/components/auth";
import { ApiError, fetchProfile, logout } from "@/lib/api";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Loader,
  PageHeader,
  Section,
} from "@/components/ui";
import { AccountForm } from "./account-form";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { PersonalGoalsPicker } from "./personal-goals-picker";
import { PreferencesForm } from "./preferences-form";
import { SchoolInfoForm } from "./school-info-form";

export function SettingsPanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfile();
      setProfile(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile caricare le impostazioni."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (error || !profile) {
    return <p className="text-sm text-danger">{error ?? "Impostazioni non disponibili."}</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Impostazioni"
        description="Gestisci account, preferenze e sessioni."
      />

      <Section title="Account">
        <Card>
          <AccountForm profile={profile} onUpdated={setProfile} />
        </Card>
      </Section>

      <Section title="Preferenze">
        <Card>
          <PreferencesForm profile={profile} onUpdated={setProfile} />
        </Card>
      </Section>

      <Section title="Profilo scolastico">
        <Card>
          <SchoolInfoForm profile={profile} onUpdated={setProfile} />
        </Card>
      </Section>

      <Section title="Obiettivi personali">
        <Card>
          <PersonalGoalsPicker profile={profile} onUpdated={setProfile} />
        </Card>
      </Section>

      <Section title="Sicurezza">
        <Card>
          <ChangePasswordForm />
        </Card>
      </Section>

      <Section title="Sessioni attive">
        <SessionsPanel />
      </Section>

      <Section title="Accesso">
        <Card>
          <Button
            type="button"
            variant="secondary"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "Uscita..." : "Esci"}
          </Button>
        </Card>
      </Section>

      <Section title="Zona pericolosa">
        <DeleteAccountDialog />
      </Section>

      <Section title="App">
        <Card>
          <CardHeader>
            <CardTitle>Versione</CardTitle>
            <CardDescription>Mentis MVP · Milestone 14</CardDescription>
          </CardHeader>
        </Card>
      </Section>
    </div>
  );
}
