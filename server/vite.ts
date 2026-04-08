import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

// ⚠️ CRITICAL: Use ENABLE_VITE flag instead of NODE_ENV
// ENABLE_VITE=true → only for local dev with vite.config
// ENABLE_VITE=false or undefined → for deployed environments (no vite.config)
const enableVite = process.env.ENABLE_VITE === "true";

// Only declare these if Vite might be used
let createViteServer: any = null;
let createLogger: any = null;
let viteConfig: any = null;

/**
 * Load Vite and vite.config ONLY when ENABLE_VITE=true
 * This function is safe to call - it returns immediately if Vite is disabled
 */
const loadVite = async () => {
  if (!enableVite) {
    // 🚀 Vite disabled: Do not attempt to load Vite or vite.config
    return;
  }

  // ✅ Vite enabled: Load Vite modules
  if (!createViteServer) {
    try {
      const viteModule = await import("vite");
      createViteServer = viteModule.createServer;
      createLogger = viteModule.createLogger;
    } catch (error) {
      console.error("❌ Failed to load vite module:", error);
      throw new Error("Vite must be installed when ENABLE_VITE=true");
    }
  }

  if (!viteConfig) {
    try {
      // @ts-ignore - vite.config only exists when ENABLE_VITE=true
      const config = await import("../../vite.config");
      viteConfig = config.default;
    } catch (error) {
      console.error("❌ Failed to load vite.config:", error);
      throw new Error("vite.config must exist and be valid when ENABLE_VITE=true");
    }
  }
};

const getViteLogger = async () => {
  await loadVite();
  return createLogger 
    ? createLogger() 
    : { 
        error: console.error, 
        info: console.log, 
        warn: console.warn 
      };
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Setup Vite dev server - ONLY when ENABLE_VITE=true
 * 
 * When disabled: This function returns immediately, NO side effects
 * When enabled: Sets up Vite HMR and middleware
 */
export async function setupVite(app: Express, server: Server) {
  if (!enableVite) {
    // 🚀 Vite disabled: Skip all Vite setup
    return;
  }

  // ✅ Vite enabled: Load and setup Vite
  try {
    await loadVite();
    
    const viteLogger = await getViteLogger();
    
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    if (!createViteServer) {
      throw new Error("Vite server was not loaded correctly");
    }

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg: string, options?: any) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("❌ Failed to setup Vite:", error);
    throw error;
  }
}

/**
 * Serve static files - for deployed environments
 * 
 * When Vite disabled: Required for frontend delivery
 * When Vite enabled: Fallback for development
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    const errorMsg = `❌ CRITICAL: Frontend build not found: ${distPath}
    
    Cause: 'npm run build:client' was not run before deployment
    
    Fix in local environment:
      1. npm run build:client
      2. npm run build:server
      3. Redeploy
    
    For deployed environments (Render, Vercel, etc):
      Ensure build step is configured in your deployment config`;
    
    console.error(errorMsg);
    
    // If Vite is enabled (local dev), we can continue without built files
    if (enableVite) {
      console.warn("⚠️  Continuing without frontend build (Vite enabled)");
      return;
    }
    
    // 🚀 If Vite is disabled (deployed), we MUST have built files
    throw new Error(errorMsg);
  }

  console.log("✅ Serving static frontend from:", distPath);

  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    immutable: false,
    setHeaders: (res, filePath) => {
      // Hashed assets can be cached long-term
      if (filePath.match(/\.[a-f0-9]{8}\./i)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // Fallback to index.html for client-side routing
  // ⚠️ CRITICAL: Exclude API routes - let them return proper JSON errors
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      // API routes should not fall back to index.html
      res.status(404).json({ message: "API endpoint not found" });
      return;
    }
    // Client-side routing: serve index.html for all other requests
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
