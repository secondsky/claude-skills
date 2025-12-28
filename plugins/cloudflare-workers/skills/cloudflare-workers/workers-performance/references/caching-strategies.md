# Caching Strategies for Cloudflare Workers

Comprehensive guide to caching at the edge for maximum performance.

## Cache Layers

```
Request → Memory Cache → Edge Cache (Cache API) → KV → Origin
           (fastest)      (per-colo)              (global)  (slowest)
```

| Layer | Latency | Scope | TTL | Use Case |
|-------|---------|-------|-----|----------|
| Memory | <1ms | Request | Request duration | Computed values |
| Cache API | 1-5ms | Per colo | Custom | HTTP responses |
| KV | 10-50ms | Global | Custom | Persistent data |

## Cache API

### Basic Usage

```typescript
const cache = caches.default;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Check cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Generate response
    const response = await generateResponse(request, env);

    // Cache response (non-blocking)
    const cacheableResponse = new Response(response.body, response);
    cacheableResponse.headers.set('Cache-Control', 'max-age=3600');

    // Don't await - cache in background
    cache.put(request, cacheableResponse.clone());

    return response;
  }
};
```

### Custom Cache Keys

```typescript
function getCacheKey(request: Request): Request {
  const url = new URL(request.url);

  // Normalize URL
  url.searchParams.sort();

  // Remove tracking params
  url.searchParams.delete('utm_source');
  url.searchParams.delete('utm_medium');
  url.searchParams.delete('utm_campaign');

  // Include important headers in key
  const headers = new Headers();
  headers.set('Accept', request.headers.get('Accept') || '*/*');

  return new Request(url.toString(), {
    method: 'GET',
    headers,
  });
}

// Usage
const cacheKey = getCacheKey(request);
const cached = await cache.match(cacheKey);
```

### Vary-Based Caching

```typescript
async function cacheWithVary(
  request: Request,
  response: Response,
  varyHeaders: string[]
): Promise<void> {
  const cache = caches.default;

  // Create unique cache key based on Vary headers
  const url = new URL(request.url);

  for (const header of varyHeaders) {
    const value = request.headers.get(header);
    if (value) {
      url.searchParams.set(`_vary_${header}`, value);
    }
  }

  const cacheKey = new Request(url.toString());
  const cacheableResponse = new Response(response.body, response);
  cacheableResponse.headers.set('Vary', varyHeaders.join(', '));

  await cache.put(cacheKey, cacheableResponse);
}
```

## Stale-While-Revalidate

```typescript
interface SWROptions {
  cache: Cache;
  maxAge: number;
  staleWhileRevalidate: number;
}

async function fetchWithSWR(
  request: Request,
  fetcher: () => Promise<Response>,
  options: SWROptions
): Promise<Response> {
  const { cache, maxAge, staleWhileRevalidate } = options;

  const cached = await cache.match(request);

  if (cached) {
    const age = getAge(cached);

    // Fresh - return immediately
    if (age < maxAge) {
      return cached;
    }

    // Stale but within revalidate window
    if (age < maxAge + staleWhileRevalidate) {
      // Return stale, revalidate in background
      revalidate(request, fetcher, cache, maxAge);
      return cached;
    }
  }

  // No cache or too stale - fetch fresh
  const response = await fetcher();
  await cacheResponse(request, response.clone(), cache, maxAge);
  return response;
}

function getAge(response: Response): number {
  const date = response.headers.get('Date');
  if (!date) return Infinity;

  return (Date.now() - new Date(date).getTime()) / 1000;
}

async function revalidate(
  request: Request,
  fetcher: () => Promise<Response>,
  cache: Cache,
  maxAge: number
): Promise<void> {
  try {
    const response = await fetcher();
    await cacheResponse(request, response, cache, maxAge);
  } catch {
    // Keep serving stale on revalidation failure
  }
}

async function cacheResponse(
  request: Request,
  response: Response,
  cache: Cache,
  maxAge: number
): Promise<void> {
  const cached = new Response(response.body, response);
  cached.headers.set('Cache-Control', `max-age=${maxAge}`);
  cached.headers.set('Date', new Date().toUTCString());
  await cache.put(request, cached);
}
```

## KV-Based Caching

