# Execution Model, Env Functions, and Auth/Data Patterns

## Execution Model (what runs where)
- Route modules execute on the server for SSR, then on the client after navigation. Avoid side effects at module scope; put work in loaders/components.
- Use environment functions to fence code:
  ```ts
  import { createServerOnlyFn, createClientOnlyFn } from '@tanstack/react-start'

  export const readSecret = createServerOnlyFn(() => process.env.API_KEY!)
  export const focusInput = createClientOnlyFn(() => document.querySelector('input')?.focus())
  ```
- Prefer `createIsomorphicFn()` when you need one call site with server/client branches (e.g., logging to console vs. sending to APM).

## Authentication Building Blocks
- Sessions: `useSession()` in server functions or loaders; store `SESSION_SECRET` in env/binding.
- Protect routes with middleware:
  ```ts
  const requireUser = createMiddleware({ type: 'function' }).server(async ({ next }) => {
    const session = await useSession()
    if (!session.data.userId) throw redirect({ to: '/login' })
    return next({ context: { userId: session.data.userId } })
  })
  ```
- Login/logout as server functions; throw `redirect()` after setting/clearing session.
- Hosted options with examples: Clerk, WorkOS, Auth.js, Supabase (see official examples list).

## Data Layer Guidance
- Keep database clients (D1, Neon, PlanetScale, Prisma, Drizzle) in `app/lib/db.ts` and import only in server functions/server routes.
- For Workers, prefer edge-friendly drivers (D1 binding, Prisma Data Proxy, Postgres HTTP/Neon) to avoid TCP.
- Co-locate validation schemas with server functions to reuse on the client via zod types.

## Observability
- Enable `observability` in `wrangler.jsonc` for request traces; forward `ctx.waitUntil(logger.flush())` in handlers.
- Use `console.log` in server functions; Start surfaces logs in dev and Workers tail. For client, gate logs behind `import.meta.env.DEV`.

## Path Aliases
- Add to `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": { "@/*": ["./app/*"] }
    }
  }
  ```
- Install `vite-tsconfig-paths` and add to `plugins` after `tanstackStart()`.
