import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/analytics/analytics-dashboard").then(
      (module) => module.AnalyticsDashboard
    ),
  { loading: () => <Loader label="Caricamento analytics..." /> }
);

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
