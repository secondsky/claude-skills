# Cloudflare Workers KV - Limits & Quotas

Comprehensive reference for KV limits, quotas, and pricing.

---

## Storage Limits

### Key Size
- **Maximum:** 512 bytes (UTF-8 encoded)
- **Recommendation:** Keep keys short (50-100 bytes)
- **Example:** `user:123:preferences` (22 bytes)

### Value Size
- **Maximum:** 25 MB per value
- **Recommendation:** Store large files in R2, use KV for metadata
- **Calculation:**
  ```typescript
  const sizeInBytes = new Blob([value]).size;
  if (sizeInBytes > 25 * 1024 * 1024) {
    throw new Error('Value exceeds 25MB limit');
  }
  ```

### Metadata Size
- **Maximum:** 1024 bytes (1 KB) per key
- **Use case:** Store small structured data alongside values
- **Example:**
  ```typescript
  await env.KV.put('key', value, {
    metadata: {
      created: Date.now(),
      author: 'user123',
      version: '1.0'
    } // Must be <1KB when JSON stringified
  });
  ```

### Namespace Limits
- **Maximum keys:** Unlimited
- **Maximum namespaces:** Unlimited
- **Recommendation:** Organize with prefixes vs creating many namespaces

---

## Operation Rate Limits

### Write Operations (put/delete)
- **Limit:** 1000 operations/second **per key**
- **Scope:** Per key, not per namespace
- **Example:**
  ```typescript
  // ❌ Will hit rate limit (>1000 writes/sec to same key)
  for (let i = 0; i < 2000; i++) {
    await env.KV.put('counter', String(i));
  }

  // ✅ Won't hit rate limit (different keys)
  for (let i = 0; i < 2000; i++) {
    await env.KV.put(`counter:${i}`, String(i));
  }
  ```

**Rate Limit Response:**
- HTTP Status: `429 Too Many Requests`
- Error: "Rate limit exceeded"
- **Solution:** Implement exponential backoff or distribute across keys

### Read Operations (get)
- **Limit:** Unlimited
- **cacheTtl:** Enables edge caching (highly recommended)
- **Performance:** ~1-5ms with cacheTtl vs ~50-200ms without

### List Operations
- **Limit:** 100 operations/second per namespace
- **Maximum keys per list():** 1000
- **Pagination:** Required for >1000 keys
- **Example:**
  ```typescript
  async function listAll(kv, prefix = '') {
    let keys = [];
    let cursor;

    do {
      const result = await kv.list({ prefix, cursor, limit: 1000 });
      keys.push(...result.keys);
      cursor = result.cursor;
    } while (cursor);

    return keys;
  }
  ```

---

## Worker-Specific Limits

### Operations Per Invocation
- **Maximum:** 1000 KV operations per Worker invocation
- **Includes:** All get/put/delete/list calls combined
- **Workaround:** Use bulk operations where possible
- **Example:**
  ```typescript
  // ❌ 100 operations
  for (let i = 0; i < 100; i++) {
    await env.KV.get(`key${i}`);
  }

  // ✅ 1 operation (if supported by API)
  const values = await env.KV.get(['key0', 'key1', ...]);
  ```

### CPU Time
- Workers have 50ms CPU time limit (free) or 30s (paid)
- Large KV operations count toward this
- Use `ctx.waitUntil()` for non-critical operations

---

## Pricing

### Free Tier
- **Read operations:** 100,000/day
- **Write operations:** 1,000/day
- **Delete operations:** 1,000/day
- **Storage:** 1 GB
- **List operations:** Included in write quota

### Paid Tier (Workers Paid Plan)
- **Read operations:** $0.50 per million reads
- **Write operations:** $5.00 per million writes
- **Delete operations:** $5.00 per million deletes
- **Storage:** $0.50 per GB-month
- **List operations:** Counted as read operations

### Cost Examples

**Example 1: Configuration Storage**
- 1000 config updates/day (writes)
- 1,000,000 config reads/day (reads)
- 10 MB storage

**Monthly Cost:**
- Writes: 30,000 × $5/million = $0.15
- Reads: 30M × $0.50/million = $15.00
- Storage: 0.01 GB × $0.50 = $0.005
- **Total:** ~$15.15/month

**Example 2: Session Management**
- 100,000 sessions/day (writes)
- 500,000 session reads/day (reads)
- 1 GB storage (TTL=24h keeps it bounded)

**Monthly Cost:**
- Writes: 3M × $5/million = $15.00
- Reads: 15M × $0.50/million = $7.50
- Storage: 1 GB × $0.50 = $0.50
- **Total:** ~$23.00/month

