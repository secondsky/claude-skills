# D1 Read Replication Reference

**Status**: Public Beta (Production-Ready as of April 2025)
**Official Documentation**: https://developers.cloudflare.com/d1/best-practices/read-replication/

---

## Overview

D1 read replication creates asynchronously replicated read-only database copies across Cloudflare's global network. This feature reduces latency for read queries and scales read throughput by distributing read operations to database replicas located closer to users.

**Production Ready**: As of April 2025, read replication has moved to Public Beta status with production-grade reliability. Cloudflare recommends using it for production workloads with appropriate session management.

### Architecture

- **Primary Instance**: Single database that handles all write operations and can also serve read queries
- **Read Replicas**: Multiple read-only copies distributed globally that serve read queries only
- **Replication**: Asynchronous, meaning replicas may lag slightly behind the primary
- **Pricing**: Included with D1 at no additional cost

### Benefits

✅ **Reduced Latency**: Users get faster responses from nearby replicas instead of traveling to the primary instance
✅ **Increased Throughput**: Up to 2x read throughput with replicas distributed globally (Public Beta performance)
✅ **Sequential Consistency**: Sessions API guarantees logically consistent reads across different replicas
✅ **Zero Additional Cost**: Free feature included with D1
✅ **Automatic Distribution**: Replicas automatically created in 6 global regions
✅ **Production Ready**: Public Beta status (April 2025) with production-grade reliability

### Performance Metrics (Public Beta)

Based on Cloudflare's April 2025 benchmarks:

**Latency Improvements**:
- **Without replication**: P50 ~50ms (all queries to primary)
- **With replication**: P50 ~15-25ms (queries to nearest replica)
- **Improvement**: Up to 50-70% latency reduction for global users

**Throughput Gains**:
- **Read throughput**: Up to 2x increase with 6 global replicas
- **Write throughput**: No change (all writes to primary)
- **Best performance**: Read-heavy workloads (80%+ reads)

**Replica Lag**:
- **Typical**: < 1 second for 99% of queries
- **Worst case**: < 5 seconds during high write load
- **Consistency**: Guaranteed with Sessions API bookmarks

### Consistency Guarantees (Public Beta)

The Sessions API provides **sequential consistency** through bookmarks:

**Guarantee**: Once a client reads a value, subsequent reads will never see older values.

**How It Works**:
1. Each query execution returns a bookmark (opaque token)
2. Bookmark represents database state at query time
3. Subsequent queries with bookmark see at least that state
4. Ensures monotonic reads (no going backwards in time)

**Example**:
```typescript
// Write to database (bookmark: v100)
const session1 = env.DB.withSession();
await session1.prepare('INSERT INTO posts VALUES (?)').bind('New Post').run();
const bookmark1 = session1.getBookmark(); // "v100"

// Read with bookmark (sees v100 or later, never v99)
const session2 = env.DB.withSession(bookmark1);
const posts = await session2.prepare('SELECT * FROM posts').all();
// Guaranteed to see "New Post"
```

**Without Sessions API**: No consistency guarantee - may see stale data from lagging replicas.

### Replica Locations

Read replicas are automatically created in all supported regions:

- **ENAM** - Eastern North America
- **WNAM** - Western North America
- **WEUR** - Western Europe
- **EEUR** - Eastern Europe
- **APAC** - Asia-Pacific
- **OC** - Oceania

---

## Enabling Read Replication

### Method 1: Cloudflare Dashboard

1. Navigate to **Workers & Pages** > **D1** in Cloudflare dashboard
2. Select your database
3. Go to **Settings**
4. Enable **Read Replication**

### Method 2: REST API

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "read_replication": {
      "mode": "auto"
    }
  }'
```

**Requirements**:
- API token with `D1:Edit` permission
- Replace `{account_id}` with your Cloudflare account ID
- Replace `{database_id}` with your D1 database ID

**Response**:
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "name": "my-database",
    "read_replication": {
      "mode": "auto"
    }
  }
}
```

---

## Sessions API

The Sessions API ensures sequential consistency across queries by using "bookmarks" to track database state. This prevents reading stale data from replicas that haven't caught up with recent writes.

### Pattern 1: Unconstrained Session (Route to Any Instance)

**Use when**: Your application doesn't require the absolute latest data and can tolerate slight replication lag.

```typescript
import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.get('/api/products', async (c) => {
  // Create session without constraints - routes to nearest replica
  const session = c.env.DB.withSession();

  const { results } = await session
    .prepare('SELECT * FROM products WHERE category = ? LIMIT 20')
    .bind('electronics')
    .all();

  return c.json({ products: results });
});
```

