# Vercel KV Common Patterns

This reference provides production-tested patterns for Vercel KV.

---

## Pattern 1: Cache-Aside (Lazy Loading)

The most common caching pattern. Check cache first, fetch from database on miss.

```typescript
import { kv } from '@vercel/kv';

async function getUser(id: number) {
  const cacheKey = `user:${id}`;

  // Check cache first
  const cached = await kv.get<User>(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });

  if (!user) return null;

  // Cache for 5 minutes
  await kv.setex(cacheKey, 300, user);

  return user;
}
```

**When to use:**
- Read-heavy workloads
- Data that doesn't change frequently
- Acceptable for stale reads

---

## Pattern 2: Write-Through Cache

Update cache immediately when data changes.

```typescript
import { kv } from '@vercel/kv';

async function updateUser(id: number, data: Partial<User>) {
  // Update database
  const updated = await db.update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  // Update cache immediately
  await kv.setex(`user:${id}`, 300, updated[0]);

  return updated[0];
}

async function deleteUser(id: number) {
  // Delete from database
  await db.delete(users).where(eq(users.id, id));

  // Remove from cache
  await kv.del(`user:${id}`);
}
```

**When to use:**
- Write operations must reflect immediately
- Consistency is important
- Combined with Cache-Aside for reads

---

## Pattern 3: Rate Limiting

Control API request frequency per user/IP.

```typescript
import { kv } from '@vercel/kv';

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const limit = 10; // 10 requests
  const window = 60; // per 60 seconds

  const current = await kv.incr(key);

  if (current === 1) {
    // First request, set TTL
    await kv.expire(key, window);
  }

  return current <= limit;
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!await checkRateLimit(ip)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Process request...
}
```

**Advanced: Sliding Window**

```typescript
async function slidingWindowRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove old entries
  await kv.zremrangebyscore(key, 0, windowStart);

  // Count current entries
  const count = await kv.zcount(key, windowStart, now);

  if (count >= limit) {
    return false;
  }

  // Add current request
  await kv.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  await kv.expire(key, Math.ceil(windowMs / 1000));

  return true;
}
```

---

## Pattern 4: Session Management

Secure session storage with automatic expiration.

```typescript
import { kv } from '@vercel/kv';
import { cookies } from 'next/headers';

const SESSION_TTL = 7 * 24 * 3600; // 7 days

export async function createSession(userId: number) {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now()
  };

  // Store session
  await kv.setex(`session:${sessionId}`, SESSION_TTL, sessionData);

  // Set cookie
  (await cookies()).set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL
  });

  return sessionId;
}

export async function getSession() {
  const sessionId = (await cookies()).get('session')?.value;
  if (!sessionId) return null;

  const session = await kv.get(`session:${sessionId}`);

  if (session) {
    // Refresh TTL on access (sliding window)
    await kv.expire(`session:${sessionId}`, SESSION_TTL);
  }

  return session;
}

export async function destroySession() {
  const sessionId = (await cookies()).get('session')?.value;
  if (sessionId) {
    await kv.del(`session:${sessionId}`);
    (await cookies()).delete('session');
  }
}
```

---

## Pattern 5: Distributed Lock

Prevent concurrent execution of critical sections.

```typescript
import { kv } from '@vercel/kv';

async function acquireLock(resource: string, timeout: number = 10): Promise<string | null> {
  const lockKey = `lock:${resource}`;
  const lockValue = crypto.randomUUID();

  // Try to set lock (only if not exists)
  const acquired = await kv.setnx(lockKey, lockValue);

  if (acquired) {
    // Set TTL to prevent deadlock
    await kv.expire(lockKey, timeout);
    return lockValue;
  }

  return null;
}

async function releaseLock(resource: string, lockValue: string): Promise<boolean> {
  const lockKey = `lock:${resource}`;
  const current = await kv.get(lockKey);

  // Only delete if we own the lock
  if (current === lockValue) {
    await kv.del(lockKey);
    return true;
  }

  return false;
}

// Usage
async function processOrdersWithLock() {
  const lock = await acquireLock('process-orders', 30);

  if (!lock) {
    console.log('Another process is handling orders');
    return;
  }

  try {
    await processOrders();
  } finally {
    await releaseLock('process-orders', lock);
  }
}
```

