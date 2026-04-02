/**
 * apiBase.ts
 *
 * Central helper for constructing API URLs that work in both:
 * - DEV on Render:  no VITE_API_URL → uses relative path (/api/...)
 * - PROD on Render: VITE_API_URL set → prepends the backend origin
 *
 * Usage:
 *   import { getApiUrl } from "@/lib/apiBase";
 *   fetch(getApiUrl("/api/products"), { ... })
 */

export const getApiUrl = (path: string): string => {
  const base = import.meta.env.VITE_API_URL;
  // If base ends with "/" and path starts with "/", avoid double-slash
  if (base) {
    return `${base.replace(/\/$/, "")}${path}`;
  }
  return path; // relative — same-domain, works on Render full-stack
};
