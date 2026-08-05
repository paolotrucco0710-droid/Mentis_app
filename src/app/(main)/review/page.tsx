import { Suspense } from "react";
import { ReviewDashboard } from "@/components/review/review-dashboard";
import { Loader } from "@/components/ui";

export default function ReviewPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento ripassi..." />}>
      <ReviewDashboard />
    </Suspense>
  );
}
