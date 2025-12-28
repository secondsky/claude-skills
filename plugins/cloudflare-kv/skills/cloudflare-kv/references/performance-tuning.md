# Cloudflare Workers KV - Performance Tuning

Advanced performance optimization techniques for Workers KV.

---

## Table of Contents

1. [cacheTtl Strategies](#cachettl-strategies)
2. [Bulk Operation Patterns](#bulk-operation-patterns)
3. [Key Design for Performance](#key-design-for-performance)
4. [Metadata vs Value Tradeoffs](#metadata-vs-value-tradeoffs)
5. [List Operation Optimization](#list-operation-optimization)
6. [Cache Invalidation Patterns](#cache-invalidation-patterns)
7. [Read-Heavy vs Write-Heavy Tuning](#read-heavy-vs-write-heavy-tuning)
8. [Benchmarking Techniques](#benchmarking-techniques)
9. [Cost-Performance Tradeoffs](#cost-performance-tradeoffs)

---

## cacheTtl Strategies

### Understanding cacheTtl

The `cacheTtl` parameter controls edge caching for KV reads:

```typescript
const value = await env.KV.get('key', { cacheTtl: 300 });
```

**How it works**:
1. First read: Fetches from KV (~50-200ms)
2. Subsequent reads: Served from edge cache (~1-5ms)
3. Cache expires after TTL seconds
4. Next read: Fetches from KV again, refreshes cache

**Performance impact**:
- Without cacheTtl: Every read hits KV (~50-200ms)
- With cacheTtl: Most reads from cache (~1-5ms)
- **~40-100x faster** for cached reads

### cacheTtl Selection Guide

| Data Type | cacheTtl | Reasoning |
|-----------|----------|-----------|
| **Static config** | 3600-86400 | Rarely changes, long cache OK |
| **User preferences** | 300-900 | Changes occasionally, medium cache |
| **Session data** | 60-300 | Changes frequently, short cache |
| **Real-time data** | 0 or no cacheTtl | Changes constantly, no cache |
| **Feature flags** | 300-600 | Balance freshness vs performance |

### Dynamic cacheTtl Based on Data Age

```typescript
// Adaptive caching based on data freshness
async function getWithAdaptiveCacheTtl(
  kv: KVNamespace,
  key: string
) {
  const { value, metadata } = await kv.getWithMetadata(key);

  if (!metadata?.updatedAt) {
    // No metadata, use default cacheTtl
    return kv.get(key, { cacheTtl: 300 });
  }

  const age = Date.now() - metadata.updatedAt;

  // Older data can be cached longer
  let cacheTtl: number;
  if (age < 60000) {          // <1 minute old
    cacheTtl = 60;
  } else if (age < 3600000) {  // <1 hour old
    cacheTtl = 300;
  } else {                     // >1 hour old
    cacheTtl = 3600;
  }

  return kv.get(key, { cacheTtl });
}
```

### Cache Warming Pattern

```typescript
// Pre-warm cache for frequently accessed keys
async function warmCache(env: Bindings) {
  const hotKeys = [
    'config:theme',
    'config:features',
    'pricing:plans'
  ];

  // Fetch all hot keys with long cacheTtl
  await Promise.all(
    hotKeys.map(key =>
      env.KV.get(key, { cacheTtl: 3600 })
    )
  );

  console.log('Cache warmed');
}

// Call during Worker initialization or scheduled job
```

---

## Bulk Operation Patterns

### Parallel Reads

**Problem**: Sequential reads are slow
```typescript
// ❌ Slow: 600ms (3 × 200ms)
const user = await env.KV.get('user:123');
const prefs = await env.KV.get('prefs:123');
const stats = await env.KV.get('stats:123');
```

**Solution**: Parallel reads
```typescript
// ✅ Fast: 200ms (parallel)
const [user, prefs, stats] = await Promise.all([
  env.KV.get('user:123'),
  env.KV.get('prefs:123'),
  env.KV.get('stats:123')
]);
```

### Batched Writes with waitUntil()

```typescript
export default {
  async fetch(request, env, ctx) {
    // Critical path: Return response immediately
    const response = new Response('OK');

    // Non-critical: Batch writes in background
    ctx.waitUntil(async () => {
      const writes = [
        env.KV.put('analytics:pageview', '1'),
        env.KV.put('analytics:timestamp', Date.now().toString()),
        env.KV.put('analytics:ip', request.headers.get('cf-connecting-ip'))
      ];

      await Promise.all(writes);
    }());

    return response;
  }
};
```

### Bulk Read with List + Get

```typescript
// Get all user preferences efficiently
async function getAllUserPreferences(
  kv: KVNamespace,
  userId: string
) {
  // 1. List all preference keys (fast)
  const { keys } = await kv.list({
    prefix: `user:${userId}:pref:`,
    limit: 100
  });

  // 2. Batch get all values (parallel)
  const values = await Promise.all(
    keys.map(({ name }) => kv.get(name, 'json'))
  );

  // 3. Combine into object
  return keys.reduce((acc, key, i) => {
    const prefName = key.name.split(':').pop()!;
    acc[prefName] = values[i];
    return acc;
  }, {} as Record<string, any>);
}
```

---

## Key Design for Performance

### Hierarchical Key Structure

**Good key design**: Enables efficient list operations

```typescript
// ✅ Good: Hierarchical structure
'user:123:preferences'
'user:123:stats'
'user:124:preferences'
'user:124:stats'

// Efficient listing
await env.KV.list({ prefix: 'user:123:' });  // All user 123 data
```

**Bad key design**: Random structure

```typescript
// ❌ Bad: Random structure
'preferences_user_123'
'stats_for_user_123'
'user124_preferences'

// Cannot efficiently list all user 123 data
```

### Key Length Optimization

**Key size limit**: 512 bytes

```typescript
// ❌ Wasteful (64 bytes)
const key = `user_preferences_for_user_id_${userId}_setting_${settingName}`;

// ✅ Efficient (24 bytes)
const key = `u:${userId}:s:${settingName}`;

// Benefits:
// - Faster list operations (less data transfer)
// - Lower memory usage
// - Better cache efficiency
```

### Key Coalescing

**Problem**: Too many small keys

```typescript
// ❌ 5 KV operations
await env.KV.put('user:123:name', 'Alice');
await env.KV.put('user:123:email', 'alice@example.com');
await env.KV.put('user:123:age', '30');
await env.KV.put('user:123:city', 'NYC');
await env.KV.put('user:123:country', 'USA');
```

**Solution**: Coalesce into single key

```typescript
// ✅ 1 KV operation
await env.KV.put('user:123', JSON.stringify({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  city: 'NYC',
  country: 'USA'
}));

// Trade-off:
// - Fewer operations = faster, cheaper
// - Must read/write entire object
// - Good for data accessed together
```

---

## Metadata vs Value Tradeoffs

### When to Use Metadata

**Metadata advantages**:
- Retrieved with `getWithMetadata()` (1 operation)
- Max 1KB per key
- Good for small auxiliary data

```typescript
// ✅ Good use of metadata
await env.KV.put('article:123', articleContent, {
  metadata: {
    author: 'Alice',
    publishedAt: Date.now(),
    views: 0,
    tags: ['tech', 'cloudflare']
  }
});

// Single operation retrieves both
const { value, metadata } = await env.KV.getWithMetadata('article:123');
console.log(metadata.author);  // No extra KV read!
```

### Metadata Size Limits

```typescript
// Check metadata size before put()
function validateMetadata(metadata: any) {
  const size = new Blob([JSON.stringify(metadata)]).size;

  if (size > 1024) {
    throw new Error(`Metadata too large: ${size} bytes (max 1024)`);
  }

  return metadata;
}

// Split large metadata into value
async function putWithLargeMetadata(
  kv: KVNamespace,
  key: string,
  value: string,
  metadata: any
) {
  const metadataSize = new Blob([JSON.stringify(metadata)]).size;

  if (metadataSize <= 1024) {
    // Fits in metadata
    await kv.put(key, value, { metadata });
  } else {
    // Too large, store as separate key
    await kv.put(key, value);
    await kv.put(`${key}:metadata`, JSON.stringify(metadata));
  }
}
```

---

## List Operation Optimization

### Pagination Best Practices

```typescript
// ✅ Efficient pagination
async function listAllKeys(kv: KVNamespace, prefix: string) {
  const allKeys: KVNamespaceListKey[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({
      prefix,
      limit: 1000,  // Max limit for efficiency
      cursor
    });

    allKeys.push(...result.keys);
    cursor = result.cursor;

  } while (cursor);

  return allKeys;
}
```

### Limit List Operations

**Problem**: Unbounded list() calls

```typescript
// ❌ Dangerous: Could list millions of keys
const { keys } = await env.KV.list();
```

**Solution**: Always use limits

```typescript
// ✅ Safe: Limited results
const { keys } = await env.KV.list({
  limit: 100,
  prefix: 'user:'
});

// For large result sets, paginate
```

### List + Filter Pattern

```typescript
// Efficient filtering with list
async function findRecentArticles(
  kv: KVNamespace,
  minDate: number
) {
  const { keys } = await kv.list({
    prefix: 'article:',
    limit: 1000
  });

  // Filter using metadata (no additional reads!)
  return keys.filter(key =>
    key.metadata?.publishedAt > minDate
  );
}
```

---

## Cache Invalidation Patterns

### Time-Based Invalidation (TTL)

```typescript
// Automatic invalidation via TTL
await env.KV.put('cache:api-response', data, {
  expirationTtl: 300  // Auto-delete after 5 minutes
});
```

### Manual Invalidation

```typescript
// Invalidate on data change
async function updateUserProfile(
  kv: KVNamespace,
  userId: string,
  profile: any
) {
  // 1. Delete old cache
  await kv.delete(`cache:user:${userId}`);

  // 2. Update source data
  await kv.put(`user:${userId}`, JSON.stringify(profile));

  // Cache will be rebuilt on next read
}
```

### Version-Based Invalidation

```typescript
// Use version in key for invalidation
let CACHE_VERSION = 1;

async function getCachedData(kv: KVNamespace) {
  const key = `cache:data:v${CACHE_VERSION}`;
  return await kv.get(key, 'json');
}

// Invalidate all caches by incrementing version
function invalidateAll() {
  CACHE_VERSION++;  // Old caches now orphaned, will expire via TTL
}
```

### Stale-While-Revalidate Pattern

```typescript
async function getWithSWR(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<string>,
  ctx: ExecutionContext
) {
  const { value, metadata } = await kv.getWithMetadata(key);

  const age = metadata?.cachedAt
    ? Date.now() - metadata.cachedAt
    : Infinity;

  // Serve stale content immediately
  if (value && age < 3600000) {  // <1 hour
    // If getting old, revalidate in background
    if (age > 300000) {  // >5 minutes
      ctx.waitUntil(async () => {
        const fresh = await fetcher();
        await kv.put(key, fresh, {
          metadata: { cachedAt: Date.now() }
        });
      }());
    }

    return value;
  }

  // No cache or too old, fetch fresh
  const fresh = await fetcher();
  await kv.put(key, fresh, {
    metadata: { cachedAt: Date.now() }
  });

  return fresh;
}
```

---

## Read-Heavy vs Write-Heavy Tuning

### Read-Heavy Optimization

**Characteristics**: 99% reads, 1% writes

**Optimizations**:

```typescript
// 1. Aggressive cacheTtl
const config = await env.KV.get('config', { cacheTtl: 3600 });

// 2. Pre-warming
async function warmReadHeavyCache(env: Bindings) {
  const hotKeys = ['config', 'pricing', 'features'];
  await Promise.all(
    hotKeys.map(k => env.KV.get(k, { cacheTtl: 3600 }))
  );
}

// 3. Deduplicate reads
const cache = new Map<string, Promise<string | null>>();

async function deduplicatedGet(kv: KVNamespace, key: string) {
  if (!cache.has(key)) {
    cache.set(key, kv.get(key));
  }
  return cache.get(key)!;
}
```

### Write-Heavy Optimization

**Characteristics**: Frequent updates

**Optimizations**:

```typescript
// 1. Batch writes with waitUntil()
async function batchWrite(
  kv: KVNamespace,
  writes: Array<{ key: string; value: string }>,
  ctx: ExecutionContext
) {
  ctx.waitUntil(
    Promise.all(
      writes.map(({ key, value }) => kv.put(key, value))
    )
  );
}

// 2. Coalesce rapid updates
let pendingWrites = new Map<string, string>();
let writeTimer: any;

function coalescedPut(kv: KVNamespace, key: string, value: string) {
  pendingWrites.set(key, value);

  clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    const writes = Array.from(pendingWrites.entries());
    pendingWrites.clear();

    await Promise.all(
      writes.map(([k, v]) => kv.put(k, v))
    );
  }, 1000);  // Flush every second
}

// 3. Use Durable Objects for high-frequency writes
// If writing to same key >1000 times/sec, use Durable Objects instead
```

---

## Benchmarking Techniques

### Measuring Read Performance

```typescript
async function benchmarkRead(kv: KVNamespace, key: string) {
  const iterations = 100;

  // Warm up
  await kv.get(key);

  // Benchmark without cacheTtl
  const start1 = Date.now();
  for (let i = 0; i < iterations; i++) {
    await kv.get(key);
  }
  const withoutCache = (Date.now() - start1) / iterations;

  // Benchmark with cacheTtl
  const start2 = Date.now();
  for (let i = 0; i < iterations; i++) {
    await kv.get(key, { cacheTtl: 300 });
  }
  const withCache = (Date.now() - start2) / iterations;

  console.log({
    withoutCache: `${withoutCache.toFixed(2)}ms`,
    withCache: `${withCache.toFixed(2)}ms`,
    improvement: `${((1 - withCache / withoutCache) * 100).toFixed(1)}%`
  });
}
```

### Measuring Write Performance

```typescript
async function benchmarkWrite(kv: KVNamespace) {
  const iterations = 100;

  // Sequential writes
  const start1 = Date.now();
  for (let i = 0; i < iterations; i++) {
    await kv.put(`bench:${i}`, 'value');
  }
  const sequential = Date.now() - start1;

  // Parallel writes
  const start2 = Date.now();
  await Promise.all(
    Array.from({ length: iterations }, (_, i) =>
      kv.put(`bench:${i}`, 'value')
    )
  );
  const parallel = Date.now() - start2;

  console.log({
    sequential: `${sequential}ms`,
    parallel: `${parallel}ms`,
    speedup: `${(sequential / parallel).toFixed(1)}x`
  });
}
```

### Performance Testing Script

```typescript
// Complete performance test suite
export async function performanceTest(env: Bindings) {
  console.log('KV Performance Test Suite');

  // Test 1: Read latency
  await env.KV.put('test:latency', 'value');
  const readStart = Date.now();
  await env.KV.get('test:latency');
  console.log(`Read latency: ${Date.now() - readStart}ms`);

  // Test 2: cacheTtl benefit
  const cachedStart = Date.now();
  await env.KV.get('test:latency', { cacheTtl: 60 });
  console.log(`Cached read: ${Date.now() - cachedStart}ms`);

  // Test 3: Parallel vs Sequential
  const parallelStart = Date.now();
  await Promise.all([
    env.KV.get('test:1'),
    env.KV.get('test:2'),
    env.KV.get('test:3')
  ]);
  const parallelTime = Date.now() - parallelStart;

  const seqStart = Date.now();
  await env.KV.get('test:1');
  await env.KV.get('test:2');
  await env.KV.get('test:3');
  const seqTime = Date.now() - seqStart;

  console.log({
    parallel: `${parallelTime}ms`,
    sequential: `${seqTime}ms`,
    speedup: `${(seqTime / parallelTime).toFixed(1)}x`
  });

  // Test 4: List performance
  const listStart = Date.now();
  const { keys } = await env.KV.list({ limit: 1000 });
  console.log(`List 1000 keys: ${Date.now() - listStart}ms`);

  return { success: true };
}
```

---

## Cost-Performance Tradeoffs

### Optimizing for Cost

**Strategy 1: Use cacheTtl to reduce read operations**

```typescript
// Without cacheTtl: 1M reads/day = $0.50
// With cacheTtl=300: ~10K reads/day = $0.005 (99% savings)
const config = await env.KV.get('config', { cacheTtl: 300 });
```

**Strategy 2: Coalesce writes**

```typescript
// ❌ Expensive: 5 write operations = $0.025 per million users
await env.KV.put('user:name', name);
await env.KV.put('user:email', email);
await env.KV.put('user:age', age);
await env.KV.put('user:city', city);
await env.KV.put('user:country', country);

// ✅ Cheap: 1 write operation = $0.005 per million users
await env.KV.put('user', JSON.stringify({ name, email, age, city, country }));
```

**Strategy 3: Use TTL to reduce storage costs**

```typescript
// Auto-expire temporary data
await env.KV.put('session:123', data, {
  expirationTtl: 86400  // 24 hours
});

// Storage freed automatically, no ongoing costs
```

### Optimizing for Performance

**Strategy 1: Parallel operations**

```typescript
// Parallel = faster (worth the extra operations)
const [user, prefs, stats] = await Promise.all([
  env.KV.get('user:123'),
  env.KV.get('prefs:123'),
  env.KV.get('stats:123')
]);
```

**Strategy 2: Aggressive caching**

```typescript
// Long cacheTtl = faster reads (slight staleness acceptable)
const pricing = await env.KV.get('pricing', { cacheTtl: 3600 });
```

**Strategy 3: Pre-computation**

```typescript
// Compute once, cache result
async function getExpensiveComputation(kv: KVNamespace) {
  let result = await kv.get('computed:result', 'json');

  if (!result) {
    // Expensive computation
    result = await computeExpensiveResult();
    await kv.put('computed:result', JSON.stringify(result), {
      expirationTtl: 3600
    });
  }

  return result;
}
```

### Cost-Performance Matrix

| Use Case | Optimization Priority | Strategy |
|----------|----------------------|----------|
| **Config data** | Both | Long cacheTtl, rare writes, coalesce keys |
| **User sessions** | Performance | Short cacheTtl, TTL expiration, parallel reads |
| **Analytics** | Cost | waitUntil writes, batch operations, coalesce writes |
| **Feature flags** | Performance | Long cacheTtl, pre-warming, version-based invalidation |
| **API cache** | Both | Medium cacheTtl, stale-while-revalidate, TTL expiration |

---

## Performance Checklist

Before deploying to production:

- [ ] All reads use appropriate cacheTtl
- [ ] Parallel operations used where possible
- [ ] Keys are hierarchical and optimized
- [ ] Metadata used for small auxiliary data
- [ ] List operations are bounded with limits
- [ ] Write operations use waitUntil() for non-critical paths
- [ ] TTL expiration set for temporary data
- [ ] Benchmarked read/write performance
- [ ] Monitoring set up for KV operations
- [ ] Cost projections calculated

---

**Last Updated**: 2025-12-27
**Related**: `best-practices.md`, `limits-quotas.md`, `workers-api.md`
