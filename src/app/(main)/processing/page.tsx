import { Suspense } from "react";
import { Loader } from "@/components/ui";
import { ProcessingPanel } from "@/components/course";

export default function ProcessingPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento elaborazione..." />}>
      <ProcessingPanel />
    </Suspense>
  );
}
