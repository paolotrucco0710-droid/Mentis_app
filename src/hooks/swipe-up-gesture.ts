export const SWIPE_UP_MIN_DISTANCE_PX = 112;
export const SWIPE_UP_MIN_FLICK_DISTANCE_PX = 80;
export const SWIPE_UP_MIN_FLICK_VELOCITY_PX_MS = 0.5;
export const SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX = 48;
export const SWIPE_UP_SCROLL_BOTTOM_TOLERANCE_PX = 8;

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

export function qualifiesSwipeUpGesture(input: {
  deltaX: number;
  deltaY: number;
  durationMs: number;
}): boolean {
  const { deltaX, deltaY, durationMs } = input;

  if (Math.abs(deltaX) > SWIPE_UP_MAX_HORIZONTAL_DRIFT_PX) {
    return false;
  }

  if (deltaY < SWIPE_UP_MIN_FLICK_DISTANCE_PX) {
    return false;
  }

  const velocityPxMs =
    durationMs > 0 ? deltaY / durationMs : Number.POSITIVE_INFINITY;

  if (deltaY >= SWIPE_UP_MIN_DISTANCE_PX) {
    return true;
  }

  return (
    deltaY >= SWIPE_UP_MIN_FLICK_DISTANCE_PX &&
    velocityPxMs >= SWIPE_UP_MIN_FLICK_VELOCITY_PX_MS
  );
}
