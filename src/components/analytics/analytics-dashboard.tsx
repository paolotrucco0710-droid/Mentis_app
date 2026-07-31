"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AIUsageInsightView,
  AnalyticsErrorView,
  AnalyticsOverviewView,
  LearningMetricsView,
  OnboardingFunnelView,
  StudyTimeInsightView,
} from "@/analytics";
import {
  ApiError,
  fetchAIUsageInsights,
  fetchAnalyticsErrors,
  fetchAnalyticsOverview,
  fetchLearningMetrics,
  fetchOnboardingFunnel,
  fetchStudyTimeInsights,
} from "@/lib/api";
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Loader,
  PageHeader,
  ProgressBar,
  Section,
  Button,
} from "@/components/ui";

function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverviewView | null>(null);
  const [funnel, setFunnel] = useState<OnboardingFunnelView | null>(null);
  const [learning, setLearning] = useState<LearningMetricsView | null>(null);
  const [studyTime, setStudyTime] = useState<StudyTimeInsightView | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageInsightView | null>(null);
  const [errors, setErrors] = useState<AnalyticsErrorView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        overviewData,
        funnelData,
        learningData,
        studyTimeData,
        aiUsageData,
        errorsData,
      ] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchOnboardingFunnel(),
        fetchLearningMetrics(),
        fetchStudyTimeInsights(),
        fetchAIUsageInsights(),
        fetchAnalyticsErrors(),
      ]);
      setOverview(overviewData);
      setFunnel(funnelData);
      setLearning(learningData);
      setStudyTime(studyTimeData);
      setAiUsage(aiUsageData);
      setErrors(errorsData);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile caricare le analytics."
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
    return <Loader label="Caricamento analytics..." />;
  }

  if (error || !overview || !funnel || !learning || !studyTime || !aiUsage) {
    return (
      <EmptyState
        title="Analytics non disponibili"
        description={error ?? "Dati non disponibili."}
        action={<Button onClick={() => void load()}>Riprova</Button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Eventi, funnel, tempo di studio, utilizzo AI e metriche di apprendimento."
      />

      <Section title="Panoramica">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Eventi tracciati</CardDescription>
              <CardTitle>{overview.totalEvents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Tempo di studio</CardDescription>
              <CardTitle>{formatMinutes(overview.studyTimeMs)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Card completate</CardDescription>
              <CardTitle>{overview.cardsCompleted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Accuratezza media</CardDescription>
              <CardTitle>{overview.accuracyPercent}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Funnel onboarding">
        <Card>
          <CardHeader>
            <CardTitle>Completamento {funnel.completionRate}%</CardTitle>
            <CardDescription>
              Percorso da registrazione alla prima elaborazione AI.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {funnel.steps.map((step) => (
              <div key={step.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{step.label}</span>
                  <Badge variant={step.completed ? "success" : "default"}>
                    {step.completed ? "Completato" : "In attesa"}
                  </Badge>
                </div>
                <ProgressBar value={step.completed ? 100 : 0} />
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Metriche apprendimento">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Atomi padroneggiati</CardDescription>
              <CardTitle>{learning.masteredAtoms}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>In corso</CardDescription>
              <CardTitle>{learning.inProgressAtoms}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Mastery media</CardDescription>
              <CardTitle>{learning.averageMastery}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Tempo medio risposta</CardDescription>
              <CardTitle>{learning.averageResponseTimeMs} ms</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Review completate</CardDescription>
              <CardTitle>{learning.reviewsCompleted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Sessioni completate</CardDescription>
              <CardTitle>{learning.studySessionsCompleted}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Tempo di studio">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Totale</CardDescription>
              <CardTitle>{formatMinutes(studyTime.totalStudyTimeMs)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Media giornaliera</CardDescription>
              <CardTitle>{formatMinutes(studyTime.averageDailyStudyTimeMs)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Giorni attivi</CardDescription>
              <CardTitle>{studyTime.activeDays}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Streak massimo</CardDescription>
              <CardTitle>{studyTime.longestStreak}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Utilizzo AI">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Job completati</CardDescription>
              <CardTitle>{aiUsage.completedJobs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Job falliti</CardDescription>
              <CardTitle>{aiUsage.failedJobs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Costo stimato</CardDescription>
              <CardTitle>${aiUsage.totalEstimatedCostUsd.toFixed(4)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Token input</CardDescription>
              <CardTitle>{aiUsage.totalInputTokens.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Token output</CardDescription>
              <CardTitle>{aiUsage.totalOutputTokens.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Cache hit rate</CardDescription>
              <CardTitle>{aiUsage.cacheHitRate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Errori recenti">
        {errors.length === 0 ? (
          <Card>
            <CardDescription>Nessun errore registrato di recente.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {errors.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.code ? <Badge variant="danger">{item.code}</Badge> : null}
                  </div>
                  <CardDescription>{item.message}</CardDescription>
                  {item.route ? (
                    <p className="text-xs text-muted">{item.route}</p>
                  ) : null}
                  <p className="text-xs text-muted">
                    {new Date(item.occurredAt).toLocaleString("it-IT")}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
