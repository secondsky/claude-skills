# Server Functions, Routes & Middleware

## Server Functions (RPC-style)
```ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const saveNote = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ body: z.string().min(1) }))
  .handler(async ({ data, request }) => {
    const userId = request.headers.get('x-user-id')
    if (!userId) throw new Response('Unauthorized', { status: 401 })
    await db.notes.insert({ userId, body: data.body })
    return { ok: true }
  })

// Call from client or loaders:
await saveNote({ body: 'hello' })
```
- Runs only on the server; the client call becomes a fetch to the compiled endpoint.
- Access request with `getRequest()` helpers or handler args; headers/cookies available.
- Return plain data, `Response`, redirects (`throw redirect({ to: '/login' })`), or not-found.

### Static server functions (prerender-friendly)
```ts
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions'

export const cachedSettings = createServerFn()
  .middleware([staticFunctionMiddleware]) // execute at build, emit static JSON
  .handler(async () => fetchSettingsFromCms())
```

## Server Routes (raw HTTP)
```ts
// app/routes/api/health.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => Response.json({ ok: true, at: Date.now() }),
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ echoed: body })
      },
    },
  },
})
```
- Lives beside page routes; supports params (`/api/users/$id.ts`), splats, and route-level middleware.
- Use for webhooks, form posts, or streaming responses without React render.

## Middleware Patterns
```ts
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

const requireAuth = createMiddleware({ type: 'function' })
  .server(async ({ next, context }) => {
    const user = await getSessionUser()
    if (!user) throw redirect({ to: '/login' })
    return next({ context: { user } })
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .handler(async ({ data, context }) => {
    return db.user.update(context.user.id, data)
  })
```
- `createMiddleware()` defaults to request middleware; use `{ type: 'function' }` for server-function-specific flows.
- Chain middleware with `.middleware([...])`; always `return next()` to continue.
- Register global middleware in `createStart(() => ({ requestMiddleware: [...], functionMiddleware: [...] }))`.

## Error Boundaries & Hydration Safety
- Throw `redirect()` or `notFound()` from loaders/server functions; Start will surface in route error boundaries.
- For hydration-sensitive components, pair with `ssr: 'data-only'` (see rendering-modes.md) or wrap UI in a client-only boundary.
