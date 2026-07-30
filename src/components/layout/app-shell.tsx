import { BottomNavigation } from "./bottom-navigation";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-[calc(var(--nav-height)+1.5rem)] pt-6 sm:px-6">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
