# Database Sharding Strategies

**Last Updated**: 2025-12-15

Comprehensive guide to the three main sharding strategies: Range-based, Hash-based, and Directory-based, with production examples and trade-offs.

---

## Overview

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| **Range** | Time-series, sequential data | Range queries efficient, easy archival | Hotspots on recent data |
| **Hash** | Even distribution critical | No hotspots, predictable | Range queries scatter, hard to rebalance |
| **Directory** | Complex routing needs | Flexible, easy rebalancing | Single point of failure, overhead |

---

## Strategy 1: Range-Based Sharding

**Concept**: Divide data into continuous ranges based on shard key value.

### How It Works

```typescript
function getRangeShard(key: number, ranges: Range[]): string {
  for (const range of ranges) {
    if (key >= range.start && key < range.end) {
      return range.shardId;
    }
  }
  throw new Error(`No shard found for key: ${key}`);
}

// Configuration
const ranges = [
  { start: 0, end: 1000000, shardId: 'shard_0' },
  { start: 1000000, end: 2000000, shardId: 'shard_1' },
  { start: 2000000, end: 3000000, shardId: 'shard_2' },
  { start: 3000000, end: Infinity, shardId: 'shard_3' }
];

// Usage
const shard = getRangeShard(1500000, ranges); // → 'shard_1'
```

### Advantages

1. **Efficient Range Queries**:
```sql
-- Get all orders from January 2024
SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
-- Targets single shard (month-based ranges)
```

2. **Easy Archival**:
```typescript
// Archive old shards
if (shardDate < Date.now() - 365 * 24 * 60 * 60 * 1000) {
  await archiveShardToColdStorage('shard_2023_q1');
  await dropShard('shard_2023_q1');
}
```

3. **Simple to Understand**:
- Intuitive mapping: 2024 data → 2024 shard
- Easy debugging: Know which shard has which data

### Disadvantages

1. **Hotspots on Active Range**:
```typescript
// All new writes go to latest shard!
const shard = getRangeShard(Date.now(), timeRanges); // Always newest shard
```

2. **Uneven Distribution**:
```
Shard 0 (2020): 10K rows  (idle)
Shard 1 (2021): 50K rows  (idle)
Shard 2 (2022): 100K rows (idle)
Shard 3 (2023): 500K rows (idle)
Shard 4 (2024): 2M rows   (overwhelmed!)
```

3. **Hard to Rebalance**:
- Splitting range requires data migration
- Cannot easily redistribute load

### Best Use Cases

✅ **Time-Series Data**:
```typescript
// Sensor readings, logs, events
const shard = getShardByMonth(event.timestamp);
```

✅ **Append-Only Logs**:
```typescript
// Audit logs, analytics events
// Old shards never written again
```

✅ **Data with Lifecycle**:
```typescript
// Archive/delete old data periodically
// Example: GDPR retention (7 years)
```

### Production Example: Instagram

Instagram uses range sharding for media (photos/videos):

```typescript
// Shard by creation time
const mediaId = generateId();
// ID encodes timestamp + shard
// 41 bits: timestamp since epoch
// 13 bits: shard ID
// 10 bits: sequence number

function getShardFromId(mediaId: bigint): number {
  return Number((mediaId >> 10) & 0x1FFF); // Extract shard ID bits
}
```

**Benefits**:
- Efficient "recent photos" queries
- Archive old media to cheaper storage
- ID itself contains routing information

---

## Strategy 2: Hash-Based Sharding

**Concept**: Apply hash function to shard key, mod by shard count.

### How It Works

```typescript
import { createHash } from 'crypto';

function getHashShard(key: string, shardCount: number): number {
  const hash = createHash('md5').update(key).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return num % shardCount;
}

// Usage
const shard = getHashShard('user_12345', 8); // → 3 (deterministic)
const shard = getHashShard('user_67890', 8); // → 1
```

### Advantages

1. **Even Distribution**:
```typescript
// Test with 1M keys
const distribution = testDistribution(1000000, 8);
// [125032, 124876, 125234, 124987, 125123, 124765, 125098, 124885]
// Each shard gets ~1M / 8 = 125K ± 1%
```

2. **No Hotspots**:
- Every shard receives equal write load
- Predictable capacity planning

3. **Simple Implementation**:
- Single hash function
- No complex routing logic

### Disadvantages

1. **Range Queries Scatter**:
```typescript
// Get all users created in January
// Must query ALL shards! (users distributed by hash)
const results = await Promise.all(
  shards.map(shard =>
    shard.query('SELECT * FROM users WHERE created_at BETWEEN ? AND ?', [start, end])
  )
);
return results.flat(); // Combine from all shards
```

