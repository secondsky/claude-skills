// Range-Based Shard Router Template
// Best for time-series data, sequential IDs

import { Pool, PoolConfig } from 'pg';

export interface RangeConfig {
  start: number;
  end: number;
  shardId: string;
}

export interface ShardConfig {
  id: string;
  connection: PoolConfig;
}

export class RangeRouter {
  private shards: Map<string, Pool> = new Map();
  private ranges: RangeConfig[];

  constructor(shardConfigs: ShardConfig[], ranges: RangeConfig[]) {
    for (const config of shardConfigs) {
      this.shards.set(config.id, new Pool(config.connection));
    }
    this.ranges = ranges.sort((a, b) => a.start - b.start);
  }

  // Get shard ID from numeric key
  getShardId(key: number): string {
    for (const range of this.ranges) {
      if (key >= range.start && key < range.end) {
        return range.shardId;
      }
    }
    throw new Error(`No shard found for key: ${key}`);
  }

  // Get shard ID from timestamp
  getShardIdFromDate(date: Date): string {
    const timestamp = date.getTime();
    return this.getShardId(timestamp);
  }

  // Get database connection for shard
  getShard(shardId: string): Pool {
    const shard = this.shards.get(shardId);
    if (!shard) throw new Error(`Shard not found: ${shardId}`);
    return shard;
  }

  // Execute query on specific shard
  async query(shardKey: number, sql: string, params: any[] = []) {
    const shardId = this.getShardId(shardKey);
    const shard = this.getShard(shardId);
    return await shard.query(sql, params);
  }

  // Execute query on shards in range
  async queryRange(startKey: number, endKey: number, sql: string, params: any[] = []) {
    const affectedShards = new Set<string>();

    for (const range of this.ranges) {
      if (range.start < endKey && range.end > startKey) {
        affectedShards.add(range.shardId);
      }
    }

    const results = await Promise.all(
      Array.from(affectedShards).map(shardId =>
        this.getShard(shardId).query(sql, params)
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
const router = new RangeRouter(
  [
    { id: 'shard_2022', connection: { host: 'db2022.example.com', database: 'logs' } },
    { id: 'shard_2023', connection: { host: 'db2023.example.com', database: 'logs' } },
    { id: 'shard_2024', connection: { host: 'db2024.example.com', database: 'logs' } },
  ],
  [
    { start: Date.parse('2022-01-01'), end: Date.parse('2023-01-01'), shardId: 'shard_2022' },
    { start: Date.parse('2023-01-01'), end: Date.parse('2024-01-01'), shardId: 'shard_2023' },
    { start: Date.parse('2024-01-01'), end: Infinity, shardId: 'shard_2024' },
  ]
);

// Query specific month (single shard)
const janEvents = await router.queryRange(
  Date.parse('2024-01-01'),
  Date.parse('2024-02-01'),
  'SELECT * FROM events WHERE created_at >= $1 AND created_at < $2',
  [new Date('2024-01-01'), new Date('2024-02-01')]
);

await router.close();
