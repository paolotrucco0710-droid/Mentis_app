"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  className,
  overscan = 4,
  renderItem,
  getItemKey,
}: {
  items: T[];
  itemHeight: number;
  height: number;
  className?: string;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    setScrollTop(element.scrollTop);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto", className)}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const absoluteIndex = startIndex + index;
            return (
              <div
                key={getItemKey(item, absoluteIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
