# Shard Key Selection Guide

**Last Updated**: 2025-12-15

Comprehensive guide to choosing the optimal shard key for your database, with criteria, examples, and decision trees.

---

## The Most Important Decision

**The shard key is the MOST important decision in database sharding.**

Once chosen and data populated:
- ❌ Extremely difficult to change (requires full re-sharding)
- ❌ Cannot easily add to existing queries
- ❌ Affects every query forever

**Spend time upfront to choose correctly!**

---

## Shard Key Criteria

### 1. High Cardinality (Critical)

**Definition**: Many unique values in the shard key column.

**Why**: Low cardinality = uneven distribution = hotspots

```typescript
// ❌ Bad: Low cardinality
shard_key = user.country; // ~200 unique values
// Result: US shard gets 40% of data, Luxembourg shard gets 0.001%

// ✅ Good: High cardinality
shard_key = user.id; // Millions of unique values
// Result: Even distribution
```

**Minimum Cardinality Rule**:
- Cardinality should be >> shard count × 100
- Example: 8 shards → minimum 800 unique values
- Ideal: Millions+ unique values

**Check Cardinality**:
```sql
SELECT COUNT(DISTINCT shard_key_column) as cardinality,
       COUNT(*) as total_rows,
       COUNT(DISTINCT shard_key_column)::float / COUNT(*) as uniqueness_ratio
FROM your_table;

-- Ideal: uniqueness_ratio close to 1.0 (all values unique)
-- Warning: uniqueness_ratio < 0.01 (low cardinality)
```

---

### 2. Even Distribution (Critical)

**Definition**: All shard key values occur with similar frequency.

**Why**: Skewed distribution = hotspot shards

```typescript
// ❌ Bad: Skewed distribution
shard_key = order.status;
// Distribution: pending=80%, shipped=15%, delivered=5%
// Result: "pending" shard overloaded

// ✅ Good: Even distribution
shard_key = order.id;
// Distribution: All IDs equally likely
```

**Test Distribution**:
```sql
-- Check value frequency
SELECT
  shard_key_column,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM your_table
GROUP BY shard_key_column
ORDER BY count DESC
LIMIT 20;

-- Red flag: Any value > 5% of total
-- Ideal: All values < 1% of total
```

**Visual Test**:
```typescript
// Simulate sharding with production data
const distribution = new Array(SHARD_COUNT).fill(0);
for (const row of productionData) {
  const shardId = hash(row.proposed_shard_key) % SHARD_COUNT;
  distribution[shardId]++;
}

console.log(distribution);
// Good: [125423, 124876, 125234, 124987, 125123, 124765, 125098, 124885]
// Bad:  [450123, 12345, 398765, 2765, 89234, 12098, 23456, 11214]
```

---

### 3. Immutability (Critical)

**Definition**: Shard key value never changes after record creation.

**Why**: Changing shard key = record moves to different shard = complexity/bugs

```typescript
// ❌ Bad: Mutable shard key
shard_key = user.country; // User relocates
shard_key = user.subscription_tier; // User upgrades
shard_key = product.category; // Product recategorized

// ✅ Good: Immutable shard key
shard_key = user.id; // Never changes
shard_key = order.id; // Never changes
shard_key = created_at; // Never changes (append-only)
```

**If You Must Use Mutable Key**:
```typescript
// Implement migration logic
async function updateShardKey(recordId, oldValue, newValue) {
  const oldShard = getShard(oldValue);
  const newShard = getShard(newValue);

  if (oldShard !== newShard) {
    await beginTransaction();
    try {
      // 1. Copy to new shard
      const record = await oldShard.select(recordId);
      await newShard.insert(record);

      // 2. Delete from old shard
      await oldShard.delete(recordId);

      // 3. Update routing table
      await routingTable.update(recordId, newShard);

      await commitTransaction();
    } catch (error) {
      await rollbackTransaction();
      throw error;
    }
  }
}
```

---

### 4. Query Pattern Alignment (High Priority)

**Definition**: Most queries include the shard key in WHERE clause.

**Why**: Query without shard key = query ALL shards (slow)

```typescript
// ❌ Bad: Queries don't include shard key
shard_key = user.id;
// But most queries are: SELECT * FROM orders WHERE product_id = ?
// Must query all shards!

// ✅ Good: Queries naturally include shard key
shard_key = user.id;
// Most queries: SELECT * FROM orders WHERE user_id = ?
// Single shard query!
```

**Query Pattern Analysis**:
```sql
-- Analyze your query logs (PostgreSQL)
SELECT
  query,
  calls,
  mean_exec_time,
  CASE
    WHEN query LIKE '%user_id%' THEN 'Includes shard key'
    ELSE 'Missing shard key'
  END as shard_key_status
FROM pg_stat_statements
WHERE query LIKE 'SELECT%'
ORDER BY calls DESC
LIMIT 50;

-- Goal: >80% of queries include shard key
```

**Decision Matrix**:

