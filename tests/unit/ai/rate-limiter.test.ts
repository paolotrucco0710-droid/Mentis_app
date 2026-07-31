import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/ai/optimization/rate-limiter";

describe("ai/optimization/rate-limiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs operations sequentially when concurrency is one", async () => {
    const limiter = createRateLimiter(1, 0);
    const order: number[] = [];

    await Promise.all([
      limiter.run(async () => {
        order.push(1);
      }),
      limiter.run(async () => {
        order.push(2);
      }),
    ]);

    expect(order).toEqual([1, 2]);
  });

  it("enforces minimum delay between starts", async () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter(2, 50);
    const startedAt: number[] = [];

    const first = limiter.run(async () => {
      startedAt.push(Date.now());
    });
    const second = limiter.run(async () => {
      startedAt.push(Date.now());
    });

    await vi.runAllTimersAsync();
    await Promise.all([first, second]);

    expect(startedAt).toHaveLength(2);
    expect(startedAt[1] - startedAt[0]).toBeGreaterThanOrEqual(50);
  });
});
