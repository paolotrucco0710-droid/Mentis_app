"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Loader } from "@/components/ui";
import { fetchProfile } from "@/lib/api";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const profile = await fetchProfile();
        if (!cancelled && hasCompletedOnboarding(profile)) {
          router.replace("/home");
          return;
        }
      } catch {
        // Allow onboarding when profile cannot be loaded in dev fallback.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <Loader label="Preparazione..." />;
  }

  return <OnboardingWizard />;
}
