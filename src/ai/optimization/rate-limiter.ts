import { env } from "@/lib/env";

export function createRateLimiter(
  maxConcurrent = env.aiMaxConcurrentRequests,
  minDelayMs = env.aiMinRequestDelayMs
) {
  let active = 0;
  const queue: Array<() => void> = [];
  let lastStartedAt = 0;

  async function acquire(): Promise<void> {
    if (active < maxConcurrent) {
      const now = Date.now();
      const waitMs = Math.max(0, minDelayMs - (now - lastStartedAt));
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      active += 1;
      lastStartedAt = Date.now();
      return;
    }

    await new Promise<void>((resolve) => {
      queue.push(resolve);
    });
    return acquire();
  }

  function release(): void {
    active = Math.max(0, active - 1);
    const next = queue.shift();
    if (next) {
      next();
    }
  }

  return {
    async run<T>(operation: () => Promise<T>): Promise<T> {
      await acquire();
      try {
        return await operation();
      } finally {
        release();
      }
    },
  };
}

export const aiRateLimiter = createRateLimiter();