| Query Pattern | Best Shard Key |
|---------------|----------------|
| "Get user's orders" | `user_id` |
| "Get order details" | `order_id` |
| "Get product's reviews" | `product_id` |
| "Get recent events" | `timestamp` (range) |
| "Get tenant's data" | `tenant_id` |

---

### 5. Data Locality (Medium Priority)

**Definition**: Related records on same shard.

**Why**: Joins within shard = fast, cross-shard joins = slow/impossible

```typescript
// ❌ Bad: Related data on different shards
shard_key = order.id; // Orders sharded separately
// Problem: User's orders scattered across shards
// Query "all orders for user" = query all shards

// ✅ Good: Related data together
shard_key = user.id; // All user's data on one shard
// User, their orders, their payments all on same shard
// Query "user details + orders" = single shard
```

**Denormalization for Locality**:
```typescript
// Duplicate shard key for related data
orders table:
  id UUID PRIMARY KEY,
  user_id UUID, // Shard key
  ...

payments table:
  id UUID PRIMARY KEY,
  user_id UUID, // Same shard key! (even though foreign key is order_id)
  order_id UUID,
  ...

// Now user's orders and payments on same shard
```

---

## Common Shard Key Patterns

### Pattern 1: User-Scoped Application

**Use Case**: SaaS, social networks, e-commerce

**Shard Key**: `user_id` or `account_id`

**Tables**:
```sql
users:
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  ... -- shard by id

orders:
  id UUID PRIMARY KEY,
  user_id UUID, -- shard by user_id
  ...

cart_items:
  id UUID PRIMARY KEY,
  user_id UUID, -- shard by user_id (even though belongs to cart)
  ...

sessions:
  id UUID PRIMARY KEY,
  user_id UUID, -- shard by user_id
  ...
```

**Benefits**:
- All user data on one shard
- "Get user dashboard" = single shard query
- User isolation (good for tenancy)

**Challenges**:
- Queries by order_id must include user_id
- "Top products" query must scan all shards

---

### Pattern 2: Multi-Tenant Application

**Use Case**: B2B SaaS (Salesforce, Slack, Zendesk)

**Shard Key**: `tenant_id` or `organization_id`

**Tables**:
```sql
organizations:
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  ... -- shard by id

users:
  id UUID PRIMARY KEY,
  org_id UUID, -- shard by org_id
  ...

projects:
  id UUID PRIMARY KEY,
  org_id UUID, -- shard by org_id
  ...

tasks:
  id UUID PRIMARY KEY,
  org_id UUID, -- shard by org_id (even though belongs to project)
  ...
```

**Benefits**:
- Complete tenant isolation
- "Get all org data" = single shard
- Can dedicate shards to large tenants

**Challenges**:
- Large tenants may outgrow single shard
- Cross-tenant queries impossible (usually not needed)

---

### Pattern 3: Time-Series Data

**Use Case**: Logs, metrics, events, IoT data

**Shard Key**: `created_at` or `timestamp` (range-based)

**Tables**:
```sql
events:
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ, -- shard by created_at
  user_id UUID,
  event_type VARCHAR(50),
  payload JSONB,
  ...
```

**Sharding Strategy**:
```typescript
// Range-based sharding by month
function getShard(timestamp: Date): string {
  const month = timestamp.toISOString().substring(0, 7); // "2024-12"
  return `shard_${month}`;
}
```

**Benefits**:
- Efficient time-range queries
- Archive old shards easily
- Append-only (no updates/deletes)

**Challenges**:
- Recent shard gets all writes (hotspot)
- Need many shards to spread load
- Queries by user_id scan all shards

---

### Pattern 4: Entity-Specific

**Use Case**: Platform with multiple entity types

**Shard Key**: Entity ID (order_id, product_id, session_id)

**Decision**:
- **Query pattern**: "Get order X" → `order_id`
- **Query pattern**: "Get user's orders" → `user_id`

**Mixed Approach**:
```typescript
// Orders table: shard by order_id (for "get order" queries)
orders:
  id UUID PRIMARY KEY, -- shard key
  user_id UUID,
  ...

// Order denormalized view: shard by user_id (for "user's orders" queries)
user_orders:
  user_id UUID, -- shard key
  order_id UUID,
  status VARCHAR(20),
  created_at TIMESTAMPTZ,
  ... -- denormalized fields
```

---

## Decision Tree

```
START: What type of application?

├─ Multi-tenant B2B SaaS
│  └─ Shard by tenant_id
│     ├─ Pro: Complete tenant isolation
│     └─ Con: Large tenants may outgrow shard

├─ User-focused (social, e-commerce)
│  └─ Shard by user_id
│     ├─ Pro: All user data together
│     └─ Con: User-scoped queries only

├─ Time-series / logs / events
│  └─ Shard by timestamp (range)
│     ├─ Pro: Efficient time queries, archival
│     └─ Con: Recent shard hotspot

├─ Product catalog / content platform
│  └─ Shard by product_id or content_id
│     ├─ Pro: Product data together
│     └─ Con: Cross-product queries scatter

└─ Mixed workload
   └─ Analyze query logs!
      ├─ 80% queries by user_id? → Shard by user_id
      ├─ 80% queries by tenant_id? → Shard by tenant_id
      └─ Queries varied? → Consider directory-based sharding
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Auto-Increment ID

**Problem**: Sequential IDs create hotspots with range sharding

```typescript
// Bad with range sharding
shard_key = auto_increment_id;
// Shard 0: 1-1M, Shard 1: 1M-2M, Shard 2: 2M+
// All new writes → Shard 2!
```

**Fix**: Use hash-based sharding or UUIDs

---

### ❌ Anti-Pattern 2: Nullable Shard Key

**Problem**: NULL values need special handling

```typescript
// Bad: Shard key can be NULL
shard_key = user.organization_id; // NULL for individual users

