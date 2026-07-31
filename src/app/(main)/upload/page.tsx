import { Suspense } from "react";
import { Loader } from "@/components/ui";
import { UploadPanel } from "@/components/course";

export default function UploadPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento upload..." />}>
      <UploadPanel />
    </Suspense>
  );
}
