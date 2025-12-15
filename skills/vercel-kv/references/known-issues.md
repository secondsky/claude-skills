# Vercel KV Known Issues

This reference documents 10 common issues with Vercel KV and their solutions.

---

## Issue #1: Missing Environment Variables

**Error**: `Error: KV_REST_API_URL is not defined` or `KV_REST_API_TOKEN is not defined`

**Source**: https://vercel.com/docs/storage/vercel-kv/quickstart

**Why It Happens**: Environment variables not set locally or in deployment.

**Prevention**:
```bash
vercel env pull .env.local
```

Ensure `.env.local` is in `.gitignore`. For production, environment variables are automatically available.

---

## Issue #2: JSON Serialization Error

**Error**: `TypeError: Do not know how to serialize a BigInt` or circular reference errors

**Source**: https://github.com/vercel/storage/issues/89

**Why It Happens**: Trying to store non-JSON-serializable data (functions, BigInt, circular refs).

**Prevention**: Only store plain objects, arrays, strings, numbers, booleans, null. Convert BigInt to string:

```typescript
// ❌ Won't work
await kv.set('key', { id: BigInt(123) });

// ✅ Works
await kv.set('key', { id: '123' });
```

---

## Issue #3: Key Naming Collisions

**Error**: Unexpected data returned, data overwritten by different feature.

**Source**: Production debugging, best practices.

**Why It Happens**: Using generic key names like `cache`, `data`, `temp` across different features.

**Prevention**: Always use namespaced keys:

```typescript
// ❌ Bad
await kv.set('123', data);

// ✅ Good
await kv.set('user:123:profile', data);
await kv.set('cache:homepage:en', html);
```

**Naming Patterns:**
- `user:{id}:profile` - User profile data
- `post:{slug}:views` - View counter for post
- `cache:{page}:{locale}` - Cached page content
- `session:{token}` - Session data
- `ratelimit:{ip}:{endpoint}` - Rate limit tracking
- `lock:{resource}` - Distributed locks

---

## Issue #4: TTL Not Set

**Error**: Memory usage grows indefinitely, old data never expires.

**Source**: Vercel KV best practices.

**Why It Happens**: Using `set()` without `setex()` for temporary data.

**Prevention**: Use `setex(key, ttl, value)` for all temporary data:

```typescript
// ❌ Bad - never expires
await kv.set('session:abc', data);

// ✅ Good - expires in 1 hour
await kv.setex('session:abc', 3600, data);
```

---

## Issue #5: Rate Limit Exceeded (Free Tier)

**Error**: `Error: Rate limit exceeded` or commands failing.

**Source**: https://vercel.com/docs/storage/vercel-kv/limits

**Why It Happens**: Exceeding 30,000 commands/month on free tier.

**Prevention**:
1. Monitor usage in Vercel dashboard
2. Upgrade plan if needed
3. Use caching to reduce KV calls
4. Batch operations with `mget`/`mset`/`pipeline`

---

## Issue #6: Storing Large Values

**Error**: `Error: Value too large` or performance degradation.

**Source**: https://vercel.com/docs/storage/vercel-kv/limits

**Why It Happens**: Trying to store values >1MB in KV.

**Prevention**:
- Use Vercel Blob for files/images
- Keep KV values small (<100KB recommended)
- Compress data if needed

---

## Issue #7: Type Mismatch on Get

**Error**: TypeScript errors, runtime type errors.

**Source**: Common TypeScript issue.

**Why It Happens**: `kv.get()` returns `unknown` type, need to cast or validate.

**Prevention**: Use type assertion with validation:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

const user = await kv.get<z.infer<typeof UserSchema>>('user:123');
if (user) {
  const validated = UserSchema.parse(user);
}
```

---

## Issue #8: Pipeline Errors Not Handled

**Error**: Silent failures, partial execution.

**Source**: https://github.com/vercel/storage/issues/120

**Why It Happens**: Pipeline execution can have individual command failures.

**Prevention**: Check results array from `pipeline.exec()`:

```typescript
const pipeline = kv.pipeline();
pipeline.set('key1', 'value1');
pipeline.incr('counter');
pipeline.get('config');

const results = await pipeline.exec();
// Check each result for errors
results.forEach((result, index) => {
  if (result instanceof Error) {
    console.error(`Command ${index} failed:`, result);
  }
});
```

---

## Issue #9: Scan Operation Inefficiency

**Error**: Slow queries, timeout errors.

**Source**: Redis best practices.

**Why It Happens**: Using `scan()` with large datasets or wrong cursor handling.

**Prevention**:
1. Limit `count` parameter
2. Iterate properly with cursor
3. Avoid full scans in production

```typescript
// Proper cursor iteration
let cursor = '0';
do {
  const [nextCursor, keys] = await kv.scan(cursor, {
    match: 'user:*',
    count: 100
  });
  cursor = nextCursor;
  // Process keys...
} while (cursor !== '0');
```

---

## Issue #10: Missing TTL Refresh

**Error**: Session expires too early, cache invalidates prematurely.

**Source**: Production debugging.

**Why It Happens**: Not refreshing TTL on access (sliding expiration).

**Prevention**: Use `expire(key, newTTL)` on access:

```typescript
async function getSession(sessionId: string) {
  const session = await kv.get(`session:${sessionId}`);

  if (session) {
    // Refresh TTL on access (sliding window)
    await kv.expire(`session:${sessionId}`, 7 * 24 * 3600);
  }

  return session;
}
```

---

## Quick Reference Table

| Issue | Error | Quick Fix |
|-------|-------|-----------|
| #1 Missing env vars | `KV_REST_API_URL not defined` | Run `vercel env pull .env.local` |
| #2 Serialization | `Cannot serialize BigInt` | Convert to string, use plain objects |
| #3 Key collisions | Unexpected data | Use namespaced keys: `user:123:profile` |
| #4 TTL not set | Memory grows | Use `setex()` with TTL |
| #5 Rate limit | Commands failing | Batch operations, upgrade plan |
| #6 Large values | Value too large | Use Vercel Blob for >100KB |
| #7 Type mismatch | TypeScript errors | Use Zod validation |
| #8 Pipeline errors | Silent failures | Check results array |
| #9 Scan inefficiency | Timeout errors | Limit count, use cursor |
| #10 TTL refresh | Early expiration | Use `expire()` on access |

---

## See Also

- **Official Docs**: https://vercel.com/docs/storage/vercel-kv
- **SDK Reference**: https://vercel.com/docs/storage/vercel-kv/kv-reference
- **Redis Commands**: https://redis.io/commands
