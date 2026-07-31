import dynamic from "next/dynamic";
import { Loader } from "@/components/ui";

const ProfileDashboard = dynamic(
  () =>
    import("@/components/profile/profile-dashboard").then(
      (module) => module.ProfileDashboard
    ),
  { loading: () => <Loader label="Caricamento profilo..." /> }
);

export default function ProfilePage() {
  return <ProfileDashboard />;
}
