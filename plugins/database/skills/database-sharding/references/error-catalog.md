# Database Sharding - Error Catalog

**Last Updated**: 2025-12-15

Comprehensive catalog of 10 common database sharding errors with symptoms, causes, and production-tested fixes.

---

## Error 1: Wrong Shard Key Choice (Hotspots)

**Symptom**: One shard receives 80%+ of traffic while others idle

**Root Cause**: Chose shard key with uneven distribution (e.g., `status` field where 90% of records are 'active')

**Example**:
```typescript
// ❌ Bad: Status as shard key
const shardId = hashFunction(order.status); // Most orders are 'pending'
// Result: 90% of traffic goes to shard-0

// ✅ Good: User ID as shard key
const shardId = hashFunction(order.userId);
// Result: Even distribution across shards
```

**Fix Strategy**:
1. **Analyze cardinality**: Shard key must have high cardinality (many unique values)
2. **Check distribution**: Test with production data histogram
3. **Avoid low-cardinality fields**: status, country, category, type
4. **Prefer high-cardinality**: user_id, order_id, email, UUID

**Production Validation**:
```sql
-- Check shard key distribution
SELECT
  shard_key_column,
  COUNT(*) as record_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM your_table
GROUP BY shard_key_column
ORDER BY record_count DESC;

-- Ideal: No single value > 5% of total
```

**Real-World Example**:
- **Discord** switched from channel_id to message_id sharding to avoid celebrity channels creating hotspots
- Result: 10x more even distribution

---

## Error 2: Missing Shard Key in Queries

**Symptom**: Queries scan ALL shards (scatter-gather), extremely slow

**Root Cause**: Query doesn't include shard key in WHERE clause

**Example**:
```typescript
// ❌ Bad: No shard key in query
const orders = await db.query(`
  SELECT * FROM orders
  WHERE status = 'shipped' -- Must scan all shards!
`);

// ✅ Good: Include shard key
const orders = await db.query(`
  SELECT * FROM orders
  WHERE user_id = ? AND status = 'shipped' -- Targets single shard
`, [userId]);
```

**Fix Strategy**:
1. **Always include shard key**: Required in WHERE clause
2. **Router optimization**: Shard key lets router target single shard
3. **Query rewrite**: Add shard key even if redundant
4. **Application-level filtering**: If must scan all shards, filter in app

**Impact**:
- With shard key: Query 1 shard → 5ms
- Without shard key: Query 100 shards → 500ms (100x slower)

**Monitoring Query**:
```sql
-- Find queries without shard key (PostgreSQL)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%user_id%' -- Replace with your shard key
  AND query LIKE 'SELECT%'
ORDER BY mean_exec_time DESC;
```

---

## Error 3: Cross-Shard Transactions Without Handling

**Symptom**: Data inconsistency, partial writes, transaction failures

**Root Cause**: Trying to use single-database transactions across multiple shards

**Example**:
```typescript
// ❌ Bad: Cross-shard transaction (will fail or corrupt)
BEGIN;
  UPDATE shard_1.accounts SET balance = balance - 100 WHERE user_id = 'A';
  UPDATE shard_2.accounts SET balance = balance + 100 WHERE user_id = 'B';
COMMIT; -- If shard_2 fails, shard_1 already committed!

// ✅ Good: Two-Phase Commit (2PC)
const transaction = new TwoPhaseCommit();
try {
  await transaction.prepare([
    { shard: 'shard_1', query: 'UPDATE accounts SET balance = balance - 100 WHERE user_id = ?', params: ['A'] },
    { shard: 'shard_2', query: 'UPDATE accounts SET balance = balance + 100 WHERE user_id = ?', params: ['B'] }
  ]);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}
```

**Fix Strategies**:

1. **Avoid cross-shard transactions** (preferred):
   - Design shard key to keep related data together
   - Example: Shard by `account_id`, not `transaction_id`

2. **Use Two-Phase Commit (2PC)**:
   - Phase 1: Prepare all shards
   - Phase 2: Commit all or rollback all
   - Slower but atomic