### Cost Optimization Tips

1. **Use TTL to reduce storage costs**
   ```typescript
   // Auto-expire temporary data
   await env.KV.put('session', data, {
     expirationTtl: 86400 // 24 hours
   });
   ```

2. **Use cacheTtl to reduce read operations**
   ```typescript
   // Cache at edge = fewer KV reads
   const config = await env.KV.get('config', {
     cacheTtl: 3600 // 1 hour
   });
   ```

3. **Coalesce small values**
   ```typescript
   // ❌ 5 write operations
   await env.KV.put('user:name', name);
   await env.KV.put('user:email', email);
   await env.KV.put('user:age', age);
   await env.KV.put('user:city', city);
   await env.KV.put('user:country', country);

   // ✅ 1 write operation
   await env.KV.put('user', JSON.stringify({
     name, email, age, city, country
   }));
   ```

4. **Use metadata for small data**
   ```typescript
   // Metadata is included in get() at no extra cost
   await env.KV.put('key', mainValue, {
     metadata: { count: 123, updated: Date.now() }
   });

   const { value, metadata } = await env.KV.getWithMetadata('key');
   // One operation, two pieces of data
   ```

5. **Use waitUntil() for non-critical writes**
   ```typescript
   // Don't wait for analytics writes
   ctx.waitUntil(
     env.KV.put('analytics', data)
   );
   // Response returns immediately, write happens in background
   ```

---

## Quota Monitoring

### Check Current Usage

**Via Cloudflare Dashboard:**
1. Log in to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your Worker
4. View Metrics tab
5. Check KV operations graph

**Via API:**
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}" \
  -H "Authorization: Bearer {api_token}"
```

### Set Up Alerts

Create alerts for approaching limits:
1. Dashboard → Notifications
2. Create KV usage alert
3. Set threshold (e.g., 80% of daily quota)
4. Configure notification method (email/webhook)

---

## Limit Workarounds

### For High-Frequency Writes (>1000/sec to same key)

**Problem:** Need to update counter >1000 times/second

**Solutions:**
1. **Use Durable Objects** (designed for high-frequency state)
2. **Distribute across keys**
   ```typescript
   const shardKey = `counter:shard${Math.floor(Math.random() * 10)}`;
   await env.KV.put(shardKey, newValue);
   ```
3. **Batch updates**
   ```typescript
   // Accumulate in memory, write periodically
   let batch = [];
   setInterval(() => {
     env.KV.put('batch', JSON.stringify(batch));
     batch = [];
   }, 1000);
   ```

### For Large Values (>25 MB)

**Problem:** Need to store 100MB file

**Solution:** Use R2 for objects, KV for metadata
```typescript
// Upload large file to R2
await env.R2.put('file.pdf', fileData);

// Store metadata in KV
await env.KV.put('file:metadata', JSON.stringify({
  r2Key: 'file.pdf',
  size: 100_000_000,
  type: 'application/pdf'
}));
```

### For Strong Consistency

**Problem:** Need immediate global consistency

**Solution:** Use D1 or Durable Objects
```typescript
// KV: Eventually consistent, optimized for reads
await env.KV.put('config', value); // May take 60s to propagate

// D1: Strongly consistent, optimized for transactions
await env.DB.prepare('UPDATE config SET value = ?').bind(value).run();
```

---

## Comparison with Alternatives

| Feature | KV | D1 | R2 | Durable Objects |
|---------|----|----|----|----|
| **Consistency** | Eventual | Strong | Strong | Strong |
| **Max Value Size** | 25 MB | Row-based | 5 TB | Memory-limited |
| **Write Limit** | 1000/sec/key | DB limits | Unlimited | Unlimited |
| **Best For** | Config, cache | Relational data | Large files | State, counters |
| **Read Performance** | Excellent (with cacheTtl) | Good | Good | Excellent |
| **Global Distribution** | Yes | Regional | Yes | Global |

---

## Best Practices for Staying Within Limits

1. **Plan for quotas** - Estimate usage before building
2. **Use TTL aggressively** - Reduce storage costs
3. **Leverage cacheTtl** - Reduce read operations
4. **Monitor usage** - Set up alerts
5. **Design for eventual consistency** - Don't fight KV's nature
6. **Use right tool for job** - KV for reads, D1 for transactions, R2 for files
7. **Test with production data** - Validate assumptions

---

**Last Updated:** 2025-12-27
**Official Limits:** https://developers.cloudflare.com/kv/platform/limits/
