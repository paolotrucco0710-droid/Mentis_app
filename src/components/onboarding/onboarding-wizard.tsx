"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ApiError, updateProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Scatta una foto al libro",
    description:
      "Carica le pagine del capitolo con la fotocamera o un PDF. Mentis fa il resto.",
    visual: "camera",
  },
  {
    title: "L'AI costruisce il corso",
    description:
      "In pochi minuti estrae i concetti, crea le card e organizza il percorso di studio.",
    visual: "ai",
  },
  {
    title: "Tu inizi semplicemente a studiare",
    description:
      "Apri il feed e lascia che Mentis scelga cosa ripassare, spiegare o verificare.",
    visual: "study",
  },
] as const;

function StepVisual({ kind }: { kind: (typeof STEPS)[number]["visual"] }) {
  return (
    <div
      className={cn(
        "mx-auto flex h-36 w-36 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-br from-accent to-surface shadow-sm",
        kind === "camera" && "motion-safe:animate-pulse",
        kind === "ai" && "motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]",
        kind === "study" && "motion-safe:animate-[pulse_3s_ease-in-out_infinite]"
      )}
      aria-hidden="true"
    >
      {kind === "camera" ? (
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      ) : null}
      {kind === "ai" ? (
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1 1 3z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
        </svg>
      ) : null}
      {kind === "study" ? (
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19V5a2 2 0 0 1 2-2h11" />
          <path d="M4 19a2 2 0 0 0 2 2h12V7H6a2 2 0 0 0-2 2z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      ) : null}
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  async function completeOnboarding() {
    try {
      setLoading(true);
      setError(null);
      await updateProfile({
        preferences: {
          dailyGoalMinutes: 30,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });
      router.push("/upload");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossibile completare l'onboarding."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-md">
      <CardHeader className="items-center gap-6 text-center">
        <div className="flex gap-2">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                index <= step ? "bg-primary" : "bg-border"
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        <StepVisual kind={current.visual} />
        <div className="space-y-2">
          <CardTitle className="text-2xl">{current.title}</CardTitle>
          <CardDescription className="text-base">
            {current.description}
          </CardDescription>
        </div>
      </CardHeader>

      {error ? <p className="px-6 text-sm text-danger">{error}</p> : null}

      <div className="flex flex-col gap-3 px-6 pb-6">
        {isLastStep ? (
          <Button fullWidth size="lg" disabled={loading} onClick={() => void completeOnboarding()}>
            {loading ? "Preparazione..." : "Inizia"}
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={() => setStep((value) => value + 1)}>
            Avanti
          </Button>
        )}
        {step > 0 && !isLastStep ? (
          <Button
            fullWidth
            variant="ghost"
            onClick={() => setStep((value) => value - 1)}
          >
            Indietro
          </Button>
        ) : null}
        {!isLastStep ? (
          <Button
            fullWidth
            variant="ghost"
            disabled={loading}
            onClick={() => void completeOnboarding()}
          >
            Salta per ora
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
