import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

// ⚠️ CRITICAL: Environment check at module level
const isDev = process.env.NODE_ENV === "development";

// Only declare these if in development
let createViteServer: any = null;
let createLogger: any = null;
let viteConfig: any = null;

/**
 * Load Vite and vite.config ONLY in development mode
 * This function is safe to call in production - it returns immediately
 */
const loadVite = async () => {
  if (!isDev) {
    // 🚀 PRODUCTION: Do not attempt to load Vite or vite.config
    return;
  }

  // ✅ DEVELOPMENT ONLY: Load Vite modules
  if (!createViteServer) {
    try {
      const viteModule = await import("vite");
      createViteServer = viteModule.createServer;
      createLogger = viteModule.createLogger;
    } catch (error) {
      console.error("❌ Failed to load vite module:", error);
      throw new Error("Vite must be installed in development mode");
    }
  }

  if (!viteConfig) {
    try {
      // @ts-ignore - vite.config only exists in dev, not in production
      const config = await import("../../vite.config");
      viteConfig = config.default;
    } catch (error) {
      console.error("❌ Failed to load vite.config:", error);
      throw new Error("vite.config must exist and be valid in development mode");
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
 * Setup Vite dev server - DEVELOPMENT ONLY
 * 
 * In production: This function returns immediately, NO side effects
 * In development: Sets up Vite HMR and middleware
 */
export async function setupVite(app: Express, server: Server) {
  if (!isDev) {
    // 🚀 PRODUCTION: Skip all Vite setup
    return;
  }

  // ✅ DEVELOPMENT: Load and setup Vite
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
 * Serve static files - PRODUCTION ONLY
 * 
 * In development: Can be called but mainly for fallback
 * In production: Required for frontend delivery
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    const errorMsg = `❌ CRITICAL: Frontend build not found: ${distPath}
    
    Cause: 'npm run build:client' was not run before deployment
    Fix: Build frontend before deploying to production
    
    Steps:
      1. npm run build:client
      2. Redeploy`;
    
    console.error(errorMsg);
    
    if (isDev) {
      console.warn("⚠️  Continuing without frontend (dev mode)");
      return;
    }
    
    // 🚀 PRODUCTION: Cannot continue without built frontend
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
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
