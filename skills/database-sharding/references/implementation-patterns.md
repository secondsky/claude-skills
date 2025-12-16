# Sharding Implementation Patterns

**Last Updated**: 2025-12-15

Production-ready code patterns for implementing database sharding routers, connection pools, and query execution.

---

## Basic Shard Router

```typescript
import { createHash } from 'crypto';
import { Pool } from 'pg';

export class ShardRouter {
  private shards: Map<string, Pool> = new Map();

  constructor(shardConfigs: ShardConfig[]) {
    for (const config of shardConfigs) {
      this.shards.set(config.id, new Pool(config.connection));
    }
  }

  // Get shard ID from key using MD5 hash
  getShardId(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    const num = parseInt(hash.substring(0, 8), 16);
    const shardIndex = num % this.shards.size;
    return Array.from(this.shards.keys())[shardIndex];
  }

  // Get database connection for shard
  getShard(shardId: string): Pool {
    const shard = this.shards.get(shardId);
    if (!shard) throw new Error(`Shard not found: ${shardId}`);
    return shard;
  }

  // Execute query on specific shard
  async query(shardKey: string, sql: string, params: any[] = []) {
    const shardId = this.getShardId(shardKey);
    const shard = this.getShard(shardId);
    return await shard.query(sql, params);
  }

  // Execute query on all shards (scatter-gather)
  async queryAll(sql: string, params: any[] = []) {
    const results = await Promise.all(
      Array.from(this.shards.values()).map(shard =>
        shard.query(sql, params)
      )
    );
    return results.flatMap(r => r.rows);
  }

  // Close all connections
  async close() {
    await Promise.all(
      Array.from(this.shards.values()).map(shard => shard.end())
    );
  }
}

// Usage
const router = new ShardRouter([
  { id: 'shard_0', connection: { host: 'db0.example.com', database: 'myapp' } },
  { id: 'shard_1', connection: { host: 'db1.example.com', database: 'myapp' } },
  { id: 'shard_2', connection: { host: 'db2.example.com', database: 'myapp' } },
  { id: 'shard_3', connection: { host: 'db3.example.com', database: 'myapp' } },
]);

// Query single shard
const user = await router.query('user_123', 'SELECT * FROM users WHERE id = $1', ['user_123']);

// Query all shards
const allUsers = await router.queryAll('SELECT * FROM users WHERE status = $1', ['active']);
```

---

## Consistent Hashing Router

```typescript
import * as crypto from 'crypto';

export class ConsistentHashRing {
  private ring = new Map<number, string>();
  private virtualNodes = 150; // Virtual nodes per physical node
  private sortedHashes: number[] = [];

  constructor(nodes: string[]) {
    // Add virtual nodes to ring
    for (const node of nodes) {
      for (let i = 0; i < this.virtualNodes; i++) {
        const hash = this.hash(`${node}:${i}`);
        this.ring.set(hash, node);
      }
    }
    // Sort hash values for binary search
    this.sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  private hash(key: string): number {
    return parseInt(
      crypto.createHash('md5').update(key).digest('hex').substring(0, 8),
      16
    );
  }

  // Find node responsible for key
  getNode(key: string): string {
    if (this.ring.size === 0) throw new Error('No nodes in ring');

    const hash = this.hash(key);

    // Binary search for first node >= hash
    let left = 0;
    let right = this.sortedHashes.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedHashes[mid] === hash) {
        return this.ring.get(this.sortedHashes[mid])!;
      } else if (this.sortedHashes[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // Wrap around to first node if no node >= hash
    const nodeHash = left >= this.sortedHashes.length
      ? this.sortedHashes[0]
      : this.sortedHashes[left];

    return this.ring.get(nodeHash)!;
  }

  // Add new node (minimal keys rehash)
  addNode(node: string) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${node}:${i}`);
      this.ring.set(hash, node);
    }
    this.sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  // Remove node (only affected keys rehash)
  removeNode(node: string) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${node}:${i}`);
      this.ring.delete(hash);
    }
    this.sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }
}

// Usage
const ring = new ConsistentHashRing(['shard_0', 'shard_1', 'shard_2', 'shard_3']);

console.log(ring.getNode('user_123')); // 'shard_2'
console.log(ring.getNode('user_456')); // 'shard_1'

// Add new shard - only ~25% of keys move
ring.addNode('shard_4');
console.log(ring.getNode('user_123')); // Still 'shard_2' (likely)
```

