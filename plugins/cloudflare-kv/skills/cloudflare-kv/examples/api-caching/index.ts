/**
 * Cloudflare Workers KV - API Response Caching Example
 *
 * Demonstrates HTTP caching patterns using KV:
 * - Basic cache-aside pattern
 * - Stale-while-revalidate
 * - Cache invalidation
 * - Conditional caching
 */

import { Hono } from 'hono';

type Bindings = {
  API_CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Pattern 1: Basic Cache-Aside
// ============================================================================

app.get('/api/posts/:id', async (c) => {
  const postId = c.req.param('id');
  const cacheKey = `post:${postId}`;

  // Try cache first
  let post = await c.env.API_CACHE.get(cacheKey, 'json');

  if (!post) {
    // Cache miss - fetch from origin
    console.log(`Cache MISS for ${cacheKey}`);

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${postId}`
    );
    post = await response.json();

    // Store in cache with 5-minute TTL
    await c.env.API_CACHE.put(cacheKey, JSON.stringify(post), {
      expirationTtl: 300
    });
  } else {
    console.log(`Cache HIT for ${cacheKey}`);
  }

  return c.json(post);
});

// ============================================================================
// Pattern 2: Stale-While-Revalidate
// ============================================================================

app.get('/api/users/:id', async (c) => {
  const userId = c.req.param('id');
  const cacheKey = `user:${userId}`;

  // Get cached value with metadata
  const { value, metadata } = await c.env.API_CACHE.getWithMetadata(cacheKey, 'json');

  const cachedAt = metadata?.cachedAt as number || 0;
  const age = Date.now() - cachedAt;

  // Serve stale content if available (< 1 hour old)
  if (value && age < 3600000) {
    console.log(`Serving cached user (age: ${Math.floor(age / 1000)}s)`);

    // If content is getting old (> 5 minutes), revalidate in background
    if (age > 300000) {
      console.log('Background revalidation triggered');
      c.executionCtx.waitUntil(
        (async () => {
          const response = await fetch(
            `https://jsonplaceholder.typicode.com/users/${userId}`
          );
          const fresh = await response.json();

          await c.env.API_CACHE.put(cacheKey, JSON.stringify(fresh), {
            metadata: { cachedAt: Date.now() }
          });
          console.log('Cache revalidated');
        })()
      );
    }

    return c.json(value);
  }

  // No cache or too old - fetch fresh
  console.log('Fetching fresh user data');
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );
  const user = await response.json();

  await c.env.API_CACHE.put(cacheKey, JSON.stringify(user), {
    metadata: { cachedAt: Date.now() }
  });

  return c.json(user);
});

// ============================================================================
// Pattern 3: Conditional Caching
// ============================================================================

app.get('/api/comments', async (c) => {
  const postId = c.req.query('postId');
  const cacheKey = `comments:${postId || 'all'}`;

  // Only cache if specific postId
  if (!postId) {
    console.log('Not caching - no postId filter');
    const response = await fetch('https://jsonplaceholder.typicode.com/comments');
    return c.json(await response.json());
  }

  // Cache for specific postId
  let comments = await c.env.API_CACHE.get(cacheKey, 'json');

  if (!comments) {
    console.log(`Cache MISS for ${cacheKey}`);
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/comments?postId=${postId}`
    );
    comments = await response.json();

    await c.env.API_CACHE.put(cacheKey, JSON.stringify(comments), {
      expirationTtl: 600 // 10 minutes
    });
  }

  return c.json(comments);
});

// ============================================================================
// Pattern 4: Cache with ETag
// ============================================================================

app.get('/api/photos/:id', async (c) => {
  const photoId = c.req.param('id');
  const cacheKey = `photo:${photoId}`;
  const clientEtag = c.req.header('if-none-match');

  const { value, metadata } = await c.env.API_CACHE.getWithMetadata(cacheKey, 'json');
  const etag = metadata?.etag as string;

  // Client has current version
  if (clientEtag && clientEtag === etag) {
    return c.body(null, 304); // Not Modified
  }

  let photo = value;

  if (!photo) {
    // Fetch from origin
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/photos/${photoId}`
    );
    photo = await response.json();

    // Generate ETag from content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(photo));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newEtag = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

    await c.env.API_CACHE.put(cacheKey, JSON.stringify(photo), {
      expirationTtl: 3600,
      metadata: { etag: newEtag }
    });
  }

  return c.json(photo, 200, {
    'ETag': etag || 'unknown',
    'Cache-Control': 'max-age=3600'
  });
});

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Invalidate specific cache entry
 */
app.delete('/cache/:type/:id', async (c) => {
  const type = c.req.param('type');
  const id = c.req.param('id');
  const cacheKey = `${type}:${id}`;

  await c.env.API_CACHE.delete(cacheKey);

  return c.json({ success: true, invalidated: cacheKey });
});

/**
 * Invalidate all cache for a type
 */
app.delete('/cache/:type', async (c) => {
  const type = c.req.param('type');

  const { keys } = await c.env.API_CACHE.list({
    prefix: `${type}:`,
    limit: 1000
  });

  await Promise.all(
    keys.map(({ name }) => c.env.API_CACHE.delete(name))
  );

  return c.json({ success: true, invalidated: keys.length });
});

/**
 * Get cache statistics
 */
app.get('/cache/stats', async (c) => {
  const types = ['post', 'user', 'comments', 'photo'];

  const stats = await Promise.all(
    types.map(async (type) => {
      const { keys } = await c.env.API_CACHE.list({
        prefix: `${type}:`,
        limit: 1000
      });

      return { type, cached: keys.length };
    })
  );

  return c.json({ stats });
});

// ============================================================================
// Root & 404
// ============================================================================

app.get('/', (c) => {
  return c.html(`
    <h1>Cloudflare Workers KV - API Caching Example</h1>
    <h2>Cached Endpoints</h2>
    <ul>
      <li><a href="/api/posts/1">/api/posts/:id</a> - Basic cache-aside (5 min TTL)</li>
      <li><a href="/api/users/1">/api/users/:id</a> - Stale-while-revalidate</li>
      <li><a href="/api/comments?postId=1">/api/comments?postId=1</a> - Conditional caching</li>
      <li><a href="/api/photos/1">/api/photos/:id</a> - Cache with ETag</li>
    </ul>
    <h2>Cache Management</h2>
    <ul>
      <li>DELETE /cache/:type/:id - Invalidate specific entry</li>
      <li>DELETE /cache/:type - Invalidate all entries of type</li>
      <li><a href="/cache/stats">GET /cache/stats</a> - View cache statistics</li>
    </ul>
  `);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
