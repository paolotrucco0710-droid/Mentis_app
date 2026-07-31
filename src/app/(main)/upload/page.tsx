import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader } from "@/components/ui";

const UploadPanel = dynamic(
  () =>
    import("@/components/course/upload-panel").then((module) => module.UploadPanel),
  { loading: () => <Loader label="Caricamento upload..." /> }
);

export default function UploadPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento upload..." />}>
      <UploadPanel />
    </Suspense>
  );
}
