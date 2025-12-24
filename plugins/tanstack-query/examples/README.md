# TanStack Query Examples (Top 10)

Copy-ready, minimal snippets that match the most common asks. Each links to the equivalent official example for deeper context.

| Scenario | Local File | What it shows | Official doc |
|----------|------------|---------------|--------------|
| Basic query | `examples/basic.tsx` | Fetch list with loading/error states | /examples/basic |
| GraphQL (graphql-request) | `examples/basic-graphql-request.tsx` | Typed GraphQL fetcher + `select` | /examples/basic-graphql-request |
| Optimistic update | `examples/optimistic-update.tsx` | `onMutate`/rollback pattern | /examples/optimistic-updates-ui |
| Paginated list | `examples/pagination.tsx` | `placeholderData: keepPreviousData` | /examples/pagination |
| Infinite scroll | `examples/infinite-scroll.tsx` | `useInfiniteQuery` + IntersectionObserver | /examples/load-more-infinite-scroll |
| Prefetch on hover | `examples/prefetching.tsx` | `prefetchQuery` before navigation | /examples/prefetching |
| Suspense | `examples/suspense.tsx` | `useSuspenseQuery` + boundary | /examples/suspense |
| Default query function | `examples/default-query-function.ts` | Global fetcher using `queryKey` | /examples/default-query-function |
| Next.js App Router (SSR hydrate) | `examples/nextjs-app-router.tsx` | `dehydrate` + `HydrationBoundary` with `networkMode: 'always'` | /examples/nextjs-app-prefetching |
| React Native (offline-first) | `examples/react-native.tsx` | AsyncStorage persister, focus disabled | /examples/react-native |

Notes:
- Examples stay framework-agnostic unless specified (Next.js, React Native).
- Align with v5 object syntax (`useQuery({ queryKey, queryFn, ... })`).
- Keep `initialPageParam` in infinite queries (v5 requirement).
- For larger, API-heavy demos (Star Wars, Rick & Morty, Chat, Devtools Panel), use the official repo linked above.***
