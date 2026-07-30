import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-accent/80",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function Loader({ label = "Caricamento..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
