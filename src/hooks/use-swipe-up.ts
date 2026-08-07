import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  isScrollAtBottom,
  shouldAdvanceOnSwipeRelease,
  SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX,
  SWIPE_UP_SNAP_ANIMATION_MS,
} from "./swipe-up-gesture";

type TouchStartSnapshot = {
  x: number;
  y: number;
  at: number;
  atBottom: boolean;
};

export function useSwipeUp(
  onSwipe: () => void,
  enabled: boolean,
  scrollContainerRef?: RefObject<HTMLElement | null>
): {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  cardStyle: CSSProperties;
} {
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const start = useRef<TouchStartSnapshot | null>(null);
  const dragOffsetRef = useRef(0);
  const enabledRef = useRef(enabled);
  const isSnappingRef = useRef(false);
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    enabledRef.current = enabled;
    onSwipeRef.current = onSwipe;
  }, [enabled, onSwipe]);

  useEffect(() => {
    isSnappingRef.current = isSnapping;
    dragOffsetRef.current = dragOffsetPx;
  }, [dragOffsetPx, isSnapping]);

  const getScrollElement = useCallback(
    () => scrollContainerRef?.current ?? null,
    [scrollContainerRef]
  );

  const readViewportHeight = useCallback(() => {
    const scrollElement = getScrollElement();
    return scrollElement?.clientHeight ?? window.innerHeight;
  }, [getScrollElement]);

  const isReadyToDrag = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) {
      return true;
    }

    return isScrollAtBottom(
      scrollElement.scrollTop,
      scrollElement.scrollHeight,
      scrollElement.clientHeight
    );
  }, [getScrollElement]);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabledRef.current || isSnappingRef.current) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      start.current = {
        x: touch.clientX,
        y: touch.clientY,
        at: event.timeStamp,
        atBottom: isReadyToDrag(),
      };
    },
    [isReadyToDrag]
  );

  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) {
      return;
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!enabledRef.current || isSnappingRef.current || !start.current) {
        return;
      }

      if (!start.current.atBottom && !isReadyToDrag()) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - start.current.x;
      const deltaY = start.current.y - touch.clientY;

      if (deltaY <= 0) {
        dragOffsetRef.current = 0;
        setDragOffsetPx(0);
        return;
      }

      if (Math.abs(deltaX) > SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX) {
        return;
      }

      if (!isReadyToDrag()) {
        return;
      }

      event.preventDefault();
      start.current = { ...start.current, atBottom: true };
      dragOffsetRef.current = deltaY;
      setDragOffsetPx(deltaY);
    };

    scrollElement.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      scrollElement.removeEventListener("touchmove", onTouchMove);
    };
  }, [getScrollElement, isReadyToDrag]);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabledRef.current || !start.current || isSnappingRef.current) {
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
      const durationMs = Math.max(0, event.timeStamp - start.current.at);
      const viewportHeight = readViewportHeight();
      const shouldAdvance =
        start.current.atBottom &&
        shouldAdvanceOnSwipeRelease({
          deltaX,
          deltaY,
          durationMs,
          viewportHeight,
        });

      start.current = null;

      if (!shouldAdvance) {
        if (dragOffsetRef.current <= 0) {
          return;
        }

        setIsSnapping(true);
        dragOffsetRef.current = 0;
        setDragOffsetPx(0);
        window.setTimeout(() => {
          setIsSnapping(false);
        }, SWIPE_UP_SNAP_ANIMATION_MS);
        return;
      }

      setIsSnapping(true);
      dragOffsetRef.current = viewportHeight;
      setDragOffsetPx(viewportHeight);
      window.setTimeout(() => {
        onSwipeRef.current();
      }, SWIPE_UP_SNAP_ANIMATION_MS);
    },
    [readViewportHeight]
  );

  const cardStyle: CSSProperties = {
    transform:
      dragOffsetPx > 0 ? `translate3d(0, ${-dragOffsetPx}px, 0)` : undefined,
    transition: isSnapping
      ? `transform ${SWIPE_UP_SNAP_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : undefined,
    willChange: dragOffsetPx > 0 || isSnapping ? "transform" : undefined,
  };

  return { onTouchStart, onTouchEnd, cardStyle };
}
