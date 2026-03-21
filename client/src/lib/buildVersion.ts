/**
 * Build version utility for cache-busting dynamic imports
 * Uses Vite's injected build timestamp for immediate availability
 * Falls back to runtime version.json fetch if needed
 */

let cachedBuildVersion: string = '';

/**
 * Get the build version synchronously from injected env variable
 * This is the primary method - fast and always available
 */
export function getBuildVersionSync(): string {
  // First try the Vite-injected build time (fastest - no async needed)
  const buildTime = import.meta.env.VITE_BUILD_TIME as string | undefined;
  if (buildTime) {
    return buildTime;
  }
  
  // Fallback to cached version
  if (cachedBuildVersion) {
    return cachedBuildVersion;
  }
  
  // If nothing is available, use current time (will fetch version.json next)
  return '';
}

/**
 * Get build version asynchronously (fetches from version.json if sync version not available)
 * Used for runtime version detection and updates
 */
export async function getBuildVersion(): Promise<string> {
  // Return cached version if already fetched
  if (cachedBuildVersion) {
    return cachedBuildVersion;
  }

  // Try sync version first (from build injection)
  const syncVersion = getBuildVersionSync();
  if (syncVersion) {
    cachedBuildVersion = syncVersion;
    return cachedBuildVersion;
  }

  try {
    const response = await fetch('/version.json?t=' + Date.now());
    if (response.ok) {
      const versionData = await response.json();
      cachedBuildVersion = versionData.buildId || '';
      console.log('[BUILD_VERSION] Fetched build ID from version.json:', cachedBuildVersion);
      return cachedBuildVersion;
    }
  } catch (err) {
    console.warn('[BUILD_VERSION] Failed to fetch build version:', err);
  }

  // Fallback to timestamp if fetch fails
  cachedBuildVersion = Date.now().toString();
  return cachedBuildVersion;
}

/**
 * Get query string for cache-busting (synchronous - uses injected build time)
 * Usage: `?v=${getCacheBustQuerySync()}`
 * For dynamic imports: `import("./module?v=" + getCacheBustQuerySync())`
 */
export function getCacheBustQuerySync(): string {
  const version = getBuildVersionSync();
  return version ? `v=${version}` : '';
}

/**
 * Get query string for cache-busting (asynchronous - more reliable)
 * Usage: `import("./module?v=" + await getCacheBustQuery())`
 */
export async function getCacheBustQuery(): Promise<string> {
  const version = await getBuildVersion();
  return `v=${version}`;
}

/**
 * Preload build version on app startup to have it ready for async operations
 */
export function preloadBuildVersion(): void {
  getBuildVersion().catch(err => {
    console.warn('[BUILD_VERSION] Failed to preload:', err);
  });
}