// Where do NULLs go?
function getShard(key) {
  if (key === null) return 'shard_default'; // Hotspot!
  return hash(key) % shardCount;
}
```

**Fix**: Ensure shard key is NOT NULL

---

### ❌ Anti-Pattern 3: Compound Shard Key

**Problem**: Complex to maintain, hard to query

```typescript
// Bad: Shard by (tenant_id, user_id)
shard_key = `${tenant_id}:${user_id}`;

// Every query must include BOTH
SELECT * FROM orders WHERE tenant_id = ? AND user_id = ?; // Ok
SELECT * FROM orders WHERE user_id = ?; // Scans all shards!
```

**Fix**: Choose single most important field

---

## Testing Your Shard Key Choice

### Test 1: Distribution Test

```typescript
// Sample 100K production records
const sample = await getProductionSample(100000);
const distribution = new Array(SHARD_COUNT).fill(0);

for (const record of sample) {
  const shardId = hash(record.proposed_shard_key) % SHARD_COUNT;
  distribution[shardId]++;
}

const avg = sample.length / SHARD_COUNT;
const maxDeviation = Math.max(...distribution.map(count => Math.abs(count - avg) / avg));

console.log('Distribution:', distribution);
console.log('Max deviation from average:', (maxDeviation * 100).toFixed(2) + '%');

// Pass: <20% deviation
// Fail: >50% deviation
```

### Test 2: Query Pattern Test

```sql
-- Analyze query logs
SELECT
  query_pattern,
  COUNT(*) as frequency,
  AVG(execution_time_ms) as avg_time,
  CASE
    WHEN query_pattern LIKE '%proposed_shard_key%' THEN 'Single shard'
    ELSE 'All shards'
  END as query_scope
FROM query_logs
GROUP BY query_pattern
ORDER BY frequency DESC;

-- Goal: >80% of queries are "Single shard"
```

### Test 3: Hotspot Test

```typescript
// Check for celebrity/whale users
const keyCounts = await db.query(`
  SELECT proposed_shard_key, COUNT(*) as record_count
  FROM your_table
  GROUP BY proposed_shard_key
  ORDER BY record_count DESC
  LIMIT 100
`);

const totalRecords = keyCounts.reduce((sum, row) => sum + row.record_count, 0);
const top1Percent = keyCounts[0].record_count / totalRecords;

console.log('Top key owns', (top1Percent * 100).toFixed(2), '% of data');

// Pass: <5%
// Warning: 5-10%
// Fail: >10%
```

---

## Migration Strategy

If you choose wrong shard key initially:

### Option 1: Re-shard (Painful)

```typescript
// 1. Create new shards with new shard key
// 2. Dual-write to old and new shards
// 3. Backfill new shards from old shards
// 4. Switch reads to new shards
// 5. Drop old shards

// Downtime: ~hours to days
// Complexity: High
// When: Must be done
```

### Option 2: Add Secondary Index

```typescript
// Keep old shard key, add secondary index on new key
// Both shards and secondary index

// Queries by new key:
const records = await secondaryIndex.lookup(newKey); // Gets record IDs
const results = await Promise.all(
  records.map(id => getFromShard(id))
);

// Complexity: Medium
// Performance: Slower
// When: Cannot afford downtime
```

### Option 3: Hybrid Approach

```typescript
// New data: use new shard key
// Old data: stays in old sharding scheme

function getShard(record) {
  if (record.created_at < MIGRATION_DATE) {
    return getOldShard(record.old_shard_key);
  } else {
    return getNewShard(record.new_shard_key);
  }
}

// Complexity: Medium
// When: Append-only data
```

---

## Summary Checklist

Before finalizing shard key choice:

- [ ] **High cardinality** (millions of unique values)
- [ ] **Even distribution** (tested with production data)
- [ ] **Immutable** (never changes after creation)
- [ ] **Query alignment** (>80% of queries include it)
- [ ] **Data locality** (related data together)
- [ ] **NOT NULL** (no special NULL handling)
- [ ] **Simple** (single column, not compound)
- [ ] **Tested** (distribution, query patterns, hotspots)

---

**Next Steps**:
- **Load** `sharding-strategies.md` for choosing sharding strategy
- **Load** `implementation-patterns.md` for code examples
- **Load** `error-catalog.md` for common mistakes
