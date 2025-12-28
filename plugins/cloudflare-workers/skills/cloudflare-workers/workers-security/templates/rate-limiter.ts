/**
 * Rate Limiter for Cloudflare Workers
 *
 * Features:
 * - Fixed window rate limiting
 * - Sliding window rate limiting
 * - Token bucket algorithm
 * - Per-user/API key limits
 * - Multi-tier limits
 * - Durable Objects support
 *
 * Usage:
 * 1. Choose algorithm
 * 2. Configure limits
 * 3. Apply middleware
 */

// ============================================
// TYPES
// ============================================

interface Env {
  KV: KVNamespace;
  RATE_LIMITER?: DurableObjectNamespace;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  /** Maximum requests in window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Key generator function */
  keyGenerator?: (request: Request) => string;
  /** Skip rate limiting for certain requests */
  skip?: (request: Request) => boolean;
  /** Custom response for rate limited requests */
  onLimited?: (result: RateLimitResult) => Response;
}

type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

// ============================================
// KEY GENERATORS
// ============================================

export const KeyGenerators = {
  /** Rate limit by IP address */
  byIP: (request: Request): string => {
    return request.headers.get('CF-Connecting-IP') || 'unknown';
  },

  /** Rate limit by API key */
  byApiKey: (request: Request): string => {
    return request.headers.get('X-API-Key') || 'no-key';
  },

  /** Rate limit by user ID (from auth header) */
  byUser: (request: Request): string => {
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        // Extract user ID from JWT (base64 decode payload)
        const parts = auth.slice(7).split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return `user:${payload.sub}`;
      } catch {
        return 'invalid-token';
      }
    }
    return 'anonymous';
  },

  /** Rate limit by IP + path */
  byIPAndPath: (request: Request): string => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const path = new URL(request.url).pathname;
    return `${ip}:${path}`;
  },

  /** Composite key generator */
  composite: (...generators: ((request: Request) => string)[]): ((request: Request) => string) => {
    return (request: Request) => generators.map((g) => g(request)).join(':');
  },
};

// ============================================
// FIXED WINDOW RATE LIMITER
// ============================================

export async function fixedWindowRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const windowEnd = windowStart + windowSeconds * 1000;
  const kvKey = `ratelimit:fixed:${key}:${windowStart}`;

  // Get current count
  const countStr = await kv.get(kvKey);
  const count = countStr ? parseInt(countStr, 10) : 0;

  if (count >= limit) {
    const retryAfter = Math.ceil((windowEnd - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: windowEnd,
      retryAfter,
    };
  }

  // Increment atomically-ish (KV doesn't have atomic increment)
  await kv.put(kvKey, (count + 1).toString(), {
    expirationTtl: windowSeconds + 60, // Extra minute for safety
  });

  return {
    allowed: true,
    remaining: limit - count - 1,
    limit,
    resetAt: windowEnd,
  };
}

// ============================================
// SLIDING WINDOW RATE LIMITER
// ============================================

interface SlidingWindowData {
  requests: number[];
}

export async function slidingWindowRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const kvKey = `ratelimit:sliding:${key}`;

  // Get request timestamps
  const data = await kv.get<SlidingWindowData>(kvKey, 'json');
  let requests = data?.requests || [];

  // Filter to current window
  requests = requests.filter((ts) => ts > windowStart);

  if (requests.length >= limit) {
    // Find when oldest request expires
    const oldestRequest = Math.min(...requests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: oldestRequest + windowMs,
      retryAfter,
    };
  }

  // Add current request
  requests.push(now);

  // Store updated list
  await kv.put(kvKey, JSON.stringify({ requests }), {
    expirationTtl: windowSeconds + 60,
  });

  return {
    allowed: true,
    remaining: limit - requests.length,
    limit,
    resetAt: now + windowMs,
  };
}

// ============================================
// TOKEN BUCKET RATE LIMITER
// ============================================

interface TokenBucketData {
  tokens: number;
  lastRefill: number;
}

interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // Tokens per second
}

export async function tokenBucketRateLimit(
  kv: KVNamespace,
  key: string,
  config: TokenBucketConfig,
  tokensRequested = 1
): Promise<RateLimitResult> {
  const now = Date.now();
  const kvKey = `ratelimit:bucket:${key}`;

  // Get or initialize bucket
  let bucket = await kv.get<TokenBucketData>(kvKey, 'json');

  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: now };
  }

  // Calculate tokens to add
  const timePassed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = timePassed * config.refillRate;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if we have enough tokens
  if (bucket.tokens < tokensRequested) {
    const tokensNeeded = tokensRequested - bucket.tokens;
    const waitTime = Math.ceil(tokensNeeded / config.refillRate);

    await kv.put(kvKey, JSON.stringify(bucket), { expirationTtl: 3600 });

    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      limit: config.capacity,
      resetAt: now + waitTime * 1000,
      retryAfter: waitTime,
    };
  }

  // Consume tokens
  bucket.tokens -= tokensRequested;
  await kv.put(kvKey, JSON.stringify(bucket), { expirationTtl: 3600 });

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    limit: config.capacity,
    resetAt: now + Math.ceil((config.capacity - bucket.tokens) / config.refillRate) * 1000,
  };
}

