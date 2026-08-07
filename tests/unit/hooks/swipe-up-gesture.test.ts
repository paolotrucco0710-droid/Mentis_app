import { describe, expect, it } from "vitest";
import {
  isScrollAtBottom,
  qualifiesSwipeUpGesture,
  shouldAdvanceOnSwipeRelease,
  SWIPE_UP_FLING_MIN_DISTANCE_RATIO,
  SWIPE_UP_FLING_VELOCITY_PX_MS,
  SWIPE_UP_SNAP_THRESHOLD_RATIO,
} from "@/hooks/swipe-up-gesture";

const VIEWPORT_HEIGHT = 800;

describe("swipe-up-gesture", () => {
  it("treats non-scrollable containers as ready to advance", () => {
    expect(isScrollAtBottom(0, 400, 800)).toBe(true);
  });

  it("requires reaching the bottom of scrollable content", () => {
    expect(isScrollAtBottom(0, 1200, 800)).toBe(false);
    expect(isScrollAtBottom(392, 1200, 800)).toBe(true);
  });

  it("rejects small accidental swipes below the snap threshold", () => {
    expect(
      shouldAdvanceOnSwipeRelease({
        deltaX: 0,
        deltaY: VIEWPORT_HEIGHT * 0.2,
        durationMs: 450,
        viewportHeight: VIEWPORT_HEIGHT,
      })
    ).toBe(false);
  });

  it("accepts deliberate swipes past the snap threshold", () => {
    expect(
      shouldAdvanceOnSwipeRelease({
        deltaX: 0,
        deltaY: VIEWPORT_HEIGHT * SWIPE_UP_SNAP_THRESHOLD_RATIO,
        durationMs: 420,
        viewportHeight: VIEWPORT_HEIGHT,
      })
    ).toBe(true);
  });

  it("accepts fast flicks with a shorter distance", () => {
    const deltaY = VIEWPORT_HEIGHT * SWIPE_UP_FLING_MIN_DISTANCE_RATIO;

    expect(
      shouldAdvanceOnSwipeRelease({
        deltaX: 0,
        deltaY,
        durationMs: deltaY / SWIPE_UP_FLING_VELOCITY_PX_MS,
        viewportHeight: VIEWPORT_HEIGHT,
      })
    ).toBe(true);
  });

  it("rejects slow short swipes", () => {
    expect(
      shouldAdvanceOnSwipeRelease({
        deltaX: 0,
        deltaY: VIEWPORT_HEIGHT * SWIPE_UP_FLING_MIN_DISTANCE_RATIO,
        durationMs: 400,
        viewportHeight: VIEWPORT_HEIGHT,
      })
    ).toBe(false);
  });

  it("rejects mostly horizontal gestures", () => {
    expect(
      shouldAdvanceOnSwipeRelease({
        deltaX: 80,
        deltaY: VIEWPORT_HEIGHT * SWIPE_UP_SNAP_THRESHOLD_RATIO,
        durationMs: 220,
        viewportHeight: VIEWPORT_HEIGHT,
      })
    ).toBe(false);
  });

  it("keeps legacy helper behavior for fixed 800px viewport", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 0,
        deltaY: 56,
        durationMs: 180,
      })
    ).toBe(false);
  });
});
