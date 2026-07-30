import { AppShell } from "@/components/layout";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
