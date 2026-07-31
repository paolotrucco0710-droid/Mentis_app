import { afterEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  resetRateLimitState,
} from "@/lib/rate-limit/http";

describe("lib/rate-limit/http", () => {
  afterEach(() => {
    resetRateLimitState();
  });

  it("allows requests within the configured limit", () => {
    const first = checkRateLimit({
      key: "test-ip",
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    });
    const second = checkRateLimit({
      key: "test-ip",
      limit: 2,
      windowMs: 60_000,
      now: 1_100,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks requests above the configured limit", () => {
    checkRateLimit({
      key: "blocked-ip",
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
    });

    const blocked = checkRateLimit({
      key: "blocked-ip",
      limit: 1,
      windowMs: 60_000,
      now: 2_100,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the window after it expires", () => {
    checkRateLimit({
      key: "reset-ip",
      limit: 1,
      windowMs: 1_000,
      now: 3_000,
    });

    const afterWindow = checkRateLimit({
      key: "reset-ip",
      limit: 1,
      windowMs: 1_000,
      now: 4_100,
    });

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(0);
  });
});
