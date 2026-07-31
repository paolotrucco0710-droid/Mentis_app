import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader } from "@/components/ui";

const FeedStudy = dynamic(
  () => import("@/components/feed/feed-study").then((module) => module.FeedStudy),
  { loading: () => <Loader label="Caricamento feed..." /> }
);

export default function FeedPage() {
  return (
    <Suspense fallback={<Loader label="Caricamento feed..." />}>
      <FeedStudy />
    </Suspense>
  );
}
