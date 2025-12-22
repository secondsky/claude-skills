// Hash-Based Shard Router Template
// Copy and modify for your application

import { createHash } from 'crypto';
import { Pool, PoolConfig } from 'pg';

export interface ShardConfig {
  id: string;
  connection: PoolConfig;
}

export class HashRouter {
  private shards: Map<string, Pool> = new Map();

  constructor(shardConfigs: ShardConfig[]) {
    for (const config of shardConfigs) {
      this.shards.set(config.id, new Pool(config.connection));
    }
  }

  // Hash function: MD5 for distribution
  private hash(key: string): number {
    const hash = createHash('md5').update(key).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  // Get shard ID from key
  getShardId(key: string): string {
    const hashValue = this.hash(key);
    const shardIndex = hashValue % this.shards.size;
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

// Usage Example
const router = new HashRouter([
  { id: 'shard_0', connection: { host: 'db0.example.com', database: 'myapp', user: 'app', password: 'secret' } },
  { id: 'shard_1', connection: { host: 'db1.example.com', database: 'myapp', user: 'app', password: 'secret' } },
  { id: 'shard_2', connection: { host: 'db2.example.com', database: 'myapp', user: 'app', password: 'secret' } },
  { id: 'shard_3', connection: { host: 'db3.example.com', database: 'myapp', user: 'app', password: 'secret' } },
]);

// Query single user (targets one shard)
const user = await router.query('user_123', 'SELECT * FROM users WHERE id = $1', ['user_123']);

// Query all shards
const allActive = await router.queryAll('SELECT * FROM users WHERE status = $1', ['active']);

await router.close();
