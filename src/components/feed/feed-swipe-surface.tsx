"use client";

import { useRef, type ReactNode } from "react";
import { useSwipeUp } from "@/hooks";

export function FeedSwipeSurface({
  enabled,
  onAdvance,
  children,
}: {
  enabled: boolean;
  onAdvance: () => boolean | void;
  children: ReactNode;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { onTouchStart, onTouchEnd, cardStyle } = useSwipeUp(
    onAdvance,
    enabled,
    scrollContainerRef
  );

  return (
    <div
      ref={scrollContainerRef}
      data-testid="feed-scroll-surface"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex min-h-full flex-1 flex-col" style={cardStyle}>
        {children}
      </div>
    </div>
  );
}
