"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FeedCardSurface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function FeedCardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function FeedCardHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm leading-relaxed text-muted", className)}>
      {children}
    </p>
  );
}
