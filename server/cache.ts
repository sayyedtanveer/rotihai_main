const MAX_CACHE_SIZE = 500;

type CacheEntry = {
  value: any;
  timeout: NodeJS.Timeout;
};

export const cache = new Map<string, CacheEntry>();

export function getCache(key: string) {
  return cache.get(key)?.value;
}

export function setCache(key: string, value: any, ttl: number) {
  // Clear existing timeout (prevents memory leak)
  if (cache.has(key)) {
    clearTimeout(cache.get(key)!.timeout);
  }

  // Enforce max cache size (simple FIFO)
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      invalidateCache(firstKey);
    }
  }

  const timeout = setTimeout(() => {
    cache.delete(key);
  }, ttl);

  cache.set(key, { value, timeout });
}

export function invalidateCache(key: string) {
  const entry = cache.get(key);
  if (entry) {
    clearTimeout(entry.timeout);
    cache.delete(key);
  }
}

export function invalidateCachePrefix(prefix: string) {
  const keysToDelete: string[] = [];

  // Used forEach instead of for...of to prevent the TypeScript downlevelIteration error
  cache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => invalidateCache(key));
}
