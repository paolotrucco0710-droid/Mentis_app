import { Suspense } from "react";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { Loader } from "@/components/ui";

export default function HomePage() {
  return (
    <Suspense fallback={<Loader label="Preparazione..." />}>
      <HomeDashboard />
    </Suspense>
  );
}
