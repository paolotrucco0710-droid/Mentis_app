import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const SettingsPanel = dynamic(
  () =>
    import("@/components/profile/settings-panel").then(
      (module) => module.SettingsPanel
    ),
  { loading: () => <Loader label="Caricamento impostazioni..." /> }
);

export default function SettingsPage() {
  return <SettingsPanel />;
}
