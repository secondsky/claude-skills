# TanStack Query React Guides — What to Load When

Concise map of the official docs (React framework) and what they unlock. Use this to quickly choose the right reference while implementing features.

## Core
- **Overview / Quick Start** — initial setup, providers, DevTools wiring. Load when bootstrapping a new app.
- **Important Defaults** — explains default `staleTime` (0), `gcTime` (5m), `retry` (3 web / 0 server), `refetchOnWindowFocus` (true), `networkMode: 'online'`. Load when you want to override defaults instead of guessing. citeturn1search0turn1search1
- **Queries & Query Functions** — object syntax, queryFn signature (`({ signal, queryKey })`), error throwing, abort signals. Load when writing fetchers or custom hooks.
- **Query Keys** — hierarchy and serialization rules; how invalidation bubbles to child keys. Load when designing cache strategy.
- **Query Options** — per-query overrides: `staleTime`, `gcTime`, `refetchOnMount`, `refetchInterval`, `select`, `placeholderData`, `enabled`, `meta`, `structuralSharing`.
- **Network Mode** — `'online'`, `'offlineFirst'`, `'always'`. Use `'always'` for SSR/prefetch so requests never pause; `'offlineFirst'` for offline/React Native experiences. citeturn1search1
- **DevTools** — toggles, position, production tree‑shaking. Load when customizing or debugging cache state.

## Fetch Patterns
- **Parallel Queries** — useQueries patterns, `combine` helper, and derived loading states. Load when fetching several independent resources.
- **Dependent Queries** — gating with `enabled` and stable keys; prevents waterfalls.
- **Background Fetching Indicators** — `isFetching`, `isRefetching`, `fetchStatus` to show subtle "Refreshing…" UI.
- **Window Focus Refetching** — when to leave enabled (live data) vs disable (forms, expensive APIs).
- **Disabling Queries** — `enabled: false` and `queryClient.resume/pause` for offline toggles.
- **Query Retries** — default 3, customize via number/function; set to 0 for mutations by default.
- **Query Cancellation** — fetch receives `AbortSignal`; request is canceled when key changes or unmounts.

## Pagination & Streaming
- **Paginated Queries** — `keepPreviousData` replacement via `placeholderData`, page params kept in key.
- **Infinite Queries** — required `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, `maxPages`.
- **Scroll Restoration** — integrates with router history; keep `initialPageParam` stable.

## Data Initialization
- **Initial Query Data** — seed from cache or server hydrate; ensures no loading flash.
- **Placeholder Query Data** — skeletons while fetching; use `placeholderData: keepPreviousData` for smooth pagination.

## Mutations & Cache Sync
- **Mutations** — callbacks still available (`onMutate`, `onError`, `onSettled`, `onSuccess`).
- **Query Invalidation** — granular invalidation using partial keys.
- **Invalidations from Mutations** — patterns for invalidating parent/child keys after writes.
- **Updates from Mutation Responses** — `setQueryData` to merge server response without extra fetch.
- **Optimistic Updates** — `onMutate` snapshot + rollback + invalidate.

## Prefetch & SSR
- **Prefetching** — `prefetchQuery` + `queryOptions` factories to reuse across components.
- **Default Query Function** — set a base fetcher that reads `queryKey`.
- **SSR / Advanced SSR** — `dehydrate`/`HydrationBoundary`, `initialDataUpdatedAt`, and `networkMode: 'always'` to avoid cancellations during render.
- **Caching** — garbage collection timers, `structuralSharing`, cache size considerations.
- **Render Optimizations** — `select`, `placeholderData`, memoized query keys to reduce renders.

## Suspense & Testing
- **Suspense** — use `useSuspenseQuery`/`useSuspenseInfiniteQuery`, avoid `enabled`; rely on boundary fallbacks.
- **Testing** — `QueryClientProvider` per test, `setLogger({ log: () => {} })`, `QueryClient` reset, MSW for network.

## Ecosystem
- **Does This Replace Client State?** — guidance on what stays in local state vs server state.
- **React Native** — use AsyncStorage persister, disable focus refetching; networkMode `'offlineFirst'` helpful.
- **GraphQL** — treat operations as async functions; `select` to unwrap edges/nodes; cache by operation + variables.
- **Migrating to v5** — list of breaking changes: object syntax only, callbacks removed from queries, `gcTime` rename, `isPending` status, `initialPageParam` required, `keepPreviousData` replaced.

> Keep this file loaded alongside SKILL.md when deciding which official guide to open for a specific problem.
