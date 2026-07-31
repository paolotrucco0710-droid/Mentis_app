export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface BucketState {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, BucketState>();

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const bucketKey = `${input.key}:${input.windowMs}:${input.limit}`;
  const existing = buckets.get(bucketKey);

  if (!existing || now - existing.windowStart >= input.windowMs) {
    const resetAt = now + input.windowMs;
    buckets.set(bucketKey, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: input.limit,
      remaining: Math.max(input.limit - 1, 0),
      resetAt,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
    };
  }

  if (existing.count >= input.limit) {
    const resetAt = existing.windowStart + input.windowMs;
    return {
      allowed: false,
      limit: input.limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 1),
    };
  }

  existing.count += 1;
  const resetAt = existing.windowStart + input.windowMs;

  return {
    allowed: true,
    limit: input.limit,
    remaining: Math.max(input.limit - existing.count, 0),
    resetAt,
    retryAfterSeconds: Math.ceil(input.windowMs / 1000),
  };
}

export function resetRateLimitState(): void {
  buckets.clear();
}
