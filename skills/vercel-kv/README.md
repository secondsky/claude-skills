# Vercel KV Skill

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-29
**Package Version**: `@vercel/kv@3.0.0`

---

## Auto-Trigger Keywords

### Primary
- `@vercel/kv`, `vercel kv`, `vercel redis`, `upstash vercel`

### Use Cases
- caching, sessions, rate limiting, distributed locks, leaderboards, counters

### Errors
- "KV_REST_API_URL not set", "rate limit exceeded", "JSON serialization error", "TTL not set"

---

## What This Skill Does

Redis-compatible key-value storage for Vercel applications. Perfect for caching, sessions, rate limiting, and temporary data with TTL.

✅ Redis API (get/set/incr/zadd)
✅ Automatic JSON serialization
✅ Edge & serverless compatible
✅ 10 errors prevented (TTL, serialization, naming, etc.)
✅ ~55% token savings

---

## Quick Start

```bash
# 1. Create KV database in Vercel dashboard
vercel env pull .env.local

# 2. Install
npm install @vercel/kv

# 3. Use
import { kv } from '@vercel/kv';
const views = await kv.incr(`views:${slug}`);
await kv.setex('session:abc', 3600, { userId: 123 });
```

**Full details**: [SKILL.md](SKILL.md)

---

## Errors Prevented (10 Total)

1. Missing environment variables
2. JSON serialization errors (BigInt, circular refs)
3. Key naming collisions
4. TTL not set (memory leaks)
5. Rate limit exceeded
6. Storing large values (>1MB)
7. Type mismatches
8. Pipeline errors
9. Scan inefficiency
10. Missing TTL refresh

---

## Related Skills

- **cloudflare-kv**: Cloudflare's KV (eventual consistency)
- **neon-vercel-postgres**: For persistent data (not cache)
- **vercel-blob**: For large files/images

---

## Official Docs

- https://vercel.com/docs/storage/vercel-kv
- https://redis.io/commands (Redis-compatible)
