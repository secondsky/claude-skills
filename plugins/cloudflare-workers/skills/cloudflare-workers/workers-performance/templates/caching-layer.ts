/**
 * Multi-Layer Caching System for Cloudflare Workers
 *
 * Features:
 * - Memory cache (request-scoped, fastest)
 * - Edge cache (Cache API, per-colo)
 * - KV cache (global, persistent)
 * - Stale-while-revalidate pattern
 * - Cache tags for invalidation
 * - TTL management
 *
 * Usage:
 * 1. Initialize cache layers
 * 2. Use get/set methods
 * 3. Implement cache-aside pattern
 */

// ============================================
// TYPES
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

interface CacheLayer<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  staleWhileRevalidate?: number; // Serve stale for this many seconds
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

// ============================================
// MEMORY CACHE (Request-Scoped)
// ============================================

export class MemoryCache<T> implements CacheLayer<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private stats = { hits: 0, misses: 0 };

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    // Evict if at capacity (LRU-style)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: options?.ttl ?? 60,
      tags: options?.tags,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.timestamp + entry.ttl * 1000;
  }
}

// ============================================
// EDGE CACHE (Cache API)
// ============================================

export class EdgeCache<T> implements CacheLayer<T> {
  private cache: Cache;
  private prefix: string;
  private stats = { hits: 0, misses: 0 };

  constructor(prefix = 'edge-cache:') {
    this.cache = caches.default;
    this.prefix = prefix;
  }

  private getCacheKey(key: string): Request {
    return new Request(`https://cache/${this.prefix}${key}`);
  }

