/**
 * Dynamic Robots.txt Generator
 * Generates robots.txt from server-side route configuration.
 * 
 * Requirements: R22 (22.1, 22.2, 22.3, 22.4, 22.5)
 */

import type { Express } from "express";

const DOMAIN = "https://rotihai.com";

const DISALLOW_PATHS = [
  "/admin",
  "/api",
  "/auth",
  "/cart",
  "/profile",
  "/orders",
  "/my-orders",
  "/my-subscriptions",
  "/partner",
  "/delivery",
  "/delivery-dashboard",
  "/checkout",
  "/track",
  "/invite",
  "/login",
];

const ALLOW_PATHS = [
  "/",
  "/product",
  "/chef",
  "/category",
  "/delivery/",
  "/subscription",
  "/privacy-policy",
  "/blog",
];

export function registerRobotsRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    const lines: string[] = [
      "# RotiHai - Robots.txt (Dynamic)",
      "User-agent: *",
      "",
      "# Allow public pages",
      ...ALLOW_PATHS.map((p) => `Allow: ${p}`),
      "",
      "# Disallow private/authenticated routes",
      ...DISALLOW_PATHS.map((p) => `Disallow: ${p}`),
      "",
      `# Sitemap`,
      `Sitemap: ${DOMAIN}/sitemap.xml`,
      "",
    ];

    res.set("Content-Type", "text/plain");
    res.send(lines.join("\n"));
  });
}