3. **Saga Pattern** (eventual consistency):
   - Break into steps with compensating transactions
   - Each step commits independently
   - Rollback via compensation if later step fails

4. **Application-level transactions**:
   - Transaction log in separate coordination DB
   - Retry failed shards
   - Accept eventual consistency

**When to Use Each**:
- **Avoid**: Financial transfers, inventory management
- **2PC**: Rare cross-shard updates, can tolerate latency
- **Saga**: Order processing, multi-step workflows
- **App-level**: Analytics, logging, non-critical updates

---

## Error 4: Hotspot Shards from Sequential IDs

**Symptom**: Latest shard receives all writes, others idle

**Root Cause**: Using auto-incrementing IDs with range-based sharding

**Example**:
```typescript
// ❌ Bad: Range sharding with sequential IDs
// Shard 0: IDs 1-1M, Shard 1: IDs 1M-2M, Shard 2: IDs 2M+
// All new records go to Shard 2!

if (id <= 1000000) return 'shard_0';
else if (id <= 2000000) return 'shard_1';
else return 'shard_2'; // Gets 100% of writes!

// ✅ Good: Hash-based sharding
const shardId = consistentHash(id) % shardCount;
// Evenly distributes writes across all shards
```

**Fix Strategy**:
1. **Use hash-based sharding** for sequential IDs
2. **Switch to UUIDs** (naturally random)
3. **Add timestamp-based re-hashing** for range sharding
4. **Monitor write distribution** per shard

**Production Example**:
```typescript
// Instagram's approach: Combine timestamp + shard ID in ID itself
// ID = 41-bit timestamp + 13-bit shard ID + 10-bit sequence
function generateId(shardId: number): bigint {
  const timestamp = Date.now() - EPOCH;
  const sequence = getNextSequence();
  return (timestamp << 23) | (shardId << 10) | sequence;
}
```

---

## Error 5: No Rebalancing Strategy

**Symptom**: Cannot add new shards without downtime, stuck with initial shard count

**Root Cause**: No plan for data migration when adding shards

**Example**:
```typescript
// ❌ Bad: Simple modulo (breaks when shard count changes)
const shardId = hash(key) % shardCount; // 4 shards
// Add 5th shard: ALL keys rehash to different shards!

// ✅ Good: Consistent hashing (minimal rehashing)
const ring = new ConsistentHashRing(shardCount);
const shardId = ring.getNode(key); // Only ~25% of keys rehash when adding shard
```

**Fix Strategies**:

1. **Consistent Hashing**:
   - Virtual nodes on hash ring
   - Adding shard only affects neighboring keys
   - Example: Only 1/N keys move when adding Nth shard

2. **Directory-Based Sharding**:
   - Mapping table: key_range → shard_id
   - Update mapping to rebalance
   - Can move ranges between shards

3. **Virtual Shards**:
   - Over-provision virtual shards (e.g., 1024 virtual → 4 physical)
   - Move virtual shards between physical shards
   - No application changes needed

**Rebalancing Process**:
```typescript
// Example: Moving users 1000-1999 from shard_1 to shard_5
1. Create shard_5
2. Dual-write: writes go to both shard_1 and shard_5
3. Backfill: copy existing data shard_1 → shard_5
4. Verify: checksums match
5. Cutover: reads from shard_5, stop writing to shard_1
6. Cleanup: delete data from shard_1
```

**Downtime-Free Migration**:
- Use read replicas during backfill
- Application drains traffic gradually
- Verify at each step before proceeding

---

## Error 6: Timestamp-Based Sharding (Hotspots)

**Symptom**: Most recent shard overwhelmed, old shards idle

**Root Cause**: Sharding by created_at or other timestamp

**Example**:
```typescript
// ❌ Bad: Shard by month
const month = new Date(record.created_at).getMonth();
const shardId = `shard_${month}`; // December shard gets 100% of writes!

// ✅ Good: Shard by user_id, partition by month
const shardId = hash(record.user_id) % shardCount;
const partition = `partition_${month}`; // Within-shard partitioning
```

**When Time-Based Sharding Works**:
- **Append-only logs**: Old shards never written again
- **Data lifecycle**: Archive old shards to cold storage
- **Time-series data**: Queries almost always within time range

