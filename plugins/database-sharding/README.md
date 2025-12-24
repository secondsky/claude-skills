# database-sharding

Comprehensive database sharding implementation patterns for horizontal scaling with hash-based, range-based, and directory-based strategies.

## Auto-Trigger Keywords

This skill automatically loads when Claude detects:

**Sharding Concepts**: database sharding, horizontal partitioning, shard key, sharding strategy, distributed database, database scalability, scale horizontally

**Strategies**: hash sharding, range sharding, directory sharding, consistent hashing, virtual shards, hybrid sharding

**Implementation**: shard router, shard routing layer, connection pooling shards, cross-shard queries, scatter-gather pattern, shard migration

**Key Selection**: choosing shard key, shard key selection, high cardinality, even distribution, immutable key, query alignment

**Rebalancing**: rebalance shards, add shards, migrate data, zero-downtime migration, consistent hashing rebalancing

**Multi-Tenancy**: multi-tenant sharding, tenant isolation, tenant per shard, directory-based routing

**Cross-Shard Operations**: cross-shard aggregation, cross-shard joins, cross-shard transactions, two-phase commit, saga pattern

**Common Errors**: shard hotspots, hotspot shards, missing shard key in query, cross-shard transaction error, cannot add shards, sequential ID sharding problem

**Performance**: shard distribution monitoring, shard balance, query distribution, per-shard metrics

## What This Skill Provides

### Production-Ready Router Templates
- **Hash Router**: Even distribution across shards
- **Range Router**: Time-series and sequential data
- **Directory Router**: Multi-tenancy with flexible routing
- **Cross-Shard Aggregator**: COUNT, SUM, AVG, GROUP BY across shards

### Reference Documentation
- **Sharding Strategies**: Detailed comparison of hash, range, directory with production examples (Instagram, Discord, Salesforce)
- **Shard Key Selection**: Decision trees, criteria, testing strategies
- **Implementation Patterns**: Router code, consistent hashing, 2PC, Saga pattern, monitoring
- **Cross-Shard Queries**: Scatter-gather, aggregations, joins, pagination
- **Rebalancing Guide**: Zero-downtime migrations, adding shards, virtual shards
- **Error Catalog**: 10 common sharding errors with detailed fixes

### Error Prevention

Prevents 10 documented sharding issues:
1. Wrong shard key choice causing hotspots
2. Missing shard key in queries (slow scatter-gather)
3. Cross-shard transactions without proper handling
4. Hotspot shards from sequential IDs
5. No rebalancing strategy (stuck with initial shard count)
6. Timestamp-based sharding creating recent hotspots
7. Mutable shard keys causing data migration issues
8. Missing shard routing layer (hardcoded shards)
9. No monitoring for shard balance
10. Incorrect hash function causing uneven distribution

## Usage Examples

### Hash-Based Sharding
```typescript
import { HashRouter } from './hash-router';

const router = new HashRouter([
  { id: 'shard_0', connection: { host: 'db0.example.com' } },
  { id: 'shard_1', connection: { host: 'db1.example.com' } },
  { id: 'shard_2', connection: { host: 'db2.example.com' } },
  { id: 'shard_3', connection: { host: 'db3.example.com' } },
]);

// Query single shard
const user = await router.query('user_123',
  'SELECT * FROM users WHERE id = $1',
  ['user_123']
);

// Query all shards (scatter-gather)
const allActive = await router.queryAll(
  'SELECT * FROM users WHERE status = $1',
  ['active']
);
```

### Range-Based Sharding (Time-Series)
```typescript
import { RangeRouter } from './range-router';

const router = new RangeRouter(shardConfigs, [
  { start: Date.parse('2024-01-01'), end: Date.parse('2024-04-01'), shardId: 'shard_q1_2024' },
  { start: Date.parse('2024-04-01'), end: Date.parse('2024-07-01'), shardId: 'shard_q2_2024' },
  { start: Date.parse('2024-07-01'), end: Infinity, shardId: 'shard_q3_2024' },
]);

// Efficient time-range queries
const q1Events = await router.queryRange(
  Date.parse('2024-01-01'),
  Date.parse('2024-04-01'),
  'SELECT * FROM events WHERE created_at BETWEEN $1 AND $2'
);
```

### Directory-Based Sharding (Multi-Tenancy)
```typescript
import { DirectoryRouter } from './directory-router';

const router = new DirectoryRouter(directoryDBConfig, shardConfigs);

// Assign tenant to shard
await router.assignShard('tenant_acme', 'shard_enterprise');

// All tenant queries route automatically
const users = await router.query('tenant_acme', 'SELECT * FROM users');
```

## Production Benefits

- ✅ **Horizontal Scalability**: Scale beyond single-server limits
- ✅ **Geographic Distribution**: Data closer to users
- ✅ **Tenant Isolation**: Complete separation in multi-tenant apps
- ✅ **Even Load**: No single server overwhelmed
- ✅ **Flexible Rebalancing**: Add shards without downtime
- ✅ **Production-Tested**: Examples from Instagram, Discord, Salesforce

## When to Use

- **Scaling Limits**: Database > 500GB or 10M+ records
- **Multi-Tenancy**: Need tenant isolation with dedicated resources
- **Geographic Distribution**: Users worldwide, need low latency
- **High Traffic**: Single DB CPU > 80% sustained
- **Rapid Growth**: Data growing > 100GB/month

## Installation

```bash
# Clone the repository
git clone https://github.com/secondsky/claude-skills.git

# Symlink to Claude's skills directory
ln -s "$(pwd)/claude-skills/skills/database-sharding" ~/.claude/skills/

# Verify installation
ls -la ~/.claude/skills/database-sharding
```

## Quality Standards

- **Production-tested**: All strategies verified in production systems
- **Error prevention**: 10 documented issues prevented
- **Cross-database**: PostgreSQL, MySQL compatible
- **Zero-downtime**: Migration strategies maintain availability
- **Monitoring included**: Metrics and alerting patterns

## License

MIT License - See LICENSE file for details

## Resources

**Production Examples**:
- Instagram: Range sharding for media storage
- Discord: Hash sharding for message distribution
- Salesforce: Directory sharding for organization isolation

**Official Documentation**:
- PostgreSQL Partitioning: https://www.postgresql.org/docs/current/ddl-partitioning.html
- MySQL Sharding: https://dev.mysql.com/doc/refman/8.0/en/partitioning.html

**Research**:
- Consistent Hashing (Karger et al.)
- Distributed Systems patterns
- CAP Theorem implications

---

**Production-ready** | **10 errors prevented** | **PostgreSQL & MySQL**
