import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// ✅ Plugin to generate version.json on every build AND inject build ID into sw.js
// This ensures every deployment gets a unique build identifier baked into the SW file bytes,
// which forces the browser to detect and install the new Service Worker.
const versionPlugin: Plugin = {
  name: 'version-plugin',
  apply: 'build',
  enforce: 'post',
  generateBundle() {
    // Use both timestamp and date for maximum uniqueness
    const now = new Date();
    const version = now.toISOString();
    const timestamp = Date.now();
    const buildId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    
    const versionJson = JSON.stringify({
      version,
      timestamp,
      buildId,
      buildDate: now.toLocaleString(),
    }, null, 2);
    
    console.log(`📦 Version plugin: Generated version ${buildId}`);
    
    // ✅ Emit version.json for client-side version polling
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: versionJson,
    });

    // ✅ Inject build ID into sw.js so its BYTES change every build.
    // The browser's SW update algorithm compares file bytes — if nothing changes,
    // it skips the update. By embedding the build ID, we guarantee a byte change.
    try {
      const swSource = fs.readFileSync(
        path.resolve(import.meta.dirname, 'client', 'public', 'sw.js'),
        'utf-8'
      );
      const swWithBuildId = swSource.replace('__SW_BUILD_ID__', `v-${buildId}`);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swWithBuildId,
      });
      console.log(`📦 Version plugin: Injected build ID into sw.js → v-${buildId}`);
    } catch (err) {
      console.warn('⚠️ Version plugin: Could not inject build ID into sw.js:', err);
    }
  },
};


export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    versionPlugin,
  ],
  define: {
    // Inject build timestamp for cache-busting (available as import.meta.env.VITE_BUILD_TIME)
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(Date.now().toString()),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Disable aggressive caching - add timestamp to output files
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash][extname]',
      },
    },
  },
  server: {
    host: "0.0.0.0",
    fs: {
      strict: false,
    },
    allowedHosts: true,
    // Disable caching in dev mode - always fresh
    middlewareMode: false,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
});
