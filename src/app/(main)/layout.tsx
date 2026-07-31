import { AppShell } from "@/components/layout";
import { AnalyticsPageTracker } from "@/components/analytics";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <AnalyticsPageTracker />
      {children}
    </AppShell>
  );
}
