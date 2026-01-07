/**
 * Global Fetch Patch
 * 
 * This patches the global fetch() to respect VITE_API_URL environment variable.
 * All API calls (including raw fetch) will automatically use the correct backend URL.
 * 
 * How it works:
 * - Dev: fetch("/api/categories") -> uses relative path -> Vite proxy -> localhost:5000
 * - Prod: fetch("/api/categories") -> prepends VITE_API_URL -> https://rotihai-backend.onrender.com/api/categories
 * 
 * No code changes needed - just import this file in main app entry point!
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const originalFetch = window.fetch;

// Patch global fetch
window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Convert input to string
  let urlString = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  
  // Only patch relative API paths
  const isRelativeApiPath = typeof urlString === 'string' && urlString.startsWith('/api');
  
  // If VITE_API_URL is set and this is an API call, prepend it
  if (isRelativeApiPath && API_BASE_URL) {
    urlString = `${API_BASE_URL}${urlString}`;
  }
  
  // Call original fetch with potentially modified URL
  return originalFetch(urlString as RequestInfo, init);
} as any;

export {};