**Best for**:
- Product catalogs
- Blog posts
- Public content
- Read-heavy applications where freshness isn't critical

### Pattern 2: Primary-First Session (Latest Data)

**Use when**: You need the most current database version for critical operations.

```typescript
app.get('/api/user/profile', async (c) => {
  const userId = c.req.param('userId');

  // Route to primary instance for latest data
  const session = c.env.DB.withSession('first-primary');

  const user = await session
    .prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});
```

**Best for**:
- User profile updates
- Account settings
- Financial transactions
- Any operation requiring strong consistency

### Pattern 3: Bookmark-Based Session (Consistency Across Requests)

**Use when**: You need to maintain consistency across multiple requests in a user session or workflow.

```typescript
app.post('/api/checkout', async (c) => {
  // Get bookmark from previous request (if any)
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';

  // Create session with bookmark to ensure consistency
  const session = c.env.DB.withSession(bookmark);

  // Process checkout
  const { results } = await session
    .prepare('SELECT * FROM cart WHERE user_id = ?')
    .bind(c.get('userId'))
    .all();

  // Get new bookmark to pass to next request
  const newBookmark = session.getBookmark() ?? '';

  // Return bookmark in response header
  return c.json(
    { cart: results },
    200,
    { 'x-d1-bookmark': newBookmark }
  );
});
```

**Client-side Implementation**:

```typescript
// Frontend code maintaining bookmark across requests
let bookmark: string | null = null;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  // Include bookmark if available
  if (bookmark) {
    headers.set('x-d1-bookmark', bookmark);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  // Update bookmark from response
  bookmark = response.headers.get('x-d1-bookmark');

  return response.json();
}

// Multi-step flow example
await apiCall('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId: 123 }) });
await apiCall('/api/cart/view');          // Will see the added item
await apiCall('/api/checkout/process');   // Consistent cart state
```

**Best for**:
- Multi-step checkout flows
- Form wizards
- Shopping carts
- Any workflow where sequential operations depend on previous state

---

## Monitoring Query Execution

Track which database instance served your query using metadata fields:

```typescript
app.get('/api/users/:id', async (c) => {
  const userId = c.req.param('id');
  const session = c.env.DB.withSession();

  const result = await session
    .prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .run();

  // Log execution metadata
  console.log({
    userId,
    servedByRegion: result.meta.served_by_region ?? 'unknown',
    servedByPrimary: result.meta.served_by_primary ?? false,
    rowsRead: result.meta.rows_read,
    duration: result.meta.duration
  });

  return c.json({ user: result.results[0] });
});
```

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `served_by_region` | string | Region code where query was executed (e.g., 'WNAM', 'EEUR') |
| `served_by_primary` | boolean | `true` if primary instance served the query, `false` if replica |
| `rows_read` | number | Number of rows read from database |
| `rows_written` | number | Number of rows written (always 0 for read queries) |
| `duration` | number | Query execution time in milliseconds |

### Debugging Performance

```typescript
// Track replica usage and performance
const stats = {
  primaryHits: 0,
  replicaHits: 0,
  regionCounts: {} as Record<string, number>
};

app.get('/api/data', async (c) => {
  const session = c.env.DB.withSession();
  const result = await session.prepare('SELECT * FROM data').all();

  // Collect stats
  if (result.meta.served_by_primary) {
    stats.primaryHits++;
  } else {
    stats.replicaHits++;
    const region = result.meta.served_by_region ?? 'unknown';
    stats.regionCounts[region] = (stats.regionCounts[region] || 0) + 1;
  }

  return c.json({ data: result.results });
});

app.get('/api/stats', (c) => {
  return c.json({
    ...stats,
    replicaUsagePercent: (stats.replicaHits / (stats.primaryHits + stats.replicaHits)) * 100
  });
});
```

---

## Real-World Use Cases

### Use Case 1: E-Commerce Product Catalog

**Scenario**: Product listings accessed globally, updates are infrequent

```typescript
// Product listing (unconstrained - can be slightly stale)
app.get('/api/products', async (c) => {
  const session = c.env.DB.withSession();

  const { results } = await session
    .prepare('SELECT * FROM products WHERE in_stock = 1 ORDER BY popularity DESC LIMIT 50')
    .all();

  return c.json({ products: results });
});

// Product details (primary-first for accurate stock count)
app.get('/api/products/:id', async (c) => {
  const session = c.env.DB.withSession('first-primary');

  const product = await session
    .prepare('SELECT * FROM products WHERE product_id = ?')
    .bind(c.req.param('id'))
    .first();

  return c.json({ product });
});
```

