// Directory-Based Shard Router Template
// Best for multi-tenancy, complex routing

import { Pool, PoolConfig } from 'pg';

export interface ShardConfig {
  id: string;
  connection: PoolConfig;
}

export class DirectoryRouter {
  private shards: Map<string, Pool> = new Map();
  private directory = new Map<string, string>();
  private directoryDB: Pool;
  private refreshIntervalId?: NodeJS.Timeout;

  constructor(directoryDBConfig: PoolConfig, shardConfigs: ShardConfig[]) {
    this.directoryDB = new Pool(directoryDBConfig);

    for (const config of shardConfigs) {
      this.shards.set(config.id, new Pool(config.connection));
    }

    // Load directory and refresh every 60 seconds
    // Note: Call await router.refreshDirectory() after construction for initial load
    this.refreshIntervalId = setInterval(() => this.refreshDirectory(), 60000);
  }

  /**
   * Initialize the router by loading the directory.
   * Must be called after construction before using the router.
   */
  async initialize(): Promise<void> {
    await this.refreshDirectory();
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
    const shardId = this.directory.get(key);
    if (!shardId) {
      // Fallback to default shard for unknown keys
      return 'shard_default';
    }
    return shardId;
  }

  getShard(shardId: string): Pool {
    const shard = this.shards.get(shardId);
    if (!shard) throw new Error(`Shard not found: ${shardId}`);
    return shard;
  }

  async query(shardKey: string, sql: string, params: any[] = []) {
    const shardId = this.getShardId(shardKey);
    const shard = this.getShard(shardId);
    return await shard.query(sql, params);
  }

  // Assign key to shard
  async assignShard(key: string, shardId: string) {
    await this.directoryDB.query(
      'INSERT INTO shard_directory (shard_key, shard_id) VALUES ($1, $2) ON CONFLICT (shard_key) DO UPDATE SET shard_id = $2',
      [key, shardId]
    );
    this.directory.set(key, shardId);
  }

  // Move key to different shard with transaction safety
  async moveShard(key: string, newShardId: string) {
    const oldShardId = this.getShardId(key);
    if (oldShardId === newShardId) return; // No-op if same shard

    const oldShard = this.getShard(oldShardId);
    const newShard = this.getShard(newShardId);

    // Transaction: Copy → Update Directory → Delete
    const oldClient = await oldShard.connect();
    const newClient = await newShard.connect();

    try {
      await oldClient.query('BEGIN');
      await newClient.query('BEGIN');

      // 1. Read from old shard
      const data = await oldClient.query('SELECT * FROM users WHERE id = $1', [key]);
      if (data.rows.length === 0) {
        throw new Error(`User ${key} not found in shard ${oldShardId}`);
      }

      const row = data.rows[0];
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      // 2. Insert into new shard
      await newClient.query(
        `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      // 3. Update directory
      await this.assignShard(key, newShardId);

      // 4. Delete from old shard
      await oldClient.query('DELETE FROM users WHERE id = $1', [key]);

      await oldClient.query('COMMIT');
      await newClient.query('COMMIT');
    } catch (error) {
      await oldClient.query('ROLLBACK');
      await newClient.query('ROLLBACK');
      throw error;
    } finally {
      oldClient.release();
      newClient.release();
    }
  }

  async close() {
    // Clear refresh interval
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }

    // Close database connections
    await Promise.all([
      this.directoryDB.end(),
      ...Array.from(this.shards.values()).map(shard => shard.end())
    ]);
  }
}

// Usage Example
const router = new DirectoryRouter(
  { host: 'directory.example.com', database: 'routing' },
  [
    { id: 'shard_premium', connection: { host: 'premium.example.com', database: 'app' } },
    { id: 'shard_free', connection: { host: 'free.example.com', database: 'app' } },
    { id: 'shard_enterprise', connection: { host: 'enterprise.example.com', database: 'app' } },
  ]
);

// Initialize directory before use
await router.initialize();

// Assign tenant to shard
await router.assignShard('tenant_acme', 'shard_enterprise');

// Query tenant (routed to correct shard)
const users = await router.query('tenant_acme', 'SELECT * FROM users WHERE tenant_id = $1', ['tenant_acme']);

// Move tenant to different shard
await router.moveShard('tenant_acme', 'shard_premium');

await router.close();