---

## Directory-Based Router

```typescript
export class DirectoryRouter {
  private directory = new Map<string, string>();
  private directoryDB: Pool;
  private cacheRefreshInterval = 60000; // 60 seconds

  constructor(directoryDBConfig: any, shardConfigs: ShardConfig[]) {
    this.directoryDB = new Pool(directoryDBConfig);
    this.shards = new Map(shardConfigs.map(c => [c.id, new Pool(c.connection)]));

    // Load directory and refresh periodically
    this.refreshDirectory();
    setInterval(() => this.refreshDirectory(), this.cacheRefreshInterval);
  }

  async refreshDirectory() {
    const result = await this.directoryDB.query(
      'SELECT shard_key, shard_id FROM shard_directory'
    );
    this.directory.clear();
    for (const row of result.rows) {
      this.directory.set(row.shard_key, row.shard_id);
    }
  }

  getShardId(key: string): string {
    // Check cache first
    let shardId = this.directory.get(key);

    if (!shardId) {
      // Fallback to database (cache miss)
      shardId = 'shard_default';
      // Optionally: Query directory DB synchronously (not recommended)
    }

    return shardId;
  }

  async assignShard(key: string, shardId: string) {
    // Update directory
    await this.directoryDB.query(
      'INSERT INTO shard_directory (shard_key, shard_id) VALUES ($1, $2) ON CONFLICT (shard_key) DO UPDATE SET shard_id = $2',
      [key, shardId]
    );
    // Update cache
    this.directory.set(key, shardId);
  }

  async moveShard(key: string, newShardId: string) {
    const oldShardId = this.getShardId(key);

    // 1. Copy data to new shard
    const oldShard = this.getShard(oldShardId);
    const newShard = this.getShard(newShardId);

    const data = await oldShard.query('SELECT * FROM users WHERE id = $1', [key]);
    await newShard.query('INSERT INTO users VALUES ($1, $2, ...)', [...data.rows[0]]);

    // 2. Update directory
    await this.assignShard(key, newShardId);

    // 3. Delete from old shard
    await oldShard.query('DELETE FROM users WHERE id = $1', [key]);
  }
}
```

---

## Transaction Handling

### Two-Phase Commit (2PC)

```typescript
export class TwoPhaseCommitTransaction {
  private participants: Array<{ shard: Pool; operations: Operation[] }> = [];

  addOperation(shard: Pool, sql: string, params: any[]) {
    let participant = this.participants.find(p => p.shard === shard);
    if (!participant) {
      participant = { shard, operations: [] };
      this.participants.push(participant);
    }
    participant.operations.push({ sql, params });
  }

  async execute() {
    const clients = [];

    try {
      // Phase 1: PREPARE all participants
      for (const participant of this.participants) {
        const client = await participant.shard.connect();
        clients.push(client);

        await client.query('BEGIN');
        for (const op of participant.operations) {
          await client.query(op.sql, op.params);
        }
        await client.query('PREPARE TRANSACTION $1', [this.getTxnId()]);
      }

      // Phase 2: COMMIT all participants
      for (const client of clients) {
        await client.query('COMMIT PREPARED $1', [this.getTxnId()]);
        client.release();
      }

      return { success: true };
    } catch (error) {
      // Rollback all participants
      for (const client of clients) {
        try {
          await client.query('ROLLBACK PREPARED $1', [this.getTxnId()]);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
        client.release();
      }

      throw error;
    }
  }

  private getTxnId(): string {
    return `txn_${Date.now()}_${Math.random()}`;
  }
}

// Usage
const txn = new TwoPhaseCommitTransaction();
txn.addOperation(shard0, 'UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 'user_A']);
txn.addOperation(shard1, 'UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 'user_B']);
await txn.execute();
```

### Saga Pattern (Eventual Consistency)