2. **Hard to Rebalance**:
```typescript
// Adding 9th shard changes ALL hashes!
// Before (8 shards): hash(key) % 8 = 3
// After (9 shards):  hash(key) % 9 = 7 (different shard!)
// Requires rehashing entire dataset
```

3. **No Data Locality**:
- Related records may be on different shards
- Example: User and their orders on different shards

### Best Use Cases

✅ **User Data**:
```typescript
// Shard by user_id
const shard = getHashShard(userId, shardCount);
// All user's data on one shard
```

✅ **High-Cardinality Keys**:
```typescript
// UUIDs, email addresses, session IDs
const shard = getHashShard(sessionId, shardCount);
```

✅ **Even Load Critical**:
```typescript
// Cache layers, session stores
// Must distribute evenly for performance
```

### Production Example: Discord

Discord uses hash-based sharding for messages:

```typescript
// Shard by (channel_id + message_id)
function getMessageShard(channelId: string, messageId: string): number {
  const key = `${channelId}:${messageId}`;
  return consistentHash(key) % SHARD_COUNT;
}
```

**Benefits**:
- No celebrity channel hotspots
- Even distribution across all shards
- Predictable growth patterns

**Challenge**:
- "Get all messages in channel" must query all shards
- **Solution**: Secondary index by channel on each shard

---

## Strategy 3: Directory-Based Sharding

**Concept**: Lookup table maps shard keys to shard IDs.

### How It Works

```typescript
class DirectoryRouter {
  private directory = new Map<string, string>();

  constructor() {
    // Load directory from database
    this.loadDirectory();
  }

  async loadDirectory() {
    const mappings = await db.query('SELECT shard_key, shard_id FROM shard_directory');
    for (const { shard_key, shard_id } of mappings) {
      this.directory.set(shard_key, shard_id);
    }
  }

  getShard(key: string): string {
    return this.directory.get(key) || 'shard_default';
  }

  async moveShard(key: string, newShardId: string) {
    // Update directory
    this.directory.set(key, newShardId);
    await db.query('UPDATE shard_directory SET shard_id = ? WHERE shard_key = ?', [newShardId, key]);
  }
}
```

### Advantages

1. **Flexible Routing**:
```typescript
// Can assign based on ANY logic
directory.set('premium_user_123', 'shard_premium_1');
directory.set('free_user_456', 'shard_free_1');
directory.set('enterprise_client_789', 'shard_dedicated_789');
```

2. **Easy Rebalancing**:
```typescript
// Move tenant from shard_1 to shard_5
await router.moveShard('tenant_acme', 'shard_5');
// Just update directory, no application changes
```

3. **Custom Policies**:
```typescript
// VIP customers on dedicated shards
// High-traffic tenants on separate infrastructure
// Geographic routing
```

### Disadvantages

1. **Directory Lookup Overhead**:
```typescript
// Every query requires directory lookup
const startLookup = Date.now();
const shard = await directory.getShard(key); // +5ms
const startQuery = Date.now();
const result = await shard.query(...); // +10ms
// Total: 15ms (vs 10ms with hash)
```

2. **Single Point of Failure**:
```
Directory DB Down → ALL queries fail!
```
**Mitigation**: Cache directory in app memory, replicate directory

3. **Directory Size**:
```typescript
// 1 billion users × 100 bytes per entry = 100GB directory!
// Must cache aggressively
```

### Best Use Cases

✅ **Multi-Tenancy**:
```typescript
// Each tenant on specific shard
directory.set('tenant_acme', 'shard_5');
directory.set('tenant_widgets', 'shard_12');
```

✅ **Complex Routing Logic**:
```typescript
// Route based on multiple factors
if (user.isPremium) return 'shard_premium';
if (user.region === 'EU') return 'shard_eu';
return 'shard_default';
```

✅ **Frequent Rebalancing**:
```typescript
// Can move tenants between shards easily
// No application code changes
```

### Production Example: Salesforce

Salesforce uses directory-based sharding (called "Org Routing"):

```typescript
// Directory maps organization ID → pod (shard)
const pod = directory.getOrgPod('org_12345'); // → 'na45'
const connection = connectionPool.get(pod);
const result = await connection.query(sql, params);
```

**Benefits**:
- Each org on dedicated pod
- Can move orgs during maintenance windows
- Isolate noisy neighbors

**Directory Management**:
- Replicated directory across regions
- Cached in app servers (refreshed every 60s)
- Fallback to direct DB lookup on cache miss