**Hybrid Approach**:
```typescript
// Hash by entity_id, partition by time
const shard = hash(entity_id) % 8; // Even distribution
const partition = getQuarter(timestamp); // Q1_2024, Q2_2024, etc.
const table = `shard_${shard}.events_${partition}`;
```

**Benefits**:
- Even write distribution (hash-based)
- Efficient time-range queries (partitioning)
- Easy archival (drop old partitions)

---

## Error 7: No Shard Key Immutability

**Symptom**: Record changes shard, causing duplicates or loss

**Root Cause**: Shard key value changes (e.g., user changes country)

**Example**:
```typescript
// ❌ Bad: Shard by country (user relocates)
const shardId = getShardForCountry(user.country); // 'US'
// User moves to Canada
user.country = 'CA'; // Now in different shard!
// Old record in US shard, new record in CA shard → duplicate

// ✅ Good: Shard by immutable user_id
const shardId = hash(user.id) % shardCount; // Never changes
```

**Fix Strategy**:
1. **Choose immutable shard keys**: user_id, account_id, order_id, UUID
2. **Avoid mutable fields**: country, status, category, tenant_id
3. **Migration if needed**: Explicit data move between shards
4. **Composite keys**: Include immutable portion

**Migration Process for Mutable Keys**:
```typescript
// If must use mutable key, handle migration
async function updateShardKey(userId: string, newCountry: string) {
  const oldShard = getShardForCountry(user.country);
  const newShard = getShardForCountry(newCountry);

  if (oldShard !== newShard) {
    // 1. Copy to new shard
    await newShard.insert(userData);
    // 2. Delete from old shard
    await oldShard.delete(userId);
    // 3. Update routing table
    await routingTable.update(userId, newShard);
  }
}
```

---

## Error 8: Missing Shard Routing Layer

**Symptom**: Application hardcoded to specific shards, cannot rebalance

**Root Cause**: No abstraction layer between app and shards

**Example**:
```typescript
// ❌ Bad: Direct shard access in app code
const db = connectToDatabase('shard_2'); // Hardcoded!
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ Good: Routing layer
const shardRouter = new ShardRouter(shardConfig);
const user = await shardRouter.query('users', userId, 'SELECT * FROM users WHERE id = ?', [userId]);
// Router determines shard transparently
```

**Router Responsibilities**:
1. **Shard selection**: Determine target shard from key
2. **Connection pooling**: Manage connections to all shards
3. **Query routing**: Send query to correct shard(s)
4. **Result aggregation**: Combine results from multiple shards
5. **Failover**: Retry on failure, use replicas

**Implementation Example**:
```typescript
class ShardRouter {
  constructor(private shards: Database[]) {}

  getShard(key: string): Database {
    const shardId = consistentHash(key) % this.shards.length;
    return this.shards[shardId];
  }

  async query(table: string, shardKey: string, sql: string, params: any[]) {
    const shard = this.getShard(shardKey);
    return await shard.query(sql, params);
  }

  async queryAll(sql: string, params: any[]) {
    const results = await Promise.all(
      this.shards.map(shard => shard.query(sql, params))
    );
    return results.flat();
  }
}
```

---

## Error 9: No Monitoring for Shard Balance

**Symptom**: Silently developing hotspots, sudden performance degradation

**Root Cause**: No metrics on per-shard load

**Example Issues**:
- Shard 3 has 10x more rows than others
- Shard 1 receives 60% of queries
- Shard 4 disk at 95% while others at 20%

**Required Metrics**:

1. **Per-Shard Record Counts**:
```sql
SELECT COUNT(*) FROM shard_0.users;
SELECT COUNT(*) FROM shard_1.users;
-- Ideal: Within 10% of each other
```

2. **Query Distribution**:
```typescript
// Log which shard each query targets
logger.info('query_routed', {
  shard_id: shardId,
  query_type: 'SELECT',
  table: 'users'
});

// Alert if any shard > 150% of average
```

3. **Storage per Shard**:
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname LIKE 'shard_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

