"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui";
import { fetchProfile } from "@/lib/api";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const profile = await fetchProfile();
        if (cancelled) {
          return;
        }

        if (!hasCompletedOnboarding(profile)) {
          router.replace("/onboarding");
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <Loader label="Preparazione..." />;
  }

  return children;
}