---

## Pattern 6: Leaderboard

Sorted rankings using sorted sets.

```typescript
import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'leaderboard:global';

async function updateScore(userId: number, score: number) {
  await kv.zadd(LEADERBOARD_KEY, { score, member: userId.toString() });
}

async function incrementScore(userId: number, increment: number) {
  await kv.zincrby(LEADERBOARD_KEY, increment, userId.toString());
}

async function getTopPlayers(limit: number = 10) {
  // Get top scores (descending order)
  const top = await kv.zrange(LEADERBOARD_KEY, 0, limit - 1, {
    rev: true,
    withScores: true
  });

  return top;
}

async function getUserRank(userId: number): Promise<number | null> {
  // Get user's rank (0-based, so add 1 for 1-based)
  const rank = await kv.zrevrank(LEADERBOARD_KEY, userId.toString());
  return rank !== null ? rank + 1 : null;
}

async function getUserScore(userId: number): Promise<number | null> {
  return await kv.zscore(LEADERBOARD_KEY, userId.toString());
}

async function getPlayerContext(userId: number, range: number = 2) {
  // Get players around the user
  const rank = await kv.zrevrank(LEADERBOARD_KEY, userId.toString());
  if (rank === null) return null;

  const start = Math.max(0, rank - range);
  const end = rank + range;

  return await kv.zrange(LEADERBOARD_KEY, start, end, {
    rev: true,
    withScores: true
  });
}
```

---

## Pattern 7: Pipeline (Batch Operations)

Execute multiple commands in a single round-trip.

```typescript
import { kv } from '@vercel/kv';

async function getUserDashboard(userId: number) {
  const pipeline = kv.pipeline();

  pipeline.get(`user:${userId}:profile`);
  pipeline.get(`user:${userId}:settings`);
  pipeline.zrevrange(`user:${userId}:notifications`, 0, 4);
  pipeline.hgetall(`user:${userId}:stats`);

  const [profile, settings, notifications, stats] = await pipeline.exec();

  return { profile, settings, notifications, stats };
}

async function batchUpdateCounters(counters: Record<string, number>) {
  const pipeline = kv.pipeline();

  for (const [key, increment] of Object.entries(counters)) {
    pipeline.incrby(key, increment);
  }

  return await pipeline.exec();
}
```

---

## Pattern 8: Feature Flags

Simple feature flag management.

```typescript
import { kv } from '@vercel/kv';

const FLAGS_KEY = 'flags:global';

async function setFlag(flag: string, enabled: boolean) {
  await kv.hset(FLAGS_KEY, { [flag]: enabled ? '1' : '0' });
}

async function getFlag(flag: string): Promise<boolean> {
  const value = await kv.hget(FLAGS_KEY, flag);
  return value === '1';
}

async function getAllFlags(): Promise<Record<string, boolean>> {
  const flags = await kv.hgetall(FLAGS_KEY);
  if (!flags) return {};

  return Object.fromEntries(
    Object.entries(flags).map(([k, v]) => [k, v === '1'])
  );
}

// Usage
if (await getFlag('new-checkout-flow')) {
  // Show new checkout
} else {
  // Show old checkout
}
```

---

## Quick Reference

| Pattern | Use Case | Key Commands |
|---------|----------|--------------|
| Cache-Aside | Read caching | `get`, `setex` |
| Write-Through | Write consistency | `setex`, `del` |
| Rate Limiting | API protection | `incr`, `expire` |
| Session Management | User sessions | `setex`, `get`, `del` |
| Distributed Lock | Concurrency control | `setnx`, `expire`, `del` |
| Leaderboard | Rankings | `zadd`, `zrange`, `zrevrank` |
| Pipeline | Batch operations | `pipeline().exec()` |
| Feature Flags | Toggle features | `hset`, `hget`, `hgetall` |

---

## See Also

- **Official Docs**: https://vercel.com/docs/storage/vercel-kv
- **Redis Commands**: https://redis.io/commands
