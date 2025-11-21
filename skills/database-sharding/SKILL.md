---
name: database-sharding
description: Implements horizontal data partitioning across multiple database servers using range, hash, or directory-based sharding. Use when scaling beyond single-server capacity, optimizing geographic distribution, or implementing multi-tenant isolation.
---

# Database Sharding

Implement horizontal data partitioning for scaling beyond single-server limits.

## Sharding Strategies

| Strategy | Pros | Cons |
|----------|------|------|
| Range-based | Simple, intuitive | Hotspots in ranges |
| Hash-based | Even distribution | Complex rebalancing |
| Directory-based | Flexible | Lookup overhead |

## Hash-Based Sharding

```javascript
class ShardRouter {
  constructor(shardCount) {
    this.shardCount = shardCount;
    this.connections = new Map();
  }

  getShardId(key) {
    const hash = this.hashKey(key);
    return hash % this.shardCount;
  }

  hashKey(key) {
    let hash = 0;
    for (const char of String(key)) {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async query(shardKey, sql, params) {
    const shardId = this.getShardId(shardKey);
    const conn = this.connections.get(shardId);
    return conn.query(sql, params);
  }
}
```

## Range-Based Sharding

```javascript
const shardRanges = [
  { min: 0, max: 999999, shard: 'shard_0' },
  { min: 1000000, max: 1999999, shard: 'shard_1' },
  { min: 2000000, max: Infinity, shard: 'shard_2' }
];

function getShardForUser(userId) {
  return shardRanges.find(r => userId >= r.min && userId <= r.max).shard;
}
```

## Cross-Shard Queries

```javascript
async function aggregateAcrossShards(query) {
  const results = await Promise.all(
    shards.map(shard => shard.query(query))
  );
  return results.flat();
}
```

## Shard Key Selection

**Good shard keys:**
- Frequently used in queries
- Evenly distributed values
- Stable (don't change)
- High cardinality

**Bad shard keys:**
- Timestamps (causes hotspots)
- Sequential IDs (uneven distribution)
- Frequently changing values

## Best Practices

- Always include shard key in queries
- Monitor shard balance regularly
- Plan for rebalancing from day one
- Avoid cross-shard transactions when possible