### Simple KV Cache

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class KVCache<T> {
  constructor(
    private kv: KVNamespace,
    private prefix = 'cache:'
  ) {}

  async get(key: string): Promise<T | null> {
    const entry = await this.kv.get<CacheEntry<T>>(
      this.prefix + key,
      'json'
    );

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      // Expired - delete in background
      this.kv.delete(this.prefix + key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: T, ttlSeconds = 3600): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    };

    await this.kv.put(this.prefix + key, JSON.stringify(entry), {
      expirationTtl: ttlSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(this.prefix + key);
  }
}
```

### Cache-Aside Pattern

```typescript
class CacheAside<T> {
  constructor(
    private cache: KVCache<T>,
    private ttl: number
  ) {}

  async get(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Store in cache (non-blocking)
    this.cache.set(key, data, this.ttl);

    return data;
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}

// Usage
const userCache = new CacheAside<User>(kvCache, 3600);

const user = await userCache.get(`user:${userId}`, async () => {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
});
```

## Multi-Layer Cache

```typescript
interface CacheLayer<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
}

class MultiLayerCache<T> {
  private layers: CacheLayer<T>[];

  constructor(layers: CacheLayer<T>[]) {
    this.layers = layers;
  }

  async get(key: string): Promise<T | null> {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get(key);

      if (value !== null) {
        // Populate upper layers
        for (let j = 0; j < i; j++) {
          this.layers[j].set(key, value);
        }
        return value;
      }
    }

    return null;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    await Promise.all(
      this.layers.map(layer => layer.set(key, value, ttl))
    );
  }
}

// Memory layer
class MemoryCache<T> implements CacheLayer<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: T, ttl = 60): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }
}

// Edge cache layer
class EdgeCache<T> implements CacheLayer<T> {
  private cache = caches.default;

  async get(key: string): Promise<T | null> {
    const response = await this.cache.match(new Request(`https://cache/${key}`));
    return response ? response.json() : null;
  }

  async set(key: string, value: T, ttl = 3600): Promise<void> {
    await this.cache.put(
      new Request(`https://cache/${key}`),
      new Response(JSON.stringify(value), {
        headers: { 'Cache-Control': `max-age=${ttl}` },
      })
    );
  }
}

// Usage
const cache = new MultiLayerCache<User>([
  new MemoryCache(),  // Fast, request-scoped
  new EdgeCache(),    // Medium, per-colo
  new KVCache(env.KV) // Slow, global
]);
```

## Cache Invalidation

### Tag-Based Invalidation

```typescript
interface TaggedCacheEntry<T> {
  data: T;
  tags: string[];
}

class TaggedCache<T> {
  constructor(private kv: KVNamespace) {}

  async set(key: string, data: T, tags: string[], ttl = 3600): Promise<void> {
    // Store entry
    await this.kv.put(
      `entry:${key}`,
      JSON.stringify({ data, tags }),
      { expirationTtl: ttl }
    );

    // Update tag indexes
    for (const tag of tags) {
      const tagKeys = await this.kv.get<string[]>(`tag:${tag}`, 'json') || [];
      if (!tagKeys.includes(key)) {
        tagKeys.push(key);
        await this.kv.put(`tag:${tag}`, JSON.stringify(tagKeys));
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKeys = await this.kv.get<string[]>(`tag:${tag}`, 'json') || [];

    await Promise.all(
      tagKeys.map(key => this.kv.delete(`entry:${key}`))
    );

    await this.kv.delete(`tag:${tag}`);
  }
}

// Usage
await taggedCache.set('user:123', userData, ['users', 'team:456']);

// Invalidate all users
await taggedCache.invalidateByTag('users');
```

### Purge API

```typescript
async function purgeCache(urls: string[], apiToken: string, zoneId: string): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    }
  );

  if (!response.ok) {
    throw new Error(`Cache purge failed: ${response.statusText}`);
  }
}
```

## Cache Headers

### Setting Cache Headers

```typescript
function setCacheHeaders(
  response: Response,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    private?: boolean;
    noStore?: boolean;
  }
): Response {
  const newResponse = new Response(response.body, response);
  const directives: string[] = [];

  if (options.noStore) {
    directives.push('no-store');
  } else {
    if (options.private) {
      directives.push('private');
    } else {
      directives.push('public');
    }

    if (options.maxAge !== undefined) {
      directives.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      directives.push(`s-maxage=${options.sMaxAge}`);
    }

    if (options.staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }

    if (options.staleIfError !== undefined) {
      directives.push(`stale-if-error=${options.staleIfError}`);
    }
  }

  newResponse.headers.set('Cache-Control', directives.join(', '));

  return newResponse;
}

// Usage
const response = setCacheHeaders(originalResponse, {
  maxAge: 60,           // Browser cache: 1 minute
  sMaxAge: 3600,        // CDN cache: 1 hour
  staleWhileRevalidate: 86400,  // Serve stale for 1 day while revalidating
  staleIfError: 86400,  // Serve stale for 1 day on origin error
});
```
