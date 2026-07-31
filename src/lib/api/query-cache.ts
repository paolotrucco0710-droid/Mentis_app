type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type InflightRequest<T> = Promise<T>;

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, InflightRequest<unknown>>();

const DEFAULT_TTL_MS = 60_000;

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expiresAt;
}

export function getCachedQuery<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || isExpired(entry)) {
    if (entry) {
      cache.delete(key);
    }
    return undefined;
  }

  return entry.value as T;
}

export function setCachedQuery<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateQuery(key: string): void {
  cache.delete(key);
  inflight.delete(key);
}

export function invalidateQueryPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }

  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) {
      inflight.delete(key);
    }
  }
}

export async function fetchWithQueryCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = getCachedQuery<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const pending = inflight.get(key) as InflightRequest<T> | undefined;
  if (pending) {
    return pending;
  }

  const request = loader()
    .then((value) => {
      setCachedQuery(key, value, ttlMs);
      inflight.delete(key);
      return value;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, request);
  return request;
}

export const queryCacheKeys = {
  library: "library:overview",
  search: (query: string) => `search:${query.trim().toLowerCase()}`,
  profile: "profile:me",
  profileStatistics: "profile:statistics",
  profileDailyHistory: (days: number) => `profile:daily:${days}`,
  imageUrl: (imageId: string) => `image:url:${imageId}`,
  avatarUrl: "profile:avatar:url",
} as const;