4. **Latency per Shard**:
```typescript
const start = Date.now();
const result = await shard.query(sql, params);
const latency = Date.now() - start;
metrics.histogram('shard.query.latency', latency, { shard_id: shardId });
```

**Alerting Thresholds**:
- Row count variance > 20%: Investigate
- Query distribution > 40% to one shard: Rebalance
- Disk usage > 80%: Add capacity
- Latency p99 > 2x average: Check load

---

## Error 10: Incorrect Hash Function

**Symptom**: Uneven distribution, same inputs hashing to same shard

**Root Cause**: Poor hash function (e.g., simple modulo of numeric ID)

**Example**:
```typescript
// ❌ Bad: Weak hash (sequential IDs cluster)
const shardId = parseInt(userId) % shardCount;
// IDs 1-100 → shard 0, 101-200 → shard 1, etc.
// If user IDs sequential, uneven!

// ✅ Good: Strong hash function
import { createHash } from 'crypto';
function getShardId(key: string, shardCount: number): number {
  const hash = createHash('md5').update(key).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return num % shardCount;
}
```

**Hash Function Requirements**:
1. **Uniform distribution**: All shards equally likely
2. **Deterministic**: Same input always same output
3. **Fast**: Sub-microsecond performance
4. **Avalanche effect**: Small input change → big hash change

**Recommended Hash Functions**:
- **MurmurHash3**: Fast, excellent distribution
- **xxHash**: Extremely fast, cryptographically weak (ok for sharding)
- **MD5/SHA**: Cryptographic, slower, uniform distribution
- **CRC32**: Fast but poor distribution

**Testing Distribution**:
```typescript
// Test hash function with 1M keys
const distribution = new Array(shardCount).fill(0);
for (let i = 0; i < 1000000; i++) {
  const key = `user_${i}`;
  const shardId = getShardId(key, shardCount);
  distribution[shardId]++;
}

// Check: Each shard should have ~1M / shardCount ± 5%
console.log(distribution);
// Good: [249872, 250234, 249654, 250240]
// Bad:  [450123, 123456, 398765, 27656]
```

**Consistent Hashing Note**:
For rebalancing support, use consistent hashing instead of simple modulo:
```typescript
class ConsistentHashRing {
  private ring = new Map<number, string>();
  private virtualNodes = 150; // Per physical node

  constructor(nodes: string[]) {
    for (const node of nodes) {
      for (let i = 0; i < this.virtualNodes; i++) {
        const hash = getHash(`${node}:${i}`);
        this.ring.set(hash, node);
      }
    }
  }

  getNode(key: string): string {
    const hash = getHash(key);
    // Find first node >= hash on ring
    const sorted = Array.from(this.ring.keys()).sort((a, b) => a - b);
    for (const nodeHash of sorted) {
      if (nodeHash >= hash) return this.ring.get(nodeHash)!;
    }
    return this.ring.get(sorted[0])!; // Wrap around
  }
}
```

---

## Summary

| Error | Impact | Fix Complexity | Prevention |
|-------|--------|----------------|------------|
| Wrong shard key | High (hotspots) | High (re-shard) | Analyze cardinality upfront |
| Missing shard key in queries | High (slow) | Low (add WHERE) | Code review, linting |
| Cross-shard transactions | Critical (data loss) | Medium (2PC/Saga) | Design for single-shard txns |
| Sequential ID hotspots | High (uneven load) | Medium (switch to hash) | Use hash-based sharding |
| No rebalancing strategy | High (stuck) | High (migration) | Plan for growth upfront |
| Timestamp sharding | Medium (recent hotspot) | Medium (re-shard) | Use hybrid approach |
| Mutable shard key | Critical (duplicates) | High (migration) | Choose immutable keys |
| No routing layer | Medium (inflexible) | Medium (refactor) | Abstract from day 1 |
| No monitoring | High (silent failure) | Low (add metrics) | Monitor from day 1 |
| Weak hash function | Medium (uneven) | Low (swap hash) | Test distribution early |

**Load** this catalog when troubleshooting sharding issues or reviewing shard architecture.
