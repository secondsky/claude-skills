/**
 * Cloudflare Workers KV - Rate Limiting Example
 *
 * Demonstrates multiple rate limiting strategies using KV:
 * - Fixed Window Rate Limiting
 * - Sliding Window Rate Limiting
 * - Token Bucket Rate Limiting
 *
 * Production-ready Worker with Hono framework
 */

import { Hono } from 'hono';

type Bindings = {
  RATE_LIMIT: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Strategy 1: Fixed Window Rate Limiting (Simple)
// ============================================================================

/**
 * Fixed window: 100 requests per minute per IP
 * Pros: Simple, low KV operations
 * Cons: Burst traffic at window boundaries
 */
app.get('/api/fixed-window', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const minute = Math.floor(Date.now() / 60000); // Current minute
  const key = `fixed:${ip}:${minute}`;

  // Get current count
  const countStr = await c.env.RATE_LIMIT.get(key);
  const count = countStr ? parseInt(countStr) : 0;

  // Check limit
  const limit = 100;
  if (count >= limit) {
    return c.json(
      {
        error: 'Rate limit exceeded',
        limit,
        reset: (minute + 1) * 60000
      },
      429
    );
  }

  // Increment counter
  await c.env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: 120 // 2 minutes (buffer for safety)
  });

  return c.json({
    success: true,
    remaining: limit - count - 1,
    reset: (minute + 1) * 60000
  });
});

// ============================================================================
// Strategy 2: Sliding Window Rate Limiting (Better)
// ============================================================================

/**
 * Sliding window: 100 requests per minute (rolling)
 * Pros: Smoother rate limiting, no burst issue
 * Cons: More complex, more KV operations
 */
app.get('/api/sliding-window', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const limit = 100;

  // Key for timestamp log
  const key = `sliding:${ip}`;

  // Get existing timestamps
  const logStr = await c.env.RATE_LIMIT.get(key);
  const timestamps: number[] = logStr ? JSON.parse(logStr) : [];

  // Remove timestamps older than window
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  // Check limit
  if (validTimestamps.length >= limit) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const resetTime = oldestTimestamp + windowMs;

    return c.json(
      {
        error: 'Rate limit exceeded',
        limit,
        reset: resetTime
      },
      429
    );
  }

  // Add current timestamp
  validTimestamps.push(now);

  // Store updated log
  await c.env.RATE_LIMIT.put(key, JSON.stringify(validTimestamps), {
    expirationTtl: Math.ceil(windowMs / 1000) + 60 // Window + buffer
  });

  return c.json({
    success: true,
    remaining: limit - validTimestamps.length,
    reset: now + windowMs
  });
});

// ============================================================================
// Strategy 3: Token Bucket Rate Limiting (Advanced)
// ============================================================================

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Token bucket: Allows bursts, refills over time
 * Pros: Flexible, allows controlled bursts
 * Cons: Most complex
 */
app.get('/api/token-bucket', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const key = `bucket:${ip}`;

  const maxTokens = 100;
  const refillRate = 100 / 60; // 100 tokens per minute = ~1.67/sec

  // Get current bucket state
  const bucketStr = await c.env.RATE_LIMIT.get(key);
  let bucket: TokenBucket;

  if (!bucketStr) {
    // Initialize new bucket
    bucket = {
      tokens: maxTokens,
      lastRefill: Date.now()
    };
  } else {
    bucket = JSON.parse(bucketStr);

    // Refill tokens based on time elapsed
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * refillRate;

    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if enough tokens
  if (bucket.tokens < 1) {
    const timeUntilToken = (1 - bucket.tokens) / refillRate;

    return c.json(
      {
        error: 'Rate limit exceeded',
        reset: Date.now() + timeUntilToken * 1000
      },
      429
    );
  }

  // Consume 1 token
  bucket.tokens -= 1;

  // Save bucket state
  await c.env.RATE_LIMIT.put(key, JSON.stringify(bucket), {
    expirationTtl: 3600 // 1 hour
  });

  return c.json({
    success: true,
    tokensRemaining: Math.floor(bucket.tokens)
  });
});

// ============================================================================
// Strategy 4: Multi-Tier Rate Limiting
// ============================================================================

/**
 * Different limits for different user tiers
 */
