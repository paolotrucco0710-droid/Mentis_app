import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external profile URLs until cloud storage (M15)
      <img
        src={src}
        alt={name}
        className={cn(
          "h-12 w-12 rounded-full object-cover",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary",
        className
      )}
      aria-hidden={!src}
    >
      {initials}
    </div>
  );
}
