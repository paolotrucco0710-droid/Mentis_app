import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const FeedStudy = dynamic(
  () => import("@/components/feed/feed-study").then((module) => module.FeedStudy),
  { loading: () => <Loader label="Caricamento feed..." /> }
);

export default function FeedPage() {
  return <FeedStudy />;
}
