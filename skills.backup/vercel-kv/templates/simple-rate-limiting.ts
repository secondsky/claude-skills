// Simple Rate Limiting with Vercel KV
// Protect API routes from abuse with sliding window and fixed window patterns

import { kv } from '@vercel/kv';

// ============================================================================
// FIXED WINDOW RATE LIMITING (Simple, Good Enough for Most Cases)
// ============================================================================

/**
 * Fixed window rate limiter
 * Allows N requests per window (e.g., 10 requests per minute)
 *
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @param limit - Maximum requests per window
 * @param windowSeconds - Window duration in seconds
 * @returns Object with allowed status and remaining count
 */
export async function fixedWindowRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const key = `ratelimit:${identifier}`;

  // Increment counter
  const current = await kv.incr(key);

  // If first request in window, set TTL
  if (current === 1) {
    await kv.expire(key, windowSeconds);
  }

  // Get TTL to calculate reset time
  const ttl = await kv.ttl(key);
  const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000));

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
  };
}

// ============================================================================
// SLIDING WINDOW RATE LIMITING (More Accurate, Prevents Bursts)
// ============================================================================

/**
 * Sliding window rate limiter using sorted set
 * More accurate than fixed window, prevents burst at window boundaries
 *
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @param limit - Maximum requests per window
 * @param windowSeconds - Window duration in seconds
 */
export async function slidingWindowRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const key = `ratelimit:sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Remove old entries outside the window
  await kv.zremrangebyscore(key, 0, windowStart);

  // Count requests in current window
  const count = await kv.zcard(key);

  if (count < limit) {
    // Add current request with timestamp as score
    await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration for cleanup
    await kv.expire(key, windowSeconds * 2);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: new Date(now + (windowSeconds * 1000)),
    };
  }

  // Get oldest entry to calculate when it expires
  const oldest = await kv.zrange(key, 0, 0, { withScores: true });
  const resetAt = oldest.length > 0
    ? new Date(oldest[0].score + (windowSeconds * 1000))
    : new Date(now + (windowSeconds * 1000));

  return {
    allowed: false,
    remaining: 0,
    resetAt,
  };
}

// ============================================================================
// RATE LIMIT MIDDLEWARE (Next.js API Routes)
// ============================================================================

/**
 * Middleware function for Next.js API routes
 * Use with standard Next.js route handlers
 */
export async function withRateLimit<T>(
  request: Request,
  handler: () => Promise<T>,
  options: {
    identifier?: string;  // Defaults to IP from headers
    limit?: number;       // Default: 10
    windowSeconds?: number; // Default: 60 (1 minute)
    algorithm?: 'fixed' | 'sliding'; // Default: 'fixed'
  } = {}
): Promise<Response | T> {
  const {
    limit = 10,
    windowSeconds = 60,
    algorithm = 'fixed',
  } = options;

  // Get identifier (IP address by default)
  const identifier = options.identifier ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Apply rate limit
  const result = algorithm === 'sliding'
    ? await slidingWindowRateLimit(identifier, limit, windowSeconds)
    : await fixedWindowRateLimit(identifier, limit, windowSeconds);

  if (!result.allowed) {
    return new Response(JSON.stringify({
      error: 'Too many requests',
      resetAt: result.resetAt.toISOString(),
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
        'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
      },
    });
  }

  // Call handler
  return handler();
}

// ============================================================================
// VIEW COUNTER (Simple Incrementing Counter)
// ============================================================================

/**
 * Simple view counter for pages, posts, etc.
 * Increments count and returns new value
 */
export async function incrementViewCount(resourceId: string): Promise<number> {
  const key = `views:${resourceId}`;
  const count = await kv.incr(key);
  return count;
}

/**
 * Get view count without incrementing
 */
export async function getViewCount(resourceId: string): Promise<number> {
  const key = `views:${resourceId}`;
  const count = await kv.get<number>(key);
  return count || 0;
}

/**
 * Get view counts for multiple resources
 */
export async function getViewCounts(resourceIds: string[]): Promise<Record<string, number>> {
  const keys = resourceIds.map(id => `views:${id}`);
  const counts = await kv.mget<number[]>(...keys);

  return resourceIds.reduce((acc, id, index) => {
    acc[id] = counts[index] || 0;
    return acc;
  }, {} as Record<string, number>);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Next.js API Route with Fixed Window Rate Limit
/*
// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { withRateLimit } from './simple-rate-limiting';

export async function GET(request: Request) {
  return withRateLimit(
    request,
    async () => {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q');

      // Your search logic here
      const results = await searchDatabase(query);

      return NextResponse.json({ results });
    },
    {
      limit: 10,        // 10 requests
      windowSeconds: 60, // per minute
    }
  );
}
*/

// Example 2: Next.js API Route with Sliding Window
/*
// app/api/ai-generation/route.ts
import { NextResponse } from 'next/server';
import { withRateLimit } from './simple-rate-limiting';

export async function POST(request: Request) {
  return withRateLimit(
    request,
    async () => {
      const body = await request.json();

      // Expensive AI operation
      const result = await generateWithAI(body.prompt);

      return NextResponse.json({ result });
    },
    {
      algorithm: 'sliding',  // More accurate for expensive operations
      limit: 5,              // 5 requests
      windowSeconds: 3600,   // per hour
    }
  );
}
*/

// Example 3: Rate Limit by User ID Instead of IP
/*
import { getSession } from './session-management';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return withRateLimit(
    request,
    async () => {
      // Your logic
      return NextResponse.json({ success: true });
    },
    {
      identifier: `user:${session.userId}`,  // Rate limit per user
      limit: 100,
      windowSeconds: 3600,
    }
  );
}
*/

// Example 4: View Counter in Server Action
/*
'use server';

import { incrementViewCount } from './simple-rate-limiting';

export async function recordPageView(pageSlug: string) {
  const views = await incrementViewCount(pageSlug);
  return views;
}
*/

// Example 5: Display View Count in Component
/*
'use client';

import { useEffect, useState } from 'react';

export function ViewCounter({ postId }: { postId: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Increment view count
    fetch('/api/increment-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
      .then(res => res.json())
      .then(data => setViews(data.views));
  }, [postId]);

  if (views === null) return null;

  return (
    <span className="text-sm text-gray-500">
      {views.toLocaleString()} views
    </span>
  );
}
*/

// Example 6: Multiple Rate Limits (Different Tiers)
/*
export async function tieredRateLimit(request: Request) {
  const session = await getSession();

  const limits = session?.role === 'premium'
    ? { limit: 1000, windowSeconds: 3600 }  // Premium: 1000/hour
    : { limit: 100, windowSeconds: 3600 };   // Free: 100/hour

  return withRateLimit(request, async () => {
    // Your logic
    return NextResponse.json({ success: true });
  }, {
    identifier: session ? `user:${session.userId}` : undefined,
    ...limits,
  });
}
*/
