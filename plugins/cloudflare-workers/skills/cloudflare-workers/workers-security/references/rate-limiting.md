# Rate Limiting for Cloudflare Workers

Comprehensive guide to implementing rate limiting for API protection.

## Rate Limiting Strategies

| Strategy | Best For | Complexity |
|----------|----------|------------|
| Fixed Window | Simple APIs | Low |
| Sliding Window | Precise control | Medium |
| Token Bucket | Burst handling | Medium |
| Leaky Bucket | Smooth rate | Medium |
| Cloudflare Rate Limiting | Production | Low (managed) |

## Fixed Window Rate Limiting

### Basic Implementation with KV

```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const windowEnd = windowStart + windowSeconds * 1000;
  const kvKey = `ratelimit:${key}:${windowStart}`;

  // Get current count
  const countStr = await kv.get(kvKey);
  const count = countStr ? parseInt(countStr, 10) : 0;

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
      retryAfter: Math.ceil((windowEnd - now) / 1000),
    };
  }

  // Increment count
  await kv.put(kvKey, (count + 1).toString(), {
    expirationTtl: windowSeconds,
  });

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: windowEnd,
  };
}
```

### Response Headers

```typescript
function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number
): Response {
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('X-RateLimit-Limit', limit.toString());
  newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  newResponse.headers.set('X-RateLimit-Reset', result.resetAt.toString());

  if (!result.allowed && result.retryAfter) {
    newResponse.headers.set('Retry-After', result.retryAfter.toString());
  }

  return newResponse;
}
```

## Sliding Window Rate Limiting

```typescript
interface SlidingWindowResult {
  allowed: boolean;
  remaining: number;
  windowStart: number;
}

async function slidingWindowRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<SlidingWindowResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  const kvKey = `ratelimit:sliding:${key}`;

  // Get timestamps of recent requests
  const data = await kv.get<number[]>(kvKey, 'json') || [];

  // Filter to only requests in current window
  const recentRequests = data.filter(ts => ts > windowStart);

  if (recentRequests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      windowStart,
    };
  }

  // Add current request
  recentRequests.push(now);

  // Store updated list
  await kv.put(kvKey, JSON.stringify(recentRequests), {
    expirationTtl: windowSeconds,
  });

  return {
    allowed: true,
    remaining: limit - recentRequests.length,
    windowStart,
  };
}
```

## Token Bucket Rate Limiting

```typescript
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface TokenBucketConfig {
  capacity: number;     // Max tokens
  refillRate: number;   // Tokens per second
}

async function tokenBucketRateLimit(
  kv: KVNamespace,
  key: string,
  config: TokenBucketConfig,
  tokensRequested = 1
): Promise<RateLimitResult> {
  const now = Date.now();
  const kvKey = `bucket:${key}`;

  // Get or initialize bucket
  let bucket = await kv.get<TokenBucket>(kvKey, 'json');

  if (!bucket) {
    bucket = {
      tokens: config.capacity,
      lastRefill: now,
    };
  }

  // Calculate tokens to add since last refill
  const timePassed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = timePassed * config.refillRate;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if we have enough tokens
  if (bucket.tokens < tokensRequested) {
    // Calculate when tokens will be available
    const tokensNeeded = tokensRequested - bucket.tokens;
    const waitTime = tokensNeeded / config.refillRate;

    await kv.put(kvKey, JSON.stringify(bucket), { expirationTtl: 3600 });

    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      resetAt: now + waitTime * 1000,
      retryAfter: Math.ceil(waitTime),
    };
  }

  // Consume tokens
  bucket.tokens -= tokensRequested;
  await kv.put(kvKey, JSON.stringify(bucket), { expirationTtl: 3600 });

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetAt: now + (config.capacity - bucket.tokens) / config.refillRate * 1000,
  };
}
```

## Rate Limiting with Durable Objects

### Rate Limiter Durable Object