  async get(key: string): Promise<T | null> {
    const response = await this.cache.match(this.getCacheKey(key));

    if (!response) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return response.json();
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? 3600;

    const response = new Response(JSON.stringify(value), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${ttl}`,
        'X-Cache-Tags': options?.tags?.join(',') ?? '',
        'X-Cache-Timestamp': Date.now().toString(),
      },
    });

    await this.cache.put(this.getCacheKey(key), response);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(this.getCacheKey(key));
  }

  async has(key: string): Promise<boolean> {
    const response = await this.cache.match(this.getCacheKey(key));
    return response !== undefined;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

// ============================================
// KV CACHE (Global)
// ============================================

export class KVCache<T> implements CacheLayer<T> {
  private kv: KVNamespace;
  private prefix: string;
  private stats = { hits: 0, misses: 0 };

  constructor(kv: KVNamespace, prefix = 'kv-cache:') {
    this.kv = kv;
    this.prefix = prefix;
  }

  async get(key: string): Promise<T | null> {
    const value = await this.kv.get<CacheEntry<T>>(this.prefix + key, 'json');

    if (!value) {
      this.stats.misses++;
      return null;
    }

    // Check if expired (belt and suspenders with KV expirationTtl)
    if (Date.now() > value.timestamp + value.ttl * 1000) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return value.data;
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? 3600;

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags: options?.tags,
    };

    await this.kv.put(this.prefix + key, JSON.stringify(entry), {
      expirationTtl: ttl,
    });

    // Store tag associations
    if (options?.tags) {
      for (const tag of options.tags) {
        const tagKey = `tag:${tag}`;
        const existingKeys = await this.kv.get<string[]>(tagKey, 'json') ?? [];
        if (!existingKeys.includes(key)) {
          existingKeys.push(key);
          await this.kv.put(tagKey, JSON.stringify(existingKeys));
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(this.prefix + key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.kv.get(this.prefix + key);
    return value !== null;
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const keys = await this.kv.get<string[]>(tagKey, 'json') ?? [];

    await Promise.all([
      ...keys.map((key) => this.delete(key)),
      this.kv.delete(tagKey),
    ]);
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

// ============================================
// MULTI-LAYER CACHE
// ============================================

export class MultiLayerCache<T> implements CacheLayer<T> {
  private layers: CacheLayer<T>[];

  constructor(layers: CacheLayer<T>[]) {
    this.layers = layers;
  }

  async get(key: string): Promise<T | null> {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get(key);

      if (value !== null) {
        // Populate upper layers (don't await, do in background)
        this.populateUpperLayers(key, value, i);
        return value;
      }
    }

    return null;
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    // Set in all layers
    await Promise.all(
      this.layers.map((layer) => layer.set(key, value, options))
    );
  }

  async delete(key: string): Promise<void> {
    await Promise.all(this.layers.map((layer) => layer.delete(key)));
  }

  async has(key: string): Promise<boolean> {
    for (const layer of this.layers) {
      if (await layer.has(key)) {
        return true;
      }
    }
    return false;
  }

  private async populateUpperLayers(
    key: string,
    value: T,
    foundAtIndex: number
  ): Promise<void> {
    // Populate all layers above where we found the value
    const upperLayers = this.layers.slice(0, foundAtIndex);
    await Promise.all(upperLayers.map((layer) => layer.set(key, value)));
  }
}

// ============================================
// CACHE-ASIDE PATTERN
// ============================================

export class CacheAside<T> {
  constructor(
    private cache: CacheLayer<T>,
    private defaultTTL: number = 3600
  ) {}

  async get(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Store in cache (don't await for faster response)
    this.cache.set(key, data, {
      ttl: options?.ttl ?? this.defaultTTL,
      tags: options?.tags,
    });

    return data;
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  async refresh(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const data = await fetcher();
    await this.cache.set(key, data, options);
    return data;
  }
}

// ============================================
// STALE-WHILE-REVALIDATE
// ============================================

interface SWREntry<T> {
  data: T;
  timestamp: number;
  maxAge: number;
  staleWhileRevalidate: number;
}

export class SWRCache<T> {
  private cache: CacheLayer<SWREntry<T>>;
  private revalidating = new Set<string>();

  constructor(cache: CacheLayer<SWREntry<T>>) {
    this.cache = cache;
  }

  async get(
    key: string,
    fetcher: () => Promise<T>,
    options: { maxAge: number; staleWhileRevalidate: number }
  ): Promise<T> {
    const cached = await this.cache.get(key);

    if (cached) {
      const age = (Date.now() - cached.timestamp) / 1000;

      // Fresh
      if (age < cached.maxAge) {
        return cached.data;
      }

      // Stale but within SWR window
      if (age < cached.maxAge + cached.staleWhileRevalidate) {
        // Revalidate in background
        if (!this.revalidating.has(key)) {
          this.revalidating.add(key);
          this.revalidate(key, fetcher, options).finally(() => {
            this.revalidating.delete(key);
          });
        }
        return cached.data;
      }
    }

    // No cache or too stale - fetch fresh
    return this.revalidate(key, fetcher, options);
  }

  private async revalidate(
    key: string,
    fetcher: () => Promise<T>,
    options: { maxAge: number; staleWhileRevalidate: number }
  ): Promise<T> {
    const data = await fetcher();

    await this.cache.set(key, {
      data,
      timestamp: Date.now(),
      maxAge: options.maxAge,
      staleWhileRevalidate: options.staleWhileRevalidate,
    });

    return data;
  }
}

// ============================================
// RESPONSE CACHE (HTTP Responses)
// ============================================

export class ResponseCache {
  private cache = caches.default;

  async match(request: Request): Promise<Response | undefined> {
    return this.cache.match(this.getCacheKey(request));
  }

  async put(
    request: Request,
    response: Response,
    options?: { maxAge?: number; vary?: string[] }
  ): Promise<void> {
    const cacheableResponse = new Response(response.body, response);

    // Set cache headers
    cacheableResponse.headers.set(
      'Cache-Control',
      `public, max-age=${options?.maxAge ?? 3600}`
    );

    if (options?.vary) {
      cacheableResponse.headers.set('Vary', options.vary.join(', '));
    }

    await this.cache.put(this.getCacheKey(request), cacheableResponse);
  }

  async delete(request: Request): Promise<boolean> {
    return this.cache.delete(this.getCacheKey(request));
  }

  private getCacheKey(request: Request): Request {
    // Normalize cache key
    const url = new URL(request.url);
    url.searchParams.sort();

    // Remove tracking params
    ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid'].forEach((param) => {
      url.searchParams.delete(param);
    });

    return new Request(url.toString(), {
      method: 'GET',
    });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createCacheSystem<T>(
  kv?: KVNamespace,
  options?: { memorySize?: number; prefix?: string }
): MultiLayerCache<T> {
  const layers: CacheLayer<T>[] = [
    new MemoryCache<T>(options?.memorySize ?? 100),
    new EdgeCache<T>(options?.prefix ?? 'cache:'),
  ];

  if (kv) {
    layers.push(new KVCache<T>(kv, options?.prefix ?? 'cache:'));
  }

  return new MultiLayerCache<T>(layers);
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { createCacheSystem, CacheAside, ResponseCache } from './caching-layer';

interface Env {
  KV: KVNamespace;
}

interface User {
  id: string;
  name: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Option 1: Multi-layer cache
    const cache = createCacheSystem<User>(env.KV);
    const user = await cache.get('user:123');

    // Option 2: Cache-aside pattern
    const userCache = new CacheAside<User>(cache);
    const userData = await userCache.get(
      'user:123',
      async () => {
        return fetchUserFromDB('123');
      },
      { ttl: 3600, tags: ['users'] }
    );

    // Option 3: Response caching
    const responseCache = new ResponseCache();
    const cached = await responseCache.match(request);
    if (cached) {
      return cached;
    }

    const response = await generateResponse(request);
    await responseCache.put(request, response.clone(), { maxAge: 300 });

    return response;
  },
};
*/
