/**
 * SEO Cache Layer
 * In-memory caching for SEO responses (sitemap, prerender, structured data).
 * Uses the same pattern as server/cache.ts but with SEO-specific TTLs.
 * 
 * Requirements: R28 (28.1, 28.2, 28.3, 28.4, 28.5)
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const seoCache = new Map<string, CacheEntry>();

export const SEO_CACHE_TTLS = {
  sitemap: 10 * 60 * 1000,       // 10 minutes
  prerender: 5 * 60 * 1000,      // 5 minutes
  structuredData: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Get a cached SEO response. Returns undefined if expired or not found.
 */
export function getSeoCache(key: string): unknown | undefined {
  const entry = seoCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    seoCache.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a cached SEO response with a TTL based on type.
 */
export function setSeoCache(key: string, value: unknown, type: keyof typeof SEO_CACHE_TTLS): void {
  seoCache.set(key, {
    value,
    expiresAt: Date.now() + SEO_CACHE_TTLS[type],
  });
}

/**
 * Invalidate cache entries for a specific entity.
 * Call this when an entity is created, updated, or deleted.
 */
export function invalidateSeoCache(entityType: string, entityId: string): void {
  // Invalidate sitemap (it includes all entities)
  seoCache.delete("seo:sitemap:main");
  // Invalidate entity-specific structured data
  seoCache.delete(`seo:structured:${entityType}:${entityId}`);
  // Invalidate prerender for entity page
  seoCache.delete(`seo:prerender:/${entityType}/${entityId}`);
}

/**
 * Invalidate all SEO caches. Use sparingly (e.g., bulk updates).
 */
export function invalidateAllSeoCache(): void {
  seoCache.clear();
}