---

## Hybrid Strategies

Real-world systems often combine strategies:

### Hybrid 1: Hash + Range

```typescript
// Hash by entity_id, range by time within shard
const shard = hash(userId) % SHARD_COUNT; // Even distribution
const partition = getQuarter(timestamp); // Q1_2024, Q2_2024
const table = `shard_${shard}.events_${partition}`;
```

**Benefits**:
- Hash ensures even distribution
- Range partitioning enables efficient time queries
- Easy archival of old partitions

**Example Use**: User activity logs, analytics events

### Hybrid 2: Directory + Hash

```typescript
// Directory for tenants, hash for users within tenant
const shard = directory.getTenantShard(tenantId); // Tenant → shard
const partition = hash(userId) % PARTITIONS_PER_SHARD; // User → partition
const table = `${shard}.users_${partition}`;
```

**Benefits**:
- Tenant isolation (directory)
- Even user distribution within tenant (hash)
- Can move entire tenants easily

**Example Use**: SaaS platforms with large tenants

### Hybrid 3: Hash + Consistent Hashing

```typescript
// Simple hash for routing, consistent hashing for rebalancing
class SmartRouter {
  private consistentRing = new ConsistentHashRing(shards);

  getShard(key: string): string {
    if (this.isRebalancing) {
      // During rebalance, use consistent hashing
      return this.consistentRing.getNode(key);
    } else {
      // Normal operation, use simple hash
      return this.shards[hash(key) % this.shards.length];
    }
  }
}
```

**Benefits**:
- Fast during normal operation
- Minimal data movement during rebalancing

---

## Choosing a Strategy

### Decision Matrix

| Requirement | Best Strategy | Why |
|-------------|---------------|-----|
| Even load distribution | Hash | No hotspots, predictable |
| Time-range queries common | Range | Single shard for time range |
| Frequent rebalancing | Directory or Consistent Hash | Flexible routing |
| Multi-tenancy | Directory | Tenant isolation |
| Simple implementation | Hash | Stateless, no directory |
| Data lifecycle (archival) | Range | Easy to archive old shards |
| Geographic routing | Directory | Custom routing logic |
| Cannot tolerate hotspots | Hash | Guaranteed even distribution |

### Questions to Ask

1. **Query Patterns**:
   - Mostly single-entity lookups? → Hash
   - Frequent range queries? → Range
   - Complex routing needs? → Directory

2. **Growth**:
   - Predictable growth? → Hash or Range
   - Unpredictable spikes? → Directory (rebalance easily)

3. **Data Lifecycle**:
   - Append-only with archival? → Range
   - Active dataset grows forever? → Hash

4. **Isolation Needs**:
   - Tenant isolation critical? → Directory
   - Just need scalability? → Hash

---

## Migration Between Strategies

Sometimes you need to switch strategies:

### Range → Hash (Fix Hotspots)

```typescript
// Phase 1: Dual-write to both range and hash shards
async function write(record) {
  const rangeShard = getRangeShard(record.id);
  const hashShard = getHashShard(record.id);
  await Promise.all([
    rangeShard.insert(record),
    hashShard.insert(record)
  ]);
}

// Phase 2: Backfill hash shards from range shards
await backfillHashShardsFromRange();

// Phase 3: Switch reads to hash shards
function read(id) {
  const hashShard = getHashShard(id);
  return hashShard.query('SELECT * FROM users WHERE id = ?', [id]);
}

// Phase 4: Stop writing to range shards, cleanup
```

### Hash → Directory (Add Flexibility)

```typescript
// Phase 1: Create directory from current hash mappings
for (const key of allKeys) {
  const shard = hash(key) % shardCount;
  await directory.set(key, `shard_${shard}`);
}

// Phase 2: Switch application to use directory
const shard = directory.get(key);

// Phase 3: Now can rebalance using directory
await directory.moveShard(key, newShardId);
```

---

## Summary

**Use Hash** when:
- Even distribution critical
- Single-entity queries dominate
- Low maintenance preferred

**Use Range** when:
- Time-series or sequential data
- Range queries common
- Data has lifecycle (archival)

**Use Directory** when:
- Multi-tenancy with isolation
- Complex routing needs
- Frequent rebalancing expected

**Use Hybrid** when:
- Multiple requirements (common!)
- Example: Hash + Range for logs
- Example: Directory + Hash for SaaS

---

**Next Steps**:
- **Load** `shard-key-selection.md` for choosing the right shard key
- **Load** `implementation-patterns.md` for code examples
- **Load** `rebalancing-guide.md` for migration strategies
