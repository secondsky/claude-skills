# Cache API in Cloudflare Workers

Caching responses at the edge for improved performance.

## Cache Types

| Cache | Scope | Use Case |
|-------|-------|----------|
| `caches.default` | Cloudflare's edge cache | CDN caching, shared across workers |
| `caches.open('name')` | Custom named cache | Worker-specific caching |

## Basic Usage

### Read from Cache

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cache = caches.default;
    const cacheKey = new Request(request.url, { method: 'GET' });

    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch and cache
    const response = await fetch(request);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};
```

### Custom Cache Key

```typescript
function createCacheKey(request: Request): Request {
  const url = new URL(request.url);

  // Include specific query params in cache key
  const cacheUrl = new URL(url.origin + url.pathname);
  cacheUrl.searchParams.set('version', url.searchParams.get('version') || 'v1');

  return new Request(cacheUrl.toString(), {
    method: 'GET',
    headers: {
      // Include headers that affect response
      'Accept-Language': request.headers.get('Accept-Language') || 'en',
    },
  });
}
```

## Cache Control

### Setting Cache TTL

```typescript
async function cacheWithTTL(
  cache: Cache,
  cacheKey: Request,
  response: Response,
  ttlSeconds: number
): Promise<void> {
  const cachedResponse = new Response(response.body, response);

  // Set cache headers
  cachedResponse.headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);

  await cache.put(cacheKey, cachedResponse);
}
```

### Cache Headers

```typescript
// Vary by header (different cache per value)
response.headers.set('Vary', 'Accept-Language, Accept-Encoding');

// Cache for 1 hour
response.headers.set('Cache-Control', 'public, max-age=3600');

// Cache for 1 hour, stale-while-revalidate for 1 day
response.headers.set(
  'Cache-Control',
  'public, max-age=3600, stale-while-revalidate=86400'
);

// Don't cache
response.headers.set('Cache-Control', 'no-store');

// Private cache (browser only, not CDN)
response.headers.set('Cache-Control', 'private, max-age=3600');
```

## Cache Patterns

### Cache Aside Pattern

```typescript
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cache = caches.default;
  const request = new Request(`https://cache/${cacheKey}`);

  // Try cache
  const cached = await cache.match(request);
  if (cached) {
    return cached.json();
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  const response = Response.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${ttlSeconds}`,
    },
  });

  await cache.put(request, response);

  return data;
}

// Usage
const users = await getCachedOrFetch(
  'users-list',
  () => db.query('SELECT * FROM users'),
  300
);
```

### Stale-While-Revalidate

```typescript
async function staleWhileRevalidate(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);

  // Return stale and refresh in background
  if (cached) {
    // Check if stale (past max-age but within stale-while-revalidate)
    const age = parseInt(cached.headers.get('Age') || '0');
    const maxAge = 3600; // 1 hour

    if (age > maxAge) {
      // Revalidate in background
      ctx.waitUntil(refreshCache(request, cache));
    }

    return cached;
  }

  // No cache - fetch and cache
  return fetchAndCache(request, cache, ctx);
}

async function refreshCache(request: Request, cache: Cache): Promise<void> {
  const fresh = await fetch(request);
  if (fresh.ok) {
    const response = new Response(fresh.body, fresh);
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    await cache.put(request, response);
  }
}
```

### Cache with Fallback

```typescript
async function cacheWithFallback(
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const cache = caches.default;

  try {
    // Try origin
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful response
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    }

    // Origin error - try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return response; // Return error response
  } catch (error) {
    // Network error - try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    throw error;
  }
}
```

## Cache Invalidation

### Delete Single Entry

```typescript
async function invalidateCache(cacheKey: string): Promise<boolean> {
  const cache = caches.default;
  const request = new Request(`https://cache/${cacheKey}`);
  return cache.delete(request);
}
```

### Purge by Tag (Using Cloudflare API)

```typescript
async function purgeByTag(
  zoneId: string,
  tags: string[],
  apiToken: string
): Promise<void> {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tags }),
  });
}
```

### Versioned Cache Keys

```typescript
// Include version in cache key to invalidate on deployment
const CACHE_VERSION = 'v1';

function createVersionedCacheKey(path: string): Request {
  return new Request(`https://cache/${CACHE_VERSION}/${path}`);
}
```

## Named Caches

```typescript
// Create named cache for specific purpose
const apiCache = await caches.open('api-responses');
const imageCache = await caches.open('image-cache');

// Use like default cache
await apiCache.put(request, response);
const cached = await apiCache.match(request);
await apiCache.delete(request);
```

## Cache Headers Explained

| Header | Purpose | Example |
|--------|---------|---------|
| `Cache-Control` | Caching directives | `public, max-age=3600` |
| `Vary` | Cache key variations | `Vary: Accept-Language` |
| `ETag` | Content validation | `ETag: "abc123"` |
| `Last-Modified` | Time-based validation | `Last-Modified: Wed, 01 Jan 2025 00:00:00 GMT` |
| `Age` | Time since cached | `Age: 600` |
| `X-Cache` | Custom cache status | `X-Cache: HIT` |

## Best Practices

1. **Use appropriate TTLs** - Balance freshness vs performance
2. **Vary by relevant headers** - Don't over-vary (cache explosion)
3. **Handle cache misses gracefully** - Always have fallback
4. **Version your cache keys** - Easy invalidation on deploy
5. **Don't cache personalized content** - Unless using `Vary` properly
6. **Use stale-while-revalidate** - Better UX for stale data
7. **Monitor cache hit rates** - Optimize based on data