// ============================================
// RATE LIMIT RESPONSE
// ============================================

function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': (result.retryAfter || 60).toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toString(),
      },
    }
  );
}

function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('X-RateLimit-Limit', result.limit.toString());
  newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  newResponse.headers.set('X-RateLimit-Reset', result.resetAt.toString());

  return newResponse;
}

// ============================================
// RATE LIMIT MIDDLEWARE
// ============================================

export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(handler: Handler): Handler {
    return async (request, env, ctx) => {
      // Check skip condition
      if (config.skip?.(request)) {
        return handler(request, env, ctx);
      }

      // Generate key
      const keyGenerator = config.keyGenerator || KeyGenerators.byIP;
      const key = keyGenerator(request);

      // Check rate limit
      const result = await fixedWindowRateLimit(
        env.KV,
        key,
        config.limit,
        config.windowSeconds
      );

      if (!result.allowed) {
        return config.onLimited?.(result) || createRateLimitResponse(result);
      }

      // Continue with handler
      const response = await handler(request, env, ctx);

      // Add rate limit headers
      return addRateLimitHeaders(response, result);
    };
  };
}

// ============================================
// MULTI-TIER RATE LIMITER
// ============================================

interface RateLimitTier {
  name: string;
  limit: number;
  windowSeconds: number;
}

export async function multiTierRateLimit(
  kv: KVNamespace,
  key: string,
  tiers: RateLimitTier[]
): Promise<RateLimitResult & { tier?: string }> {
  for (const tier of tiers) {
    const result = await fixedWindowRateLimit(kv, `${key}:${tier.name}`, tier.limit, tier.windowSeconds);

    if (!result.allowed) {
      return { ...result, tier: tier.name };
    }
  }

  return {
    allowed: true,
    remaining: -1, // Multiple tiers
    limit: -1,
    resetAt: Date.now() + tiers[0].windowSeconds * 1000,
  };
}

export function withMultiTierRateLimit(tiers: RateLimitTier[], keyGenerator = KeyGenerators.byIP) {
  return function rateLimitMiddleware(handler: Handler): Handler {
    return async (request, env, ctx) => {
      const key = keyGenerator(request);
      const result = await multiTierRateLimit(env.KV, key, tiers);

      if (!result.allowed) {
        return createRateLimitResponse(result);
      }

      return handler(request, env, ctx);
    };
  };
}

// ============================================
// RATE LIMITER CLASS
// ============================================

export class RateLimiter {
  private kv: KVNamespace;
  private config: RateLimitConfig;

  constructor(kv: KVNamespace, config: RateLimitConfig) {
    this.kv = kv;
    this.config = config;
  }

  async check(request: Request): Promise<RateLimitResult> {
    const keyGenerator = this.config.keyGenerator || KeyGenerators.byIP;
    const key = keyGenerator(request);

    return fixedWindowRateLimit(this.kv, key, this.config.limit, this.config.windowSeconds);
  }

  middleware(handler: Handler): Handler {
    return withRateLimit(this.config)(handler);
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { Hono } from 'hono';
import {
  withRateLimit,
  withMultiTierRateLimit,
  KeyGenerators,
  RateLimiter,
} from './rate-limiter';

const app = new Hono<{ Bindings: Env }>();

// Option 1: Simple rate limit
app.use('/api/*', async (c, next) => {
  const limiter = withRateLimit({
    limit: 100,
    windowSeconds: 60,
    keyGenerator: KeyGenerators.byIP,
    skip: (req) => new URL(req.url).pathname === '/api/health',
  });

  return limiter(async (request, env, ctx) => {
    await next();
    return c.res;
  })(c.req.raw, c.env, c.executionCtx);
});

// Option 2: Multi-tier limits
const tiers = [
  { name: 'second', limit: 10, windowSeconds: 1 },
  { name: 'minute', limit: 100, windowSeconds: 60 },
  { name: 'hour', limit: 1000, windowSeconds: 3600 },
];

app.use('/api/*', async (c, next) => {
  const limiter = withMultiTierRateLimit(tiers);
  return limiter(async () => {
    await next();
    return c.res;
  })(c.req.raw, c.env, c.executionCtx);
});

// Option 3: Per-endpoint limits
app.post('/api/expensive', async (c) => {
  const limiter = new RateLimiter(c.env.KV, {
    limit: 10,
    windowSeconds: 60,
    keyGenerator: KeyGenerators.byUser,
  });

  const result = await limiter.check(c.req.raw);
  if (!result.allowed) {
    return c.json({ error: 'Rate limited' }, 429);
  }

  // Handle expensive operation
  return c.json({ success: true });
});
*/
