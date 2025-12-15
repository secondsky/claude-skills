# TanStack Start (React) Skill — RC Ready

Full-stack React framework built on TanStack Router with server functions, selective SSR, prerendering, and first-class Cloudflare Workers support. Use this skill for migrations from Next.js, greenfield Start apps, or when you need type-safe server functions plus flexible rendering modes.

## Auto-Trigger Keywords
- "TanStack Start", "Start RC", "React full-stack", "file-based routing"
- "selective SSR", "SPA mode", "static prerender", "server functions"
- "Cloudflare Workers", "Start on Workers", "edge SSR", "router + server"

## Current Status (2025-12-09)
- **Latest RC:** v1.139.12 (2025-11-29)
- **GA:** not announced yet; safe for pilots/POCs with monitoring.
- **Track:** TanStack Router releases + Start guides for breaking changes.

## What You Get
- **References:**  
  - `references/quickstart-and-layout.md` — CLI, project map, entrypoints  
  - `references/rendering-modes.md` — SSR/data-only/CSR, SPA mode, prerender, hydration playbook  
  - `references/server-functions-and-middleware.md` — server functions, routes, middleware, static functions  
  - `references/cloudflare-hosting-and-env.md` — Workers setup, bindings, env vars, Tailwind v4  
  - `references/execution-and-auth.md` — execution model, environment functions, auth/data/observability  
  - `references/routing-and-data-loading.md` — file/code routes, params/search typing, loaders/actions, not-found  
  - `references/navigation-and-preloading.md` — link options, preloading, route masking, blockers, scroll restoration  
  - `references/devtools-and-llm-support.md` — router devtools, ESLint rules, LLM-oriented metadata
- **Script:** `scripts/bootstrap-cloudflare-start.sh <app-name>` scaffolds a Start + Workers project and generates binding types.

## Quick Start (Cloudflare)
```bash
./scripts/bootstrap-cloudflare-start.sh my-start-app
cd my-start-app
npm run dev
```

## Core Patterns (updated)
```tsx
// app/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getGreeting } from '@/server/greeting'

export const Route = createFileRoute('/')({
  ssr: 'data-only', // stream data, render on client
  loader: async () => {
    const greeting = await getGreeting()
    if (!greeting) throw redirect({ to: '/login' })
    return { greeting }
  },
  component: () => {
    const { greeting } = Route.useLoaderData()
    return <h1 className="text-2xl font-semibold">{greeting}</h1>
  },
})
```

```ts
// app/server/greeting.ts
import { createServerFn } from '@tanstack/react-start'

export const getGreeting = createServerFn({ method: 'GET' }).handler(async () => {
  return `Welcome back at ${new Date().toISOString()}`
})
```
- Add `validateSearch` on routes to keep search params typed.
- Use `<Link preload="intent">` for hover/focus preloading; call `router.preloadRoute` for critical nav.
- Enable `<RouterDevtools />` during dev and `@tanstack/eslint-plugin-router` for property-order safety.

## Migrate from Next.js (fast path)
- Keep file-based routes; move pages into `app/routes/` and convert hooks to `Route.useLoaderData()`.
- Replace `getServerSideProps` with route loaders; replace API routes with server routes or server functions.
- Toggle SSR per route (`ssr: true | false | 'data-only'`) to match previous rendering behavior.
- Use `@cloudflare/vite-plugin` + Wrangler instead of `next.config.js` when targeting Workers.

## Troubleshooting Cheats
- Hydration mismatch: move non-deterministic values to loaders or use `ssr: 'data-only'`.
- 404 on API routes: ensure `server.handlers` are defined and file path matches route path.
- Cloudflare env undefined: confirm `cloudflare({ viteEnvironment: { name: 'ssr' } })` is first plugin and bindings are declared in `wrangler.jsonc`.
- Streaming stalls: avoid mixing `Response.json` and streaming in the same handler; prefer `return toStreamResponse(...)` from adapters.

## Verify Before Shipping
- Run `npm run build && npm run preview` locally; then `npm run deploy` against a staging Worker.
- Check `ONE_PAGE_CHECKLIST.md` and keep `wrangler types` regenerated after binding changes.
