/**
 * Vercel Serverless Function: Social Crawler Prerender
 * 
 * Detects social media crawlers (WhatsApp, Facebook, Twitter, etc.) and returns
 * a minimal HTML page with pre-populated Open Graph and Twitter Card meta tags.
 * Regular users pass through to the SPA normally.
 * 
 * Requirements: R2 (2.1, 2.2, 2.3, 2.4, 2.5)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const DOMAIN = "https://rotihai.com";
const DEFAULT_TITLE = "RotiHai - Fresh Homemade Food Delivery in Mumbai";
const DEFAULT_DESCRIPTION = "Order fresh homemade food from local home chefs in Mumbai. Daily meals, rotis, tiffins & more delivered to your doorstep.";
const DEFAULT_IMAGE = `${DOMAIN}/icon-512.png`;

const CRAWLER_PATTERNS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "Pinterest",
  "Googlebot",
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((pattern) => ua.includes(pattern.toLowerCase()));
}

function buildOgHtml(
  title: string,
  description: string,
  image: string,
  url: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RotiHai" />
  <meta property="og:locale" content="en_IN" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(url)}">${escapeHtml(title)}</a></p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const userAgent = req.headers["user-agent"] as string | undefined;

  // Only serve OG HTML to crawlers
  if (!isCrawler(userAgent)) {
    // Non-crawler: let Vercel serve the SPA (this endpoint shouldn't be hit for non-crawlers
    // unless the rewrite rule is misconfigured). Return 200 with a redirect meta.
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${DOMAIN}${req.url || '/'}" /></head></html>`
    );
  }

  // Parse the path to determine which page was requested
  const path = (req.url || "/").split("?")[0];

  // For now, return default RotiHai brand OG tags for all pages.
  // Phase 2 will add per-entity OG tags by fetching from backend API.
  const url = `${DOMAIN}${path}`;
  const html = buildOgHtml(DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, url);

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=300"); // 5 min cache
  return res.status(200).send(html);
}