### Use Case 2: User Profile with Recent Updates

**Scenario**: User just updated their profile and immediately views it

```typescript
// Profile update (writes to primary)
app.post('/api/profile/update', async (c) => {
  const { username, bio } = await c.req.json();
  const session = c.env.DB.withSession('first-primary');

  await session
    .prepare('UPDATE users SET username = ?, bio = ?, updated_at = ? WHERE user_id = ?')
    .bind(username, bio, Date.now(), c.get('userId'))
    .run();

  // Return bookmark to ensure next read sees the update
  return c.json(
    { success: true },
    200,
    { 'x-d1-bookmark': session.getBookmark() ?? '' }
  );
});

// Profile view (bookmark-based to see latest update)
app.get('/api/profile', async (c) => {
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-primary';
  const session = c.env.DB.withSession(bookmark);

  const user = await session
    .prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(c.get('userId'))
    .first();

  return c.json({ user });
});
```

### Use Case 3: Multi-Step Checkout Flow

**Scenario**: Add to cart → View cart → Apply coupon → Checkout

```typescript
// Step 1: Add to cart
app.post('/api/cart/add', async (c) => {
  const { productId, quantity } = await c.req.json();
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
  const session = c.env.DB.withSession(bookmark);

  await session
    .prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
    .bind(c.get('userId'), productId, quantity)
    .run();

  return c.json(
    { success: true },
    200,
    { 'x-d1-bookmark': session.getBookmark() ?? '' }
  );
});

// Step 2: View cart
app.get('/api/cart', async (c) => {
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
  const session = c.env.DB.withSession(bookmark);

  const { results } = await session
    .prepare('SELECT * FROM cart_items WHERE user_id = ?')
    .bind(c.get('userId'))
    .all();

  return c.json(
    { items: results },
    200,
    { 'x-d1-bookmark': session.getBookmark() ?? '' }
  );
});

// Step 3: Apply coupon
app.post('/api/cart/coupon', async (c) => {
  const { code } = await c.req.json();
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
  const session = c.env.DB.withSession(bookmark);

  // Validate coupon and apply discount
  const coupon = await session
    .prepare('SELECT * FROM coupons WHERE code = ? AND active = 1')
    .bind(code)
    .first();

  if (!coupon) {
    return c.json({ error: 'Invalid coupon' }, 400);
  }

  await session
    .prepare('UPDATE cart SET coupon_code = ? WHERE user_id = ?')
    .bind(code, c.get('userId'))
    .run();

  return c.json(
    { success: true, discount: coupon.discount },
    200,
    { 'x-d1-bookmark': session.getBookmark() ?? '' }
  );
});
```

---

## Replica Lag and Consistency

**What is Replica Lag?**

The time it takes for committed data in the primary to replicate to read replicas. Typically milliseconds to a few seconds.

**Problem Without Sessions API**:

```typescript
// ❌ WITHOUT Sessions API - can read stale data
await env.DB.prepare('INSERT INTO posts (title) VALUES (?)').bind('New Post').run();

// This might NOT see the new post if routed to a lagging replica
const posts = await env.DB.prepare('SELECT * FROM posts').all();
```

**Solution With Sessions API**:

```typescript
// ✅ WITH Sessions API - guaranteed consistency
const session = env.DB.withSession('first-primary');

await session.prepare('INSERT INTO posts (title) VALUES (?)').bind('New Post').run();

// This WILL see the new post because session maintains consistency
const posts = await session.prepare('SELECT * FROM posts').all();
```

---

## Limitations and Considerations

### Current Limitations (Beta)

- ⚠️ **Sessions API availability**: Only via D1 Worker Binding, not REST API yet
- ⚠️ **Disable propagation**: Takes up to 24 hours to fully disable replication
- ⚠️ **Write routing**: All writes always route to primary instance (no write replicas)
- ⚠️ **Eventual consistency**: Without Sessions API, replicas may serve stale data

### Best Practices

✅ **DO**:
- Use Sessions API for all applications requiring consistency
- Implement bookmark passing for multi-step workflows
- Use `withSession('first-primary')` after writes if immediate reads are needed
- Monitor `served_by_region` and `served_by_primary` metrics
- Test with replication enabled in development

❌ **DON'T**:
- Rely on strong consistency without Sessions API
- Assume replicas are always up-to-date
- Use read replication for single-region applications (no benefit)
- Forget to pass bookmarks in multi-step flows
- Enable replication without updating application code

