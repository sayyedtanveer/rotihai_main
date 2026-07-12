/**
 * Dynamic XML Sitemap Generator
 * Generates sitemap from live database content (products, chefs, categories, subscription plans)
 * Caches result for 10 minutes using the existing cache pattern.
 * 
 * Requirements: R11 (11.1, 11.2, 11.3, 11.4, 11.5, 11.6)
 */

import type { Express } from "express";
import { storage } from "../storage";
import { getCache, setCache } from "../cache";

const SITEMAP_CACHE_KEY = "seo:sitemap:main";
const SITEMAP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const DOMAIN = "https://rotihai.com";

export function registerSitemapRoutes(app: Express) {
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      // Check cache first
      const cached = getCache(SITEMAP_CACHE_KEY);
      if (cached) {
        res.set("Content-Type", "application/xml");
        return res.send(cached);
      }

      // Query active entities from database
      const [products, chefs, categories, plans] = await Promise.all([
        storage.getAllProducts(),
        storage.getChefs(),
        storage.getAllCategories(),
        storage.getSubscriptionPlans(),
      ]);

      // Filter to active only
      const activeProducts = products.filter((p) => p.isAvailable !== false);
      const activeChefs = chefs.filter((c) => c.isActive !== false);
      const activePlans = plans.filter((p) => p.isActive !== false);

      const today = new Date().toISOString().split("T")[0];

      // Build sitemap entries
      const entries: string[] = [];

      // Homepage — priority 1.0
      entries.push(buildUrl(`${DOMAIN}/`, today, "daily", 1.0));

      // Categories — priority 0.8
      for (const cat of categories) {
        entries.push(buildUrl(`${DOMAIN}/category/${cat.id}`, today, "weekly", 0.8));
      }

      // Chefs — priority 0.8
      for (const chef of activeChefs) {
        entries.push(buildUrl(`${DOMAIN}/chef/${chef.id}`, today, "weekly", 0.8));
      }

      // Products — priority 0.7
      for (const product of activeProducts) {
        entries.push(buildUrl(`${DOMAIN}/product/${product.id}`, today, "weekly", 0.7));
      }

      // Subscription Plans — priority 0.6
      for (const plan of activePlans) {
        entries.push(buildUrl(`${DOMAIN}/subscription/${plan.id}`, today, "monthly", 0.6));
      }

      // Static pages — priority 0.3
      entries.push(buildUrl(`${DOMAIN}/privacy-policy`, today, "yearly", 0.3));

      // Build final XML — if >500 entries, produce sitemap index
      let xml: string;
      if (entries.length > 500) {
        xml = buildSitemapIndex(entries);
      } else {
        xml = buildSitemapXml(entries);
      }

      // Cache the response
      setCache(SITEMAP_CACHE_KEY, xml, SITEMAP_CACHE_TTL);

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("[SITEMAP] Error generating sitemap:", error);
      // Return empty but valid sitemap on error
      res
        .status(500)
        .set("Content-Type", "application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
        );
    }
  });
}

function buildUrl(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number
): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

function buildSitemapXml(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}

/**
 * When there are more than 500 URLs, split into a sitemap index
 * with multiple child sitemaps (max 500 URLs each).
 */
function buildSitemapIndex(entries: string[]): string {
  const CHUNK_SIZE = 500;
  const today = new Date().toISOString().split("T")[0];
  const chunkCount = Math.ceil(entries.length / CHUNK_SIZE);

  const sitemapEntries: string[] = [];
  for (let i = 0; i < chunkCount; i++) {
    sitemapEntries.push(
      `  <sitemap>\n    <loc>${DOMAIN}/sitemap-${i + 1}.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</sitemapindex>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
