"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DailyStatisticsView, UserProfileView, UserStatisticsView } from "@/profile/types";
import {
  ApiError,
  fetchDailyStatisticsHistory,
  fetchProfile,
  fetchProfileStatistics,
} from "@/lib/api";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Loader,
  PageHeader,
  Section,
  SettingsIcon,
} from "@/components/ui";
import { ProfileDailyChart } from "./profile-daily-chart";
import { ProfileHeader } from "./profile-header";
import { ProfileStatisticsSection } from "./profile-statistics-section";
import { ProfileStatsGrid } from "./profile-stats-grid";

export function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [statistics, setStatistics] = useState<UserStatisticsView | null>(null);
  const [history, setHistory] = useState<DailyStatisticsView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, statisticsData, historyData] = await Promise.all([
        fetchProfile(),
        fetchProfileStatistics(),
        fetchDailyStatisticsHistory(7),
      ]);
      setProfile(profileData);
      setStatistics(statisticsData);
      setHistory(historyData);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile caricare il profilo."
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (error || !profile || !statistics) {
    return <p className="text-sm text-danger">{error ?? "Profilo non disponibile."}</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profilo"
        description="Statistiche e riepilogo del tuo percorso."
        action={
          <Link href="/settings">
            <Button variant="secondary" type="button">
              <SettingsIcon className="h-4 w-4" />
              Impostazioni
            </Button>
          </Link>
        }
      />

      <ProfileHeader profile={profile} />
      <ProfileStatsGrid statistics={statistics} />
      <Section title="Statistiche">
        <ProfileStatisticsSection statistics={statistics} />
      </Section>
      <Section title="Andamento">
        <ProfileDailyChart history={history} />
      </Section>

      <Section title="Abbonamento">
        <Card>
          <CardHeader>
            <CardTitle>
              {profile.premiumPlan === "premium" ? "Mentis Premium" : "Mentis Free"}
            </CardTitle>
            <CardDescription>
              Funzionalità base incluse. Upgrade disponibile in futuro.
            </CardDescription>
          </CardHeader>
          <Button type="button" variant="secondary">
            Scopri Mentis Premium
          </Button>
        </Card>
      </Section>
    </div>
  );
}
