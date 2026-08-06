import { AppShell } from "@/components/layout";
import { AnalyticsPageTracker } from "@/components/analytics";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <AnalyticsPageTracker />
      <OnboardingGate>{children}</OnboardingGate>
    </AppShell>
  );
}