app.get('/api/multi-tier', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const apiKey = c.req.header('x-api-key');

  // Determine user tier (in production, look up in database)
  let tier: 'free' | 'pro' | 'enterprise';
  let limit: number;

  if (!apiKey) {
    tier = 'free';
    limit = 10; // 10 requests/minute
  } else if (apiKey.startsWith('pro_')) {
    tier = 'pro';
    limit = 100; // 100 requests/minute
  } else {
    tier = 'enterprise';
    limit = 1000; // 1000 requests/minute
  }

  const minute = Math.floor(Date.now() / 60000);
  const key = `tier:${tier}:${ip}:${minute}`;

  const countStr = await c.env.RATE_LIMIT.get(key);
  const count = countStr ? parseInt(countStr) : 0;

  if (count >= limit) {
    return c.json(
      {
        error: 'Rate limit exceeded',
        tier,
        limit,
        reset: (minute + 1) * 60000
      },
      429
    );
  }

  await c.env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: 120
  });

  return c.json({
    success: true,
    tier,
    remaining: limit - count - 1,
    reset: (minute + 1) * 60000
  });
});

// ============================================================================
// Utility: Check Current Rate Limit Status
// ============================================================================

app.get('/api/status', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const minute = Math.floor(Date.now() / 60000);

  // Check all rate limit strategies
  const [fixed, sliding, bucket, tier] = await Promise.all([
    // Fixed window
    c.env.RATE_LIMIT.get(`fixed:${ip}:${minute}`),
    // Sliding window
    c.env.RATE_LIMIT.get(`sliding:${ip}`),
    // Token bucket
    c.env.RATE_LIMIT.get(`bucket:${ip}`),
    // Multi-tier (free tier)
    c.env.RATE_LIMIT.get(`tier:free:${ip}:${minute}`)
  ]);

  return c.json({
    ip,
    strategies: {
      fixedWindow: {
        used: fixed ? parseInt(fixed) : 0,
        limit: 100,
        window: '1 minute'
      },
      slidingWindow: {
        used: sliding ? JSON.parse(sliding).length : 0,
        limit: 100,
        window: '1 minute rolling'
      },
      tokenBucket: bucket
        ? {
            tokens: Math.floor(JSON.parse(bucket).tokens),
            maxTokens: 100,
            refillRate: '~1.67 tokens/sec'
          }
        : { tokens: 100, maxTokens: 100, refillRate: '~1.67 tokens/sec' },
      multiTier: {
        used: tier ? parseInt(tier) : 0,
        limit: 10,
        tier: 'free'
      }
    }
  });
});

// ============================================================================
// Admin: Clear Rate Limits (for testing)
// ============================================================================

app.delete('/api/admin/clear/:ip', async (c) => {
  const ip = c.req.param('ip');
  const minute = Math.floor(Date.now() / 60000);

  // Delete all rate limit keys for IP
  await Promise.all([
    c.env.RATE_LIMIT.delete(`fixed:${ip}:${minute}`),
    c.env.RATE_LIMIT.delete(`fixed:${ip}:${minute - 1}`),
    c.env.RATE_LIMIT.delete(`sliding:${ip}`),
    c.env.RATE_LIMIT.delete(`bucket:${ip}`),
    c.env.RATE_LIMIT.delete(`tier:free:${ip}:${minute}`),
    c.env.RATE_LIMIT.delete(`tier:pro:${ip}:${minute}`),
    c.env.RATE_LIMIT.delete(`tier:enterprise:${ip}:${minute}`)
  ]);

  return c.json({ success: true, message: `Rate limits cleared for IP: ${ip}` });
});

// ============================================================================
// Root & 404
// ============================================================================

app.get('/', (c) => {
  return c.html(`
    <h1>Cloudflare Workers KV - Rate Limiting Examples</h1>
    <p>Try these endpoints:</p>
    <ul>
      <li><a href="/api/fixed-window">/api/fixed-window</a> - Fixed window (100/min)</li>
      <li><a href="/api/sliding-window">/api/sliding-window</a> - Sliding window (100/min rolling)</li>
      <li><a href="/api/token-bucket">/api/token-bucket</a> - Token bucket (allows bursts)</li>
      <li><a href="/api/multi-tier">/api/multi-tier</a> - Multi-tier (10/100/1000 per tier)</li>
      <li><a href="/api/status">/api/status</a> - Check current status</li>
    </ul>
    <p>Test by hitting endpoints multiple times to trigger rate limits.</p>
  `);
});

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
