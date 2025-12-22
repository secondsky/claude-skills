# Rendering Modes & Hydration

## SSR, Data-Only, or CSR
- Default: routes render + hydrate on the server (`ssr: true`).
- Per-route override:
  ```tsx
  export const Route = createFileRoute('/chart')({
    ssr: 'data-only', // options: true | false | 'data-only'
    loader: () => getChartData(),
    component: Chart,
  })
  ```
- Make SSR opt-in/off by default:
  ```ts
  // app/start.ts
  export const start = createStart(() => ({ defaultSsr: false }))
  ```
- Use the functional form for context-aware SSR: `ssr: ({ params, search }) => search.value?.preview ? 'data-only' : true`.

## SPA Mode (global CSR)
Disable all SSR (loaders + components) when you want a pure SPA but keep Start’s router + server functions:
```ts
export const start = createStart(() => ({
  spaMode: true,
  defaultPreloadStaleTime: 0,
}))
```

## Static Prerender (SSG)
Enable Vite plugin prerendering to emit static HTML during `npm run build`:
```ts
// vite.config.ts
plugins: [
  tanstackStart({
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: true, // crawl links and static routes
      autoSubfolderIndex: true,       // /page/index.html output
    },
  }),
]
```
- Exclude routes with params from auto-discovery; add them via `pages` or ensure crawlable links.
- Combine with Cloudflare Workers Assets/Pages for zero-runtime hosting when no server functions are used.

## Hydration Error Playbook
- Make server + client deterministic: hoist locale/time zone to cookies, avoid `Date.now()` in render, seed random IDs.
- Use `<ClientOnly>` for inherently client-side widgets (e.g., canvas, relative time).
- Prefer `ssr: 'data-only'` instead of suppressing hydration when markup differs.
- Only use `suppressHydrationWarning` for tiny, known-different fragments (timestamps).

## Pending UI for non-SSR routes
- First route with `ssr: false` or `'data-only'` shows `pendingComponent` (or `defaultPendingComponent`) while the client loads.
- Set `minPendingMs` to avoid flash during hydration for CSR-heavy routes.
