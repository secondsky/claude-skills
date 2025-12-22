# Routing & Data Loading (TanStack Start / Router)

## Route Tree and File-Based Routing
- Files under `app/routes/**` become routes; `createFileRoute()` infers params and builds the route tree automatically. Use code-based routes (`createRootRoute`, `createRoute`, `rootRoute.addChildren`) when you need dynamic composition.  
- Route matching order: index → static segments → dynamic (`$id`) → splat (`$`), so place catch-alls last to avoid accidental matches.

## Path + Search Params (Type Safe)
- Path params are typed from the file name (`/posts/$postId.tsx` → `{ postId: string }`).
- Add `validateSearch` with zod to coerce/validate search params:
```ts
export const Route = createFileRoute('/posts/')({
  validateSearch: z.object({ page: z.coerce.number().default(1) }),
})
```
- For custom serialization (dates, arrays), provide `parseSearch`/`stringifySearch` to keep types stable across navigations.

## Loaders (data fetching)
- `loader` runs once per location change; return plain data or throw `redirect()` / `notFound()` to control flow.
- Keep loaders pure and side-effect free; mutations should live in actions or server functions.
- Access router context (`context.queryClient`, user/session, env) via the loader signature.

## Deferred + External Data
- When upstream latency is high, return partial data and stream the rest using deferred responses; pair with suspense boundaries in components.
- External data loaders can live outside route files; pass them into `loader` to keep route modules lean.

## Mutations
- Use route `action` (or Start server functions) for writes; invalidate affected routes with `router.invalidate()` or query invalidation when using TanStack Query.
```ts
export const Route = createFileRoute('/posts/new')({
  action: async ({ data, context }) => {
    await context.api.createPost(data)
    await context.queryClient.invalidateQueries({ queryKey: ['posts'] })
    return redirect({ to: '/posts' })
  },
})
```

## Static Route Data
- Add `staticData` for values that never change (e.g., breadcrumb labels); Start can inline this in prerendered builds to avoid runtime fetches.

## Error & Not-Found Handling
- Throw `notFound()` inside loaders/actions for 404s; render per-route `notFoundComponent` or an error boundary to show friendly UX.
- Prefer structured errors over generic throws so error boundaries can branch on status/type.
