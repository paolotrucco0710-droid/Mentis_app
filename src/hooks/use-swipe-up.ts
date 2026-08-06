import { useCallback, useRef } from "react";

const MIN_SWIPE_DISTANCE_PX = 56;
const MAX_HORIZONTAL_DRIFT_PX = 48;

export function useSwipeUp(
  onSwipe: () => void,
  enabled: boolean
): {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
} {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    start.current = { x: touch.clientX, y: touch.clientY };
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

      const deltaX = touch.clientX - start.current.x;
      const deltaY = start.current.y - touch.clientY;

      if (
        deltaY >= MIN_SWIPE_DISTANCE_PX &&
        Math.abs(deltaX) <= MAX_HORIZONTAL_DRIFT_PX
      ) {
        onSwipe();
      }

      start.current = null;
    },
    [enabled, onSwipe]
  );

  return { onTouchStart, onTouchEnd };
}
