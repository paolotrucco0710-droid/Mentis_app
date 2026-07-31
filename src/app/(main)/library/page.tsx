import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const LibraryDashboard = dynamic(
  () =>
    import("@/components/course/library-dashboard").then(
      (module) => module.LibraryDashboard
    ),
  { loading: () => <Loader label="Caricamento libreria..." /> }
);

export default function LibraryPage() {
  return <LibraryDashboard />;
}
