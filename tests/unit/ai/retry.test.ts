import { afterEach, describe, expect, it, vi } from "vitest";
import { isRetryableAIError, withRetry } from "@/ai/optimization/retry";

describe("ai/optimization/retry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects retryable transient errors", () => {
    expect(isRetryableAIError(new Error("rate limit exceeded"))).toBe(true);
    expect(isRetryableAIError(new Error("validation failed"))).toBe(false);
    expect(isRetryableAIError("not-an-error")).toBe(false);
  });

  it("retries retryable failures until success", async () => {
    vi.useFakeTimers();
    let attempts = 0;

    const promise = withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("503 temporarily unavailable");
        }
        return "ok";
      },
      { maxAttempts: 3, baseDelayMs: 10 }
    );

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry non-retryable failures", async () => {
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("invalid request");
        },
        { maxAttempts: 3, baseDelayMs: 1 }
      )
    ).rejects.toThrow("invalid request");

    expect(attempts).toBe(1);
  });
});
