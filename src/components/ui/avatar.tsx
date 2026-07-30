import { cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary",
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
