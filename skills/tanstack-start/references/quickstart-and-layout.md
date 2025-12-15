# TanStack Start Quickstart & Layout

## Scaffold Commands
- `npm create @tanstack/start@latest my-app` — official CLI (React + Vite).
- `npm create cloudflare@latest -- --framework=tanstack-start my-app` — preconfigures Cloudflare Workers + wrangler.
- `npm install` then `npm run dev` (port 3000 by default), `npm run build`, `npm run preview`.
- Manual installs (when you already have a bundler):
  - Vite: `npm i @tanstack/react-router @tanstack/react-start @tanstack/router-plugin`
  - Webpack: `npm i @tanstack/react-router @tanstack/react-start @tanstack/router-plugin`
  - Esbuild/Rspack: `npm i @tanstack/react-router @tanstack/react-start @tanstack/router-plugin`
  Add the matching plugin entry point (`@tanstack/router-plugin/vite|webpack|esbuild|rspack`) to your bundler config and call `createRouter()` / `createStart()` in your entry.

## Generated File Map (React)
- `app/config.ts` (or `app/start.ts` in newer templates) — calls `createStart` and wires router + defaults (e.g., `defaultSsr`).
- `app/routes/` — file-based routes (`__root.tsx`, `index.tsx`, `posts/$postId.tsx`, etc.).
- `app/entry.client.tsx` — hydrates with `<StartClient />` via `hydrateRoot`.
- `app/entry.server.tsx` — wraps the universal fetch handler with `createServerEntry`.
- `app/server-functions/` (optional) — colocate `createServerFn` handlers you import into routes/components.
- `public/` — static assets served as-is.

## Minimal Route Example
```tsx
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async () => ({ now: new Date().toISOString() }),
  component: () => {
    const { now } = Route.useLoaderData()
    return <h1 className="text-xl font-semibold">Hello from Start — {now}</h1>
  },
})
```

## Entry Points Cheat Sheet
- Client (`app/entry.client.tsx`):
  ```tsx
  import { StartClient } from '@tanstack/react-start/client'
  import { hydrateRoot } from 'react-dom/client'
  import { StrictMode } from 'react'

  hydrateRoot(document, <StrictMode><StartClient /></StrictMode>)
  ```
- Server (`app/entry.server.tsx`):
  ```tsx
  import handler from './handler'
  import { createServerEntry } from '@tanstack/react-start/server'

  const entry = createServerEntry({
    fetch(request, opts) {
      return handler.fetch(request, opts)
    },
  })

  export default {
    fetch(request: Request, env: unknown, ctx: ExecutionContext) {
      return entry.fetch(request, env, ctx)
    },
  }
  ```
  Add custom middleware/headers by wrapping `handler.fetch` with `createStartHandler` when needed.

## Everyday DX Tips
- Keep shared types in `app/types.ts` and import in routes + server functions.
- Use `tsconfig.paths` + `vite-tsconfig-paths` so imports stay short (`@/routes/...`).
- Prefer `npm run check` (or `pnpm check`) to catch route type drift before deploy.
