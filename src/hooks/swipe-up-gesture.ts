export const SWIPE_UP_SNAP_THRESHOLD_RATIO = 0.35;
export const SWIPE_UP_FLING_MIN_DISTANCE_RATIO = 0.12;
export const SWIPE_UP_FLING_VELOCITY_PX_MS = 0.85;
export const SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX = 48;
export const SWIPE_UP_SCROLL_BOTTOM_TOLERANCE_PX = 8;
export const SWIPE_UP_SNAP_ANIMATION_MS = 280;

export function isScrollAtBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  tolerancePx = SWIPE_UP_SCROLL_BOTTOM_TOLERANCE_PX
): boolean {
  if (scrollHeight <= clientHeight + tolerancePx) {
    return true;
  }

  return scrollTop + clientHeight >= scrollHeight - tolerancePx;
}

export function shouldAdvanceOnSwipeRelease(input: {
  deltaX: number;
  deltaY: number;
  durationMs: number;
  viewportHeight: number;
}): boolean {
  const { deltaX, deltaY, durationMs, viewportHeight } = input;

  if (viewportHeight <= 0 || deltaY <= 0) {
    return false;
  }

  if (Math.abs(deltaX) > SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX) {
    return false;
  }

  const snapThresholdPx = viewportHeight * SWIPE_UP_SNAP_THRESHOLD_RATIO;
  if (deltaY >= snapThresholdPx) {
    return true;
  }

  const flickMinPx = viewportHeight * SWIPE_UP_FLING_MIN_DISTANCE_RATIO;
  const velocityPxMs =
    durationMs > 0 ? deltaY / durationMs : Number.POSITIVE_INFINITY;

  return (
    deltaY >= flickMinPx && velocityPxMs >= SWIPE_UP_FLING_VELOCITY_PX_MS
  );
}

/** @deprecated Use shouldAdvanceOnSwipeRelease with viewportHeight instead. */
export function qualifiesSwipeUpGesture(input: {
  deltaX: number;
  deltaY: number;
  durationMs: number;
}): boolean {
  return shouldAdvanceOnSwipeRelease({
    ...input,
    viewportHeight: 800,
  });
}

/** @deprecated Use SWIPE_UP_SNAP_THRESHOLD_RATIO with viewport height instead. */
export const SWIPE_UP_MIN_DISTANCE_PX = Math.round(
  800 * SWIPE_UP_SNAP_THRESHOLD_RATIO
);

/** @deprecated Use SWIPE_UP_FLING_MIN_DISTANCE_RATIO with viewport height instead. */
export const SWIPE_UP_MIN_FLICK_DISTANCE_PX = Math.round(
  800 * SWIPE_UP_FLING_MIN_DISTANCE_RATIO
);

/** @deprecated Use SWIPE_UP_FLING_VELOCITY_PX_MS instead. */
export const SWIPE_UP_MIN_FLICK_VELOCITY_PX_MS = SWIPE_UP_FLING_VELOCITY_PX_MS;