### When to Use Read Replication

**✅ Use When**:
- Application has globally distributed users
- Read latency is a performance bottleneck
- Read queries outnumber writes significantly (read-heavy workload)
- Can integrate Sessions API into application flow
- Use case tolerates eventual consistency with proper session management

**❌ Don't Use When**:
- All users are in a single region
- Application requires strong consistency without Sessions API
- Write-heavy workload (no performance benefit)
- Cannot integrate Sessions API (use primary instance only)

---

## Migration Guide

### Adding Read Replication to Existing Application

**Step 1: Enable Replication** (Dashboard or API)

**Step 2: Update Code to Use Sessions API**

```typescript
// Before (direct DB access)
const users = await env.DB.prepare('SELECT * FROM users').all();

// After (with session)
const session = env.DB.withSession();
const users = await session.prepare('SELECT * FROM users').all();
```

**Step 3: Add Bookmark Support for Multi-Step Flows**

```typescript
// Add middleware to handle bookmarks
app.use('*', async (c, next) => {
  const bookmark = c.req.header('x-d1-bookmark');
  if (bookmark) {
    c.set('d1-bookmark', bookmark);
  }
  await next();
});

// Use bookmark in routes
app.get('/api/data', async (c) => {
  const bookmark = c.get('d1-bookmark') ?? 'first-unconstrained';
  const session = c.env.DB.withSession(bookmark);

  const result = await session.prepare('SELECT * FROM data').all();

  return c.json(
    { data: result.results },
    200,
    { 'x-d1-bookmark': session.getBookmark() ?? '' }
  );
});
```

**Step 4: Test Thoroughly**

```bash
# Test in development with replication enabled
wrangler dev --remote

# Monitor logs for served_by_region and served_by_primary
# Verify bookmarks are being passed correctly
```

**Step 5: Deploy and Monitor**

```typescript
// Add monitoring
app.use('*', async (c, next) => {
  await next();

  // Log replica usage
  const bookmark = c.res.headers.get('x-d1-bookmark');
  console.log({
    path: c.req.path,
    hasBookmark: !!bookmark,
    timestamp: Date.now()
  });
});
```

---

## Troubleshooting

### Issue: Reading Stale Data After Write

**Symptoms**: User updates data but doesn't see changes immediately

**Solution**:
```typescript
// Use first-primary or bookmarks
const session = env.DB.withSession('first-primary');
// OR
const bookmark = request.headers.get('x-d1-bookmark') ?? 'first-primary';
const session = env.DB.withSession(bookmark);
```

### Issue: Bookmark Not Being Passed

**Symptoms**: Inconsistent data across requests in workflow

**Solution**:
```typescript
// Ensure bookmark is extracted AND returned
const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
const session = c.env.DB.withSession(bookmark);

// ... perform queries ...

// IMPORTANT: Return bookmark
return c.json(data, 200, {
  'x-d1-bookmark': session.getBookmark() ?? ''
});
```

### Issue: All Queries Going to Primary

**Symptoms**: `served_by_primary` always `true`, replicas not being used

**Possible Causes**:
1. Read replication not enabled (check dashboard/API)
2. Using `withSession('first-primary')` everywhere (only use when needed)
3. Replication still propagating (can take a few minutes after enabling)

**Solution**:
```typescript
// Use unconstrained for queries that don't need latest data
const session = env.DB.withSession();  // NOT withSession('first-primary')
```

### Issue: High Replica Lag

**Symptoms**: Data taking too long to appear in replicas

**Monitoring**:
```typescript
// Track lag by comparing timestamps
const writeSession = env.DB.withSession('first-primary');
const writeResult = await writeSession
  .prepare('INSERT INTO events (data, created_at) VALUES (?, ?)')
  .bind('test', Date.now())
  .run();

// Wait a bit
await new Promise(resolve => setTimeout(resolve, 1000));

const readSession = env.DB.withSession();
const readResult = await readSession
  .prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 1')
  .first();

console.log({
  lagMs: Date.now() - (readResult?.created_at ?? 0),
  servedByPrimary: readResult.meta.served_by_primary
});
```

**Note**: Normal replica lag is typically < 1 second. If consistently higher, check Cloudflare status page.

---

## Official Resources

- **Read Replication Docs**: https://developers.cloudflare.com/d1/best-practices/read-replication/
- **D1 Client API**: https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/
- **Best Practices**: https://developers.cloudflare.com/d1/best-practices/
- **D1 Dashboard**: https://dash.cloudflare.com/?to=/:account/workers/d1
