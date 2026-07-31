import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader } from "@/components/ui";

const ProcessingPanel = dynamic(
  () =>
    import("@/components/course/processing-panel").then(
      (module) => module.ProcessingPanel
    ),
  { loading: () => <Loader label="Caricamento elaborazione..." /> }
);

export default function ProcessingPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento elaborazione..." />}>
      <ProcessingPanel />
    </Suspense>
  );
}
