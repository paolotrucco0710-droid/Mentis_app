import { describe, expect, it } from "vitest";
import {
  isScrollAtBottom,
  qualifiesSwipeUpGesture,
  SWIPE_UP_MIN_DISTANCE_PX,
  SWIPE_UP_MIN_FLICK_DISTANCE_PX,
  SWIPE_UP_MIN_FLICK_VELOCITY_PX_MS,
} from "@/hooks/swipe-up-gesture";

describe("swipe-up-gesture", () => {
  it("treats non-scrollable containers as ready to advance", () => {
    expect(isScrollAtBottom(0, 400, 800)).toBe(true);
  });

  it("requires reaching the bottom of scrollable content", () => {
    expect(isScrollAtBottom(0, 1200, 800)).toBe(false);
    expect(isScrollAtBottom(392, 1200, 800)).toBe(true);
  });

  it("rejects small accidental swipes", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 0,
        deltaY: 56,
        durationMs: 180,
      })
    ).toBe(false);
  });

  it("accepts deliberate long swipes", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 0,
        deltaY: SWIPE_UP_MIN_DISTANCE_PX,
        durationMs: 420,
      })
    ).toBe(true);
  });

  it("accepts fast flicks with a shorter distance", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 0,
        deltaY: SWIPE_UP_MIN_FLICK_DISTANCE_PX,
        durationMs: SWIPE_UP_MIN_FLICK_DISTANCE_PX / SWIPE_UP_MIN_FLICK_VELOCITY_PX_MS,
      })
    ).toBe(true);
  });

  it("rejects slow short swipes", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 0,
        deltaY: SWIPE_UP_MIN_FLICK_DISTANCE_PX,
        durationMs: 400,
      })
    ).toBe(false);
  });

  it("rejects mostly horizontal gestures", () => {
    expect(
      qualifiesSwipeUpGesture({
        deltaX: 80,
        deltaY: SWIPE_UP_MIN_DISTANCE_PX,
        durationMs: 220,
      })
    ).toBe(false);
  });
});
