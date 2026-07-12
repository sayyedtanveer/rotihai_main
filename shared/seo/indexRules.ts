/**
 * Index/NoIndex Rules Engine for RotiHai SEO
 *
 * Determines whether a given URL path should be indexed or noindexed
 * based on predefined route patterns and query parameters.
 *
 * Rules:
 * - Search/filter query params (?q=, ?search=) → always noindex
 * - Admin, partner, auth, and user-specific routes → noindex
 * - Public content routes → index
 * - Unknown paths → index (safe default)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const INDEX_DIRECTIVE = 'index, follow';
const NOINDEX_DIRECTIVE = 'noindex, nofollow';

// ─── NoIndex Patterns ─────────────────────────────────────────────────────────

/**
 * Paths that should NEVER be indexed.
 * Order: wildcards first, then exact matches.
 */
const NOINDEX_PATTERNS: RegExp[] = [
  /^\/admin(\/.*)?$/,
  /^\/partner(\/.*)?$/,
  /^\/delivery-dashboard(\/.*)?$/,
  /^\/track(\/.*)?$/,
  /^\/login$/,
  /^\/cart$/,
  /^\/checkout$/,
  /^\/profile$/,
  /^\/orders$/,
  /^\/my-orders$/,
  /^\/my-subscriptions$/,
  /^\/invite$/,
];

// ─── Query Params That Trigger NoIndex ────────────────────────────────────────

const NOINDEX_QUERY_KEYS = ['q', 'search'];

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Determines whether a given URL path should be indexed by search engines.
 *
 * @param path - URL path starting with '/' (e.g., '/product/123', '/admin/dashboard')
 * @param queryParams - Optional URLSearchParams to check for search/filter params
 * @returns Exactly one of 'index, follow' or 'noindex, nofollow'
 */
export function getIndexDirective(path: string, queryParams?: URLSearchParams): string {
  // Rule 1: If query params contain search-related keys, always noindex
  if (queryParams) {
    for (const key of NOINDEX_QUERY_KEYS) {
      if (queryParams.has(key)) {
        return NOINDEX_DIRECTIVE;
      }
    }
  }

  // Rule 2: Check path against noindex patterns
  for (const pattern of NOINDEX_PATTERNS) {
    if (pattern.test(path)) {
      return NOINDEX_DIRECTIVE;
    }
  }

  // Rule 3: Default to index (safe default for public/unknown paths)
  return INDEX_DIRECTIVE;
}
