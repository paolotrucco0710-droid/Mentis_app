"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FeedCardStage({
  cardKey,
  children,
  className,
}: {
  cardKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      key={cardKey}
      className={cn("feed-card-stage-enter flex min-h-0 flex-1 flex-col", className)}
    >
      {children}
    </div>
  );
}
