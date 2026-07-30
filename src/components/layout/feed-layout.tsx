import Link from "next/link";
import { IconButton } from "@/components/ui";
import { ChevronRightIcon } from "@/components/ui/icons";

export function FeedLayout({
  children,
  title = "Studio",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-full bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Sessione attiva
          </p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <Link href="/home">
          <IconButton label="Torna alla home">
            <ChevronRightIcon className="rotate-180" />
          </IconButton>
        </Link>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col px-4 pb-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
