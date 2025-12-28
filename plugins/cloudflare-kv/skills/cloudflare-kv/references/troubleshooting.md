# Cloudflare Workers KV - Troubleshooting Guide

Comprehensive error catalog and solutions for common KV issues.

---

## Error Categories

1. [Configuration Errors](#configuration-errors)
2. [Runtime Errors](#runtime-errors)
3. [Rate Limit Errors](#rate-limit-errors)
4. [Consistency Issues](#consistency-issues)
5. [Performance Problems](#performance-problems)
6. [Integration Errors](#integration-errors)

---

## Configuration Errors

### Error: "KV namespace binding not found"

**Symptoms:**
- `env.MY_KV is undefined`
- TypeScript error: "Property 'MY_KV' does not exist"
- Runtime error: "Cannot read properties of undefined"

**Root Cause:** Missing or misconfigured binding in wrangler.jsonc

**Solution:**
```json
// wrangler.jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "your-namespace-id",
      "preview_id": "your-preview-id"
    }
  ]
}
```

**Verification:**
```bash
# Validate configuration
${CLAUDE_PLUGIN_ROOT}/scripts/validate-kv-config.sh

# Test binding
${CLAUDE_PLUGIN_ROOT}/scripts/test-kv-connection.sh MY_KV
```

---

### Error: "Invalid namespace ID"

**Symptoms:**
- KV operations fail with 404
- "Namespace not found" errors
- Works in dev, fails in production

**Root Cause:** Wrong or missing namespace ID

**Solution:**
```bash
# List your namespaces
wrangler kv namespace list

# Output:
# [
#   {
#     "id": "a1b2c3d4e5f6789012345678901234ab",
#     "title": "my-worker-MY_KV"
#   }
# ]

# Use the ID in wrangler.jsonc
```

---

### Error: "Binding name must be uppercase"

**Symptoms:**
- Warning in validation
- Inconsistent behavior

**Root Cause:** Binding names should follow SCREAMING_SNAKE_CASE convention

**Solution:**
```json
// ❌ Wrong
"binding": "myKv"
"binding": "my-kv"

// ✅ Correct
"binding": "MY_KV"
"binding": "USER_DATA"
```

---

## Runtime Errors

### Error: "KV_ERROR: Operation failed"

**Symptoms:**
- Generic KV_ERROR
- No specific error details
- Intermittent failures

**Common Causes:**
1. Network connectivity issues
2. Cloudflare service disruption
3. Invalid operation parameters
4. Value exceeds 25MB limit

**Solutions:**

**1. Add error handling:**
```typescript
try {
  await env.KV.put('key', value);
} catch (error) {
  console.error('KV Error:', error);
  // Check error.message for details
  if (error.message.includes('too large')) {
    // Value >25MB
  }
}
```

**2. Validate value size:**
```typescript
const MAX_SIZE = 25 * 1024 * 1024; // 25MB
if (value.length > MAX_SIZE) {
  throw new Error(`Value too large: ${value.length} bytes`);
}
```

**3. Add retry logic:**
```typescript
async function putWithRetry(kv, key, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await kv.put(key, value);
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

### Error: "TypeError: env.KV.get is not a function"

**Symptoms:**
- Method doesn't exist error
- Worker crashes on KV call

**Root Cause:** Incorrect binding type or missing TypeScript types

**Solution:**
```typescript
// Add TypeScript types
type Env = {
  KV: KVNamespace; // ← Ensures correct type
};

export default {
  async fetch(request: Request, env: Env) {
    const value = await env.KV.get('key'); // Now typed correctly
    return new Response(value);
  }
};
```

---

## Rate Limit Errors

### Error: "429 Too Many Requests"

**Symptoms:**
- 429 HTTP status
- "Rate limit exceeded"
- Failures during high traffic

**Root Cause:** Exceeding KV rate limits

**Rate Limits:**
- **Write (put/delete):** 1000 operations/second **per key**
- **Read (get):** Unlimited
- **List:** 100 operations/second

**Solutions:**

**1. For writes to same key:**
```typescript
// ❌ Problem: Writing same key repeatedly
for (let i = 0; i < 2000; i++) {
  await env.KV.put('counter', String(i)); // Fails after 1000
}

// ✅ Solution: Distribute across keys
for (let i = 0; i < 2000; i++) {
  await env.KV.put(`counter:${i}`, String(i));
}

// ✅ Solution: Use Durable Objects for high-frequency writes
```

**2. Add exponential backoff:**
```typescript
async function putWithBackoff(kv, key, value, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await kv.put(key, value);
    } catch (err) {
      if (err.message.includes('429')) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

**3. Use waitUntil() for non-critical writes:**
```typescript
// Don't block response on rate-limited writes
ctx.waitUntil(
  env.KV.put('analytics', data).catch(err => {
    console.error('Analytics write failed:', err);
  })
);
return new Response('OK'); // Returns immediately
```

---

## Consistency Issues

### Issue: "Just wrote value but get() returns null"

**Symptoms:**
- put() succeeds
- Immediate get() returns null
- Value appears after 30-60 seconds

**Root Cause:** Eventual consistency - KV writes propagate globally over time

**Expected Behavior:**
- Writes visible locally immediately
- Global propagation takes up to 60 seconds
- This is by design, not a bug

**Solutions:**

**1. Design for eventual consistency:**
```typescript
// Write with metadata
await env.KV.put('config', JSON.stringify(config), {
  metadata: { updated: Date.now(), version: '1.0' }
});

// Read with fallback
let config = await env.KV.get('config', 'json');
if (!config) {
  config = DEFAULT_CONFIG; // Use default while propagating
}
```

**2. Use strong consistency (D1) for critical data:**
```typescript
// For data requiring immediate consistency:
// ❌ Don't use KV for real-time data
await env.KV.put('order', orderData); // Might not be visible immediately

// ✅ Use D1 for transactions
await env.DB.prepare('INSERT INTO orders VALUES (?)').bind(orderData).run();
```

**3. Add version tracking:**
```typescript
// Write with version
const version = Date.now();
await env.KV.put('data', value, {
  metadata: { version }
});

// Read and check version
const { value, metadata } = await env.KV.getWithMetadata('data');
if (!metadata || metadata.version < expectedVersion) {
  // Data not yet propagated, use fallback
}
```

---

### Issue: "Different values in different regions"

**Symptoms:**
- Users in different countries see different data
- Inconsistent read results

**Root Cause:** Eventual consistency + edge caching

**Solution:**
```typescript
// For data that must be consistent globally:
// 1. Accept 60-second propagation delay
// 2. Use lower cacheTtl
const value = await env.KV.get('critical-config', {
  cacheTtl: 60 // Short cache for faster updates
});

// 3. Or use D1 for strong consistency
```

---

## Performance Problems

### Issue: "KV operations are slow (>100ms)"

**Common Causes:**
1. Missing cacheTtl on get()
2. Large value sizes
3. Sequential operations (not parallelized)
4. Network latency

**Solutions:**

**1. Add cacheTtl:**
```typescript
// ❌ Slow: Every get() hits KV store
const config = await env.KV.get('config'); // ~50-200ms

// ✅ Fast: Cached at edge
const config = await env.KV.get('config', { cacheTtl: 300 }); // ~1-5ms after first read
```

**2. Parallelize independent operations:**
```typescript
// ❌ Slow: Sequential (600ms total)
const user = await env.KV.get('user:123');    // 200ms
const prefs = await env.KV.get('prefs:123');  // 200ms
const stats = await env.KV.get('stats:123');  // 200ms

// ✅ Fast: Parallel (200ms total)
const [user, prefs, stats] = await Promise.all([
  env.KV.get('user:123'),
  env.KV.get('prefs:123'),
  env.KV.get('stats:123')
]); // All execute simultaneously
```

**3. Reduce value sizes:**
```typescript
// Store only what you need
await env.KV.put('user', JSON.stringify({
  id: user.id,
  name: user.name
  // Don't store entire user object if only need ID and name
}));
```

---

## Integration Errors

### Error: "CORS error when accessing KV from frontend"

**Root Cause:** Trying to access KV directly from client-side JavaScript

**Solution:** KV is only accessible from Workers, not browsers
```typescript
// ❌ Won't work: Direct KV access from frontend
// fetch('https://api.cloudflare.com/kv/...') // CORS error

// ✅ Correct: Access through Worker API
// Frontend:
const response = await fetch('/api/config');
const config = await response.json();

// Worker:
app.get('/api/config', async (c) => {
  const config = await c.env.KV.get('config', 'json');
  return c.json(config);
});
```

---

### Error: "KV works in wrangler dev but fails in production"

**Common Causes:**
1. Different namespace IDs for preview vs production
2. Missing preview_id in config
3. Environment-specific bindings

**Solution:**
```json
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "production-namespace-id",      // ← Used in production
      "preview_id": "preview-namespace-id"  // ← Used in wrangler dev
    }
  ]
}
```

**Verify:**
```bash
# Test in dev
wrangler dev

# Test in production (after deploy)
wrangler tail
# Then trigger the operation and check logs
```

---

## Debugging Workflow

When encountering KV errors:

**Step 1: Validate Configuration**
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/validate-kv-config.sh
```

**Step 2: Test Connection**
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/test-kv-connection.sh MY_KV
```

**Step 3: Check Error Message**
- Read the error carefully
- Search this troubleshooting guide
- Check Cloudflare status page

**Step 4: Add Logging**
```typescript
try {
  console.log('Attempting KV operation...');
  const value = await env.KV.get('key');
  console.log('Success:', value);
} catch (err) {
  console.error('KV Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  throw err;
}
```

**Step 5: Test in Isolation**
- Create minimal reproduction
- Test single operation
- Eliminate variables

---

## Prevention Best Practices

To avoid common errors:

1. **Always validate configuration** before deploying
2. **Add error handling** to all KV operations
3. **Design for eventual consistency** from the start
4. **Monitor rate limits** in production
5. **Use TypeScript types** for compile-time checking
6. **Test thoroughly** with `/test-kv` command
7. **Add logging** for debugging production issues
8. **Document** namespace purposes and bindings

---

## Getting Help

If this guide doesn't resolve your issue:

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Review Workers Docs**: https://developers.cloudflare.com/kv/
3. **Ask in Discord**: https://discord.gg/cloudflaredev
4. **Use kv-debugger agent** for automated diagnosis
5. **Check Cloudflare Community**: https://community.cloudflare.com/

---

**Last Updated:** 2025-12-27
