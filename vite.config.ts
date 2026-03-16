import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// ✅ Plugin to generate version.json on every build
// This ensures every deployment gets a unique version identifier
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
    
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: versionJson,
    });
  },
};

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    versionPlugin,
  ],
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
