import Link from "next/link";
import { UserMenu } from "@/components/auth";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[var(--topbar-height)] max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/home" className="text-lg font-semibold tracking-tight">
          Mentis
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            className="hidden text-sm text-muted hover:text-foreground sm:inline"
          >
            Libreria
          </Link>
          <Link
            href="/search"
            className="hidden text-sm text-muted hover:text-foreground sm:inline"
          >
            Cerca
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