```typescript
export class Saga {
  private steps: SagaStep[] = [];

  addStep(forward: () => Promise<void>, compensate: () => Promise<void>) {
    this.steps.push({ forward, compensate });
  }

  async execute() {
    const completedSteps = [];

    try {
      // Execute all forward steps
      for (const step of this.steps) {
        await step.forward();
        completedSteps.push(step);
      }

      return { success: true };
    } catch (error) {
      // Execute compensation in reverse order
      for (const step of completedSteps.reverse()) {
        try {
          await step.compensate();
        } catch (compensateError) {
          console.error('Compensation failed:', compensateError);
        }
      }

      throw error;
    }
  }
}

// Usage: Transfer money between users on different shards
const saga = new Saga();

saga.addStep(
  // Forward: Deduct from user A
  async () => {
    await shard0.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 'user_A']);
  },
  // Compensate: Refund to user A
  async () => {
    await shard0.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 'user_A']);
  }
);

saga.addStep(
  // Forward: Add to user B
  async () => {
    await shard1.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 'user_B']);
  },
  // Compensate: Deduct from user B
  async () => {
    await shard1.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 'user_B']);
  }
);

await saga.execute();
```

---

## Monitoring & Metrics

```typescript
export class MonitoredShardRouter extends ShardRouter {
  private metrics = {
    queriesByAnd: new Map<string, number>(),
    latencyByShard: new Map<string, number[]>(),
    errorsByShard: new Map<string, number>(),
  };

  async query(shardKey: string, sql: string, params: any[] = []) {
    const shardId = this.getShardId(shardKey);

    // Track queries per shard
    this.metrics.queriesByShard.set(
      shardId,
      (this.metrics.queriesByShard.get(shardId) || 0) + 1
    );

    // Track latency
    const start = Date.now();
    try {
      const result = await super.query(shardKey, sql, params);
      const latency = Date.now() - start;

      if (!this.metrics.latencyByShard.has(shardId)) {
        this.metrics.latencyByShard.set(shardId, []);
      }
      this.metrics.latencyByShard.get(shardId)!.push(latency);

      return result;
    } catch (error) {
      // Track errors
      this.metrics.errorsByShard.set(
        shardId,
        (this.metrics.errorsByShard.get(shardId) || 0) + 1
      );
      throw error;
    }
  }

  getMetrics() {
    const totalQueries = Array.from(this.metrics.queriesByShard.values())
      .reduce((sum, count) => sum + count, 0);

    return {
      queriesPerShard: Object.fromEntries(this.metrics.queriesByShard),
      queryDistribution: Object.fromEntries(
        Array.from(this.metrics.queriesByShard.entries()).map(([shard, count]) => [
          shard,
          ((count / totalQueries) * 100).toFixed(2) + '%'
        ])
      ),
      avgLatencyPerShard: Object.fromEntries(
        Array.from(this.metrics.latencyByShard.entries()).map(([shard, latencies]) => [
          shard,
          (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) + 'ms'
        ])
      ),
      errorsPerShard: Object.fromEntries(this.metrics.errorsByShard),
    };
  }
}

// Usage
const router = new MonitoredShardRouter(shardConfigs);

// ... execute queries ...

// Get metrics
console.log(router.getMetrics());
// {
//   queriesPerShard: { shard_0: 1250, shard_1: 1198, shard_2: 1305, shard_3: 1247 },
//   queryDistribution: { shard_0: '25.00%', shard_1: '23.96%', shard_2: '26.10%', shard_3: '24.94%' },
//   avgLatencyPerShard: { shard_0: '12.34ms', shard_1: '11.98ms', shard_2: '13.12ms', shard_3: '12.56ms' },
//   errorsPerShard: { shard_0: 0, shard_1: 0, shard_2: 1, shard_3: 0 }
// }
```

---

## Summary

See `templates/` directory for standalone router implementations:
- `hash-router.ts` - Basic hash-based router
- `range-router.ts` - Range-based router
- `directory-router.ts` - Directory-based router
- `cross-shard-aggregation.ts` - Aggregation patterns

**Next**: Load `cross-shard-queries.md` for query patterns across shards
