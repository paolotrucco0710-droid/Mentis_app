import Link from "next/link";
import { Avatar } from "@/components/ui";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[var(--topbar-height)] max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/home" className="text-lg font-semibold tracking-tight">
          Mentis
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">
            Ciao, Paolo
          </span>
          <Avatar name="Paolo Dev" className="h-9 w-9 text-xs" />
        </div>
      </div>
    </header>
  );
}
