type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const serverMemoryCache = new MemoryCache();

export async function withServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = serverMemoryCache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await loader();
  serverMemoryCache.set(key, value, ttlMs);
  return value;
}
