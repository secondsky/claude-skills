/**
 * Optimized Cloudflare Worker Template
 *
 * Features:
 * - Performance-first architecture
 * - Multi-layer caching
 * - Lazy initialization
 * - Streaming responses
 * - Cold start optimization
 * - Request coalescing
 *
 * Usage:
 * 1. Copy as src/index.ts
 * 2. Configure wrangler.jsonc
 * 3. Customize handlers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';

// ============================================
// TYPES
// ============================================

interface Env {
  ENVIRONMENT: string;
  KV: KVNamespace;
  DB: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================
// LAZY INITIALIZATION
// ============================================

// Avoid expensive top-level operations
// Initialize on first use, reuse across requests

let dbInitialized = false;
let routeCache: Map<string, unknown> | undefined;

function getRouteCache(): Map<string, unknown> {
  if (!routeCache) {
    routeCache = new Map();
  }
  return routeCache;
}

// ============================================
// COLD START TRACKING
// ============================================

let isWarm = false;
let requestCount = 0;

function trackColdStart(): boolean {
  const wasCold = !isWarm;
  isWarm = true;
  requestCount++;
  return wasCold;
}

// ============================================
// MEMORY CACHE (Per-Isolate)
// ============================================

class IsolateCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set(key: string, data: T, ttl = 60): void {
    // Evict oldest if full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Singleton cache instance (persists across requests in same isolate)
const memoryCache = new IsolateCache<unknown>(100);

// ============================================
// REQUEST COALESCING
// ============================================

const inflight = new Map<string, Promise<unknown>>();

async function coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Check if request already in flight
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Start new request
  const promise = fetcher().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

// ============================================
// MULTI-LAYER CACHE
// ============================================

async function getCached<T>(
  key: string,
  kv: KVNamespace,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  // Layer 1: Memory cache
  const memCached = memoryCache.get(key) as T | undefined;
  if (memCached !== undefined) {
    return memCached;
  }

  // Layer 2: Edge cache
  const edgeCache = caches.default;
  const cacheKey = new Request(`https://cache/${key}`);
  const edgeCached = await edgeCache.match(cacheKey);

  if (edgeCached) {
    const data = await edgeCached.json<T>();
    memoryCache.set(key, data, ttl);
    return data;
  }

  // Layer 3: KV
  const kvCached = await kv.get<T>(key, 'json');
  if (kvCached !== null) {
    // Populate upper layers
    memoryCache.set(key, kvCached, ttl);
    edgeCache.put(
      cacheKey,
      new Response(JSON.stringify(kvCached), {
        headers: { 'Cache-Control': `max-age=${ttl}` },
      })
    );
    return kvCached;
  }

  // Cache miss - fetch and populate all layers
  const data = await coalesce(key, fetcher);

  // Don't await - populate cache in background
  Promise.all([
    kv.put(key, JSON.stringify(data), { expirationTtl: ttl }),
    edgeCache.put(
      cacheKey,
      new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': `max-age=${ttl}` },
      })
    ),
  ]);

  memoryCache.set(key, data, ttl);

  return data;
}

// ============================================
// STREAMING UTILITIES
// ============================================

function streamJSON<T>(
  items: AsyncIterable<T>,
  transform?: (item: T) => unknown
): ReadableStream {
  let first = true;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('['));

      for await (const item of items) {
        if (!first) {
          controller.enqueue(encoder.encode(','));
        }
        first = false;

        const data = transform ? transform(item) : item;
        controller.enqueue(encoder.encode(JSON.stringify(data)));
      }

      controller.enqueue(encoder.encode(']'));
      controller.close();
    },
  });
}

// ============================================
// OPTIMIZED DATABASE QUERIES
// ============================================

async function* queryBatched<T>(
  db: D1Database,
  sql: string,
  batchSize = 100
): AsyncGenerator<T> {
  let offset = 0;

  while (true) {
    const { results } = await db
      .prepare(`${sql} LIMIT ${batchSize} OFFSET ${offset}`)
      .all<T>();

    if (results.length === 0) break;

    for (const row of results) {
      yield row;
    }

    if (results.length < batchSize) break;
    offset += batchSize;
  }
}

// ============================================
// APP SETUP
// ============================================

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());
app.use('*', compress());

// Performance tracking middleware
app.use('*', async (c, next) => {
  const start = performance.now();
  const isCold = trackColdStart();

  await next();

  const duration = performance.now() - start;

  // Add timing headers
  c.res.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  c.res.headers.set('X-Cold-Start', isCold.toString());
  c.res.headers.set('X-Request-Count', requestCount.toString());

  // Log slow requests
  if (duration > 50) {
    console.warn('Slow request:', {
      path: c.req.path,
      duration: `${duration.toFixed(2)}ms`,
      cold: isCold,
    });
  }
});

// ============================================
// ROUTES
// ============================================

// Health check (minimal processing)
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    cold: !isWarm,
    requests: requestCount,
  });
});

// Cached data endpoint
app.get('/api/data/:key', async (c) => {
  const key = c.req.param('key');

  const data = await getCached(
    `data:${key}`,
    c.env.KV,
    async () => {
      // Expensive fetch - only runs on cache miss
      const result = await c.env.DB
        .prepare('SELECT * FROM data WHERE key = ?')
        .bind(key)
        .first();
      return result;
    },
    300 // 5 min TTL
  );

  if (!data) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(data);
});

// Streaming large dataset
app.get('/api/items', async (c) => {
  const items = queryBatched<{ id: string; name: string }>(
    c.env.DB,
    'SELECT id, name FROM items ORDER BY created_at DESC'
  );

  return new Response(streamJSON(items), {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
});

// Batch operations
app.post('/api/batch', async (c) => {
  const { operations } = await c.req.json<{
    operations: Array<{ type: string; data: unknown }>;
  }>();

  // Process in parallel batches
  const batchSize = 10;
  const results: unknown[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((op) => processOperation(c.env, op))
    );
    results.push(...batchResults);
  }

  return c.json({ results });
});

async function processOperation(
  env: Env,
  op: { type: string; data: unknown }
): Promise<unknown> {
  // Implementation
  return { success: true, type: op.type };
}

// ============================================
// ERROR HANDLING
// ============================================

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
  });

  return c.json(
    {
      error: 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
    },
    500
  );
});

// ============================================
// EXPORT
// ============================================

export default {
  fetch: app.fetch,

  // Optional: Scheduled handler for cache warming
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Scheduled task running:', event.cron);

    // Pre-warm popular caches
    ctx.waitUntil(prewarmCaches(env));
  },
};

async function prewarmCaches(env: Env): Promise<void> {
  const popularKeys = ['config', 'featured', 'categories'];

  await Promise.all(
    popularKeys.map(async (key) => {
      await getCached(
        `data:${key}`,
        env.KV,
        async () => {
          return env.DB
            .prepare('SELECT * FROM data WHERE key = ?')
            .bind(key)
            .first();
        },
        3600
      );
    })
  );
}