```typescript
interface RateLimiterState {
  requests: number[];
}

export class RateLimiter {
  private state: DurableObjectState;
  private requests: number[] = [];
  private limit: number = 100;
  private windowMs: number = 60000; // 1 minute

  constructor(state: DurableObjectState) {
    this.state = state;

    state.blockConcurrencyWhile(async () => {
      const stored = await state.storage.get<number[]>('requests');
      if (stored) {
        this.requests = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old requests
    this.requests = this.requests.filter(ts => ts > windowStart);

    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const resetAt = oldestRequest + this.windowMs;

      return Response.json({
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000),
      }, { status: 429 });
    }

    // Add request
    this.requests.push(now);
    await this.state.storage.put('requests', this.requests);

    return Response.json({
      allowed: true,
      remaining: this.limit - this.requests.length,
      resetAt: now + this.windowMs,
    });
  }
}

// Worker using DO rate limiter
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = env.RATE_LIMITER.idFromName(clientIP);
    const limiter = env.RATE_LIMITER.get(id);

    const result = await limiter.fetch(new Request('http://internal/check'));
    const data = await result.json();

    if (!data.allowed) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': data.retryAfter.toString(),
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    // Continue with request handling
    return handleRequest(request, env);
  }
};
```

## Multi-Tier Rate Limiting

```typescript
interface RateLimitTier {
  name: string;
  windowSeconds: number;
  limit: number;
}

const tiers: RateLimitTier[] = [
  { name: 'second', windowSeconds: 1, limit: 10 },
  { name: 'minute', windowSeconds: 60, limit: 100 },
  { name: 'hour', windowSeconds: 3600, limit: 1000 },
];

async function multiTierRateLimit(
  kv: KVNamespace,
  key: string
): Promise<RateLimitResult> {
  for (const tier of tiers) {
    const result = await checkRateLimit(kv, `${key}:${tier.name}`, tier.limit, tier.windowSeconds);

    if (!result.allowed) {
      return {
        ...result,
        tier: tier.name,
      } as RateLimitResult & { tier: string };
    }
  }

  return {
    allowed: true,
    remaining: -1, // Multiple limits, don't show single value
    resetAt: Date.now() + tiers[0].windowSeconds * 1000,
  };
}
```

## Per-User Rate Limiting

```typescript
interface UserRateLimits {
  free: { requests: number; windowSeconds: number };
  pro: { requests: number; windowSeconds: number };
  enterprise: { requests: number; windowSeconds: number };
}

const userLimits: UserRateLimits = {
  free: { requests: 100, windowSeconds: 3600 },
  pro: { requests: 1000, windowSeconds: 3600 },
  enterprise: { requests: 10000, windowSeconds: 3600 },
};

async function userRateLimit(
  kv: KVNamespace,
  userId: string,
  userTier: keyof UserRateLimits
): Promise<RateLimitResult> {
  const limits = userLimits[userTier];
  return checkRateLimit(kv, `user:${userId}`, limits.requests, limits.windowSeconds);
}
```

## Rate Limit Middleware

```typescript
interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyGenerator?: (request: Request) => string;
  skipIf?: (request: Request) => boolean;
}

function createRateLimiter(kv: KVNamespace, options: RateLimitOptions) {
  const {
    limit,
    windowSeconds,
    keyGenerator = (req) => req.headers.get('CF-Connecting-IP') || 'unknown',
    skipIf = () => false,
  } = options;

  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    // Skip rate limiting for certain requests
    if (skipIf(request)) {
      return next();
    }

    const key = keyGenerator(request);
    const result = await checkRateLimit(kv, key, limit, windowSeconds);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toString(),
          },
        }
      );
    }

    const response = await next();
    return addRateLimitHeaders(response, result, limit);
  };
}

// Usage with Hono
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', async (c, next) => {
  const rateLimiter = createRateLimiter(c.env.KV, {
    limit: 100,
    windowSeconds: 60,
    keyGenerator: (req) => {
      // Use API key if present, otherwise IP
      return req.headers.get('X-API-Key') ||
             req.headers.get('CF-Connecting-IP') ||
             'anonymous';
    },
    skipIf: (req) => {
      // Skip rate limiting for health checks
      return new URL(req.url).pathname === '/api/health';
    },
  });

  return rateLimiter(c.req.raw, () => next());
});
```

## Cloudflare Rate Limiting API

```typescript
interface RateLimitBinding {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

interface Env {
  MY_RATE_LIMITER: RateLimitBinding;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    const { success } = await env.MY_RATE_LIMITER.limit({
      key: clientIP,
    });

    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    return handleRequest(request);
  }
};
```

```jsonc
// wrangler.jsonc
{
  "rate_limits": [
    {
      "binding": "MY_RATE_LIMITER",
      "namespace_id": "xxx",
      "simple": {
        "limit": 100,
        "period": 60
      }
    }
  ]
}
```
