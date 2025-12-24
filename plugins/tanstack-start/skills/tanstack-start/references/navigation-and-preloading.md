# Navigation, Preloading, and UX

## Link Options
- Use `<Link preload="intent">` to preload on hover/focus; switch to `preload="render"` for above-the-fold routes or `preload={false}` for rarely visited pages.
- Pass `resetScroll`/`replace`/`target` only when needed; defaults keep back/forward UX predictable.
- Build custom links with `router.buildLink()` to reuse the same preloading semantics across design systems.

## Programmatic Preloading
- Warm caches before navigation:
```ts
router.preloadRoute({ to: '/products/$id', params: { id }, search: { preview: true } })
```
- Pair with `defaultPreloadStaleTime` to avoid refetch storms when hovering multiple links quickly.

## Route Masking
- Keep canonical URLs while displaying masked, user-friendly paths (`mask: { to: '/p/$id' }`); masks update the address bar without changing the matched route.
- Good for A/B or marketing URLs that should still resolve to canonical data paths.

## Navigation Blocking
- Use `useBlocker` or `router.block()` inside forms to guard unsaved changes; unblock after save or explicit discard.
- Provide a confirm dialog and redirect target for failed saves to avoid dead-end states.

## Scroll Restoration
- Enable `scrollRestoration` globally, then override per route for long lists (e.g., restore previous position on back/forward but scroll to top on fresh navigation).
- Combine with `pendingComponent` to avoid layout jumps while data loads.

## Document Head
- Set `head` per route using loader data for titles/meta; avoid reading `window` directly to keep SSR safe.
- Keep head updates deterministic (no `Date.now()`), or move non-deterministic pieces behind `ssr: 'data-only'` routes.
