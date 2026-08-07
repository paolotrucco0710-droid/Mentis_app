import { useCallback, useRef, type RefObject } from "react";
import {
  isScrollAtBottom,
  qualifiesSwipeUpGesture,
} from "./swipe-up-gesture";

export function useSwipeUp(
  onSwipe: () => void,
  enabled: boolean,
  scrollContainerRef?: RefObject<HTMLElement | null>
): {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
} {
  const start = useRef<{ x: number; y: number; at: number } | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    start.current = {
      x: touch.clientX,
      y: touch.clientY,
      at: event.timeStamp,
    };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !start.current) {
        start.current = null;
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        start.current = null;
        return;
      }

      const scrollElement = scrollContainerRef?.current;
      if (
        scrollElement &&
        !isScrollAtBottom(
          scrollElement.scrollTop,
          scrollElement.scrollHeight,
          scrollElement.clientHeight
        )
      ) {
        start.current = null;
        return;
      }

      const deltaX = touch.clientX - start.current.x;
      const deltaY = start.current.y - touch.clientY;
      const durationMs = Math.max(0, event.timeStamp - start.current.at);

      if (
        qualifiesSwipeUpGesture({
          deltaX,
          deltaY,
          durationMs,
        })
      ) {
        onSwipe();
      }

      start.current = null;
    },
    [enabled, onSwipe, scrollContainerRef]
  );

  return { onTouchStart, onTouchEnd };
}
