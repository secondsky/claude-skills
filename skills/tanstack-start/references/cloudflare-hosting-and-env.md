# Cloudflare Hosting + Environment Management

## Workers Setup (vite-plugin)
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
```

```json
// wrangler.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true }
}
```

Package scripts (Cloudflare docs recommendation):
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build && tsc --noEmit",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler deploy",
    "cf-typegen": "wrangler types"
  }
}
```

## Bindings
- Declare KV/R2/D1/Secrets in `wrangler.jsonc` (`kv_namespaces`, `d1_databases`, `r2_buckets`, `vars`).
- Start exposes bindings to server handlers via the `env` argument when using `createStartHandler` or in the `context` passed to server functions/routes. Keep client code on `import.meta.env`.

## Environment Variables Rules
- Server: use `process.env.SECRET_NAME` or `env.SECRET_NAME` (Workers bindings). No prefix required.
- Client: only `import.meta.env.VITE_*` is available; anything else is stripped at build.
- Load order: `.env.local` → `.env.production`/`.env.development` → `.env`.
- Add `src/env.d.ts` to type `import.meta.env` and prevent typos.

## Tailwind CSS (v4) + Paths
```ts
// vite.config.ts (Tailwind v4)
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})
```
- Create `app/styles/app.css` with `@import 'tailwindcss';` and link in `__root.tsx` using `?url`.
- Enable TS path aliases with `vite-tsconfig-paths` to keep imports short (`@/lib/db`). Add to `plugins` and `tsconfig.json` `paths`.

## Deployment Checklist
- `wrangler login` once per machine; CI uses `CLOUDFLARE_API_TOKEN`.
- `npm run cf-typegen` after adding bindings to keep types in sync.
- For streaming/server functions on Workers, keep `cloudflare({ viteEnvironment: { name: 'ssr' } })` first in plugins so fetch handler binds correctly.
- If using prerender + static server functions, ensure KV/R2 assets bucket is configured to serve generated JSON alongside HTML.
