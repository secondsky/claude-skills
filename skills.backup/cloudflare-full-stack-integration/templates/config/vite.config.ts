/**
 * Vite Configuration for Cloudflare Workers + React
 *
 * This configuration uses @cloudflare/vite-plugin to run your Worker
 * alongside your frontend on the SAME port during development.
 *
 * NO PROXY NEEDED! The Worker and frontend run together.
 *
 * Key features:
 * - Worker runs on same port as frontend (e.g., localhost:5173)
 * - API routes (like /api/*) go to Worker
 * - Static assets served from frontend
 * - Hot Module Replacement (HMR) for both frontend and backend
 *
 * @package vite version 7.1.11+
 * @package @cloudflare/vite-plugin version 1.13.14+
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    /**
     * Cloudflare Vite Plugin
     *
     * This plugin:
     * 1. Runs your Worker in workerd (Cloudflare's runtime)
     * 2. Provides access to bindings (D1, KV, R2, etc.) locally
     * 3. Serves Worker on SAME port as frontend
     * 4. Enables debugging with Chrome DevTools at /__debug
     */
    cloudflare({
      /**
       * Path to your wrangler configuration
       *
       * By default, looks for wrangler.jsonc, wrangler.json, or wrangler.toml
       * in the project root.
       */
      configPath: './wrangler.jsonc',

      /**
       * Persist state between restarts
       *
       * Default: .wrangler/state
       * Set to false to disable persistence
       */
      persistState: true,

      /**
       * Inspector port for debugging
       *
       * Default: 9229
       * Set to false to disable
       *
       * Access DevTools at: http://localhost:5173/__debug
       */
      inspectorPort: 9229,
    }),
  ],

  /**
   * Path aliases for cleaner imports
   *
   * Usage:
   *   import { apiClient } from '@/lib/api-client'
   *   import { Button } from '@/components/ui/button'
   */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  /**
   * Development server configuration
   */
  server: {
    port: 5173,
    strictPort: false, // Use next available port if 5173 is taken
    open: false, // Don't auto-open browser
  },

  /**
   * Build configuration
   */
  build: {
    /**
     * Output directory for built files
     *
     * Default: dist
     * Cloudflare plugin will create Worker output in dist/worker
     */
    outDir: 'dist',

    /**
     * Source maps for debugging
     */
    sourcemap: true,

    /**
     * Minification
     */
    minify: 'esbuild',

    /**
     * Target modern browsers
     */
    target: 'esnext',
  },

  /**
   * Environment variables
   *
   * Frontend vars MUST start with VITE_ to be exposed to client code.
   *
   * Create a .env file:
   *   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   *
   * Access in code:
   *   const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
   */
  envPrefix: 'VITE_',

  /**
   * Preview server (for testing production build locally)
   */
  preview: {
    port: 4173,
  },
})

/**
 * How API Routing Works with @cloudflare/vite-plugin
 *
 * 1. During development (`npm run dev`):
 *    - Frontend runs on http://localhost:5173
 *    - Worker ALSO runs on http://localhost:5173
 *    - Requests to /api/* → Worker
 *    - Requests to /* → Frontend (React)
 *
 * 2. In production (after `npm run build` and `npx wrangler deploy`):
 *    - Everything runs on your workers.dev subdomain
 *    - Same routing: /api/* → Worker, /* → Static assets
 *
 * 3. NO PROXY NEEDED:
 *    - ❌ Don't add Vite proxy configuration
 *    - ❌ Don't use different ports for frontend/backend
 *    - ✅ Just use relative URLs: fetch('/api/data')
 */

/**
 * TypeScript Support
 *
 * Add to your tsconfig.json:
 *
 * {
 *   "compilerOptions": {
 *     "baseUrl": ".",
 *     "paths": {
 *       "@/*": ["./src/*"]
 *     }
 *   }
 * }
 */

/**
 * Common Issues and Solutions
 *
 * ❌ Error: "Cannot find module '@cloudflare/vite-plugin'"
 * Fix: npm install @cloudflare/vite-plugin --save-dev
 *
 * ❌ Error: "Worker not responding to /api/* requests"
 * Fix: Check wrangler.jsonc - make sure "run_worker_first": ["/api/*"]
 *
 * ❌ Error: "Bindings not available in development"
 * Fix: Check wrangler.jsonc has correct binding configuration
 *
 * ❌ Error: "Port 5173 already in use"
 * Fix: Set strictPort: false or change port number
 *
 * ❌ Error: Frontend can't access env vars
 * Fix: Make sure vars start with VITE_ and are in .env file (not .dev.vars)
 */
