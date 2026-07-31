import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const SearchPanel = dynamic(
  () =>
    import("@/components/course/search-panel").then((module) => module.SearchPanel),
  { loading: () => <Loader label="Caricamento ricerca..." /> }
);

export default function SearchPage() {
  return <SearchPanel />;
}
