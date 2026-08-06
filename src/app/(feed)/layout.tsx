import { FeedLayout } from "@/components/layout";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function FeedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeedLayout>
      <OnboardingGate>{children}</OnboardingGate>
    </FeedLayout>
  );
}
