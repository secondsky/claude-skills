# Shard Rebalancing Guide

**Last Updated**: 2025-12-15

Step-by-step guide to adding shards, moving data, and rebalancing load without downtime.

---

## When to Rebalance

**Triggers**:
1. **Storage**: Any shard > 80% disk capacity
2. **Load**: Any shard > 150% average query load
3. **Growth**: Data growth rate suggests hitting limit in 3 months
4. **Distribution**: Shard variance > 30% from average

---

## Strategy 1: Add Shard with Consistent Hashing

**Best for**: Hash-based sharding with consistent hashing

### Process

```typescript
// Step 1: Add new shard to consistent hash ring
const ring = new ConsistentHashRing(['shard_0', 'shard_1', 'shard_2']);
ring.addNode('shard_3'); // Only ~25% of keys affected

// Step 2: Identify keys that moved
const keysToMove = [];
for (const key of allKeys) {
  const oldShard = oldRing.getNode(key);
  const newShard = ring.getNode(key);
  if (oldShard !== newShard) {
    keysToMove.push({ key, from: oldShard, to: newShard });
  }
}

// Step 3: Dual-write phase (writes go to both old and new shards)
router.setDualWriteMode(keysToMove);

// Step 4: Backfill moved keys
for (const { key, from, to } of keysToMove) {
  const data = await shards.get(from).query('SELECT * FROM users WHERE id = $1', [key]);
  await shards.get(to).query('INSERT INTO users VALUES (...)', data.rows[0]);
}

// Step 5: Verify data
await verifyDataIntegrity(keysToMove);

// Step 6: Switch reads to new shards
router.setReadMode('new');

// Step 7: Stop writing to old shards, cleanup
router.setDualWriteMode(false);
await cleanupOldShards(keysToMove);
```

**Downtime**: Zero with dual-write

---

## Strategy 2: Virtual Shards

**Best for**: Planning for future growth

### Setup

```typescript
// Over-provision virtual shards (1024 virtual → 4 physical)
const VIRTUAL_SHARDS = 1024;
const PHYSICAL_SHARDS = ['shard_0', 'shard_1', 'shard_2', 'shard_3'];

// Map virtual → physical
const virtualToPhysical = new Map<number, string>();
for (let i = 0; i < VIRTUAL_SHARDS; i++) {
  const physicalIndex = i % PHYSICAL_SHARDS.length;
  virtualToPhysical.set(i, PHYSICAL_SHARDS[physicalIndex]);
}

function getShard(key: string): string {
  const virtualShard = hash(key) % VIRTUAL_SHARDS;
  return virtualToPhysical.get(virtualShard)!;
}
```

### Rebalancing

```typescript
// Add 5th physical shard
PHYSICAL_SHARDS.push('shard_4');

// Move virtual shards 800-999 from shard_0 to shard_4
for (let i = 800; i < 1000; i++) {
  if (virtualToPhysical.get(i) === 'shard_0') {
    // Migrate data for virtual shard i
    await migrateVirtualShard(i, 'shard_0', 'shard_4');
    // Update mapping
    virtualToPhysical.set(i, 'shard_4');
  }
}

// Application code unchanged! Still uses getShard(key)
```

**Benefits**:
- Fine-grained rebalancing
- No application changes
- Gradual migration

---

## Strategy 3: Directory Update

**Best for**: Directory-based sharding

### Process

```typescript
// Step 1: Identify tenants to move (e.g., large tenants)
const tenantsToMove = await db.query(`
  SELECT tenant_id, shard_id, data_size_gb
  FROM shard_directory
  WHERE shard_id = 'shard_2'
    AND data_size_gb > 100
  ORDER BY data_size_gb DESC
  LIMIT 5
`);

// Step 2: For each tenant
for (const tenant of tenantsToMove.rows) {
  // 2a: Dual-write to old and new shard
  await directory.enableDualWrite(tenant.tenant_id, 'shard_5');

  // 2b: Backfill existing data
  await backfillTenant(tenant.tenant_id, tenant.shard_id, 'shard_5');

  // 2c: Verify data
  const oldCount = await countTenantRecords(tenant.shard_id, tenant.tenant_id);
  const newCount = await countTenantRecords('shard_5', tenant.tenant_id);
  if (oldCount !== newCount) throw new Error('Data mismatch!');

  // 2d: Update directory (switch reads)
  await directory.updateShardMapping(tenant.tenant_id, 'shard_5');

  // 2e: Stop dual-write, cleanup
  await directory.disableDualWrite(tenant.tenant_id);
  await deleteTenantData(tenant.shard_id, tenant.tenant_id);
}
```

**Downtime**: Zero per tenant

---

## Strategy 4: Range Split

**Best for**: Range-based sharding with hotspot

### Process

```typescript
// Problem: Range 3000000+ on shard_3 is 90% of data
// Solution: Split into two ranges

// Step 1: Create new shard for split range
await createShard('shard_4');

// Step 2: Dual-write for affected range
router.setRangeDualWrite(2000000, Infinity, ['shard_3', 'shard_4']);

// Step 3: Backfill shard_4 with records >= 5000000
await db.query(`
  INSERT INTO shard_4.users
  SELECT * FROM shard_3.users
  WHERE id >= 5000000
`);

// Step 4: Update range mappings
ranges = [
  { start: 0, end: 1000000, shardId: 'shard_0' },
  { start: 1000000, end: 2000000, shardId: 'shard_1' },
  { start: 2000000, end: 3000000, shardId: 'shard_2' },
  { start: 3000000, end: 5000000, shardId: 'shard_3' }, // Narrowed
  { start: 5000000, end: Infinity, shardId: 'shard_4' }, // New
];

// Step 5: Stop dual-write
router.setRangeDualWrite(false);

// Step 6: Cleanup: Delete records >= 5000000 from shard_3
await db.query('DELETE FROM shard_3.users WHERE id >= 5000000');
```

---

## Zero-Downtime Migration Checklist

**Before Migration**:
- [ ] Backup all shards
- [ ] Test migration on staging
- [ ] Prepare rollback plan
- [ ] Set up monitoring
- [ ] Announce maintenance window (even if zero downtime)

**During Migration**:
- [ ] Enable dual-write
- [ ] Backfill data
- [ ] Verify checksums match
- [ ] Monitor error rates
- [ ] Switch reads to new shard
- [ ] Monitor latency/errors for 1 hour
- [ ] Disable dual-write
- [ ] Cleanup old data

**After Migration**:
- [ ] Monitor for 24 hours
- [ ] Check shard distribution
- [ ] Verify no data loss
- [ ] Update documentation
- [ ] Delete backups after 7 days

---

## Rollback Procedures

```typescript
// If migration fails during dual-write phase
async function rollbackMigration(keysToMove: MigrationKey[]) {
  // 1. Stop dual-write
  router.setDualWriteMode(false);

  // 2. Switch reads back to old shards
  router.setReadMode('old');

  // 3. Delete data from new shards
  for (const { key, to } of keysToMove) {
    await shards.get(to).query('DELETE FROM users WHERE id = $1', [key]);
  }

  // 4. Verify old shards still have data
  for (const { key, from } of keysToMove) {
    const count = await shards.get(from).query(
      'SELECT COUNT(*) FROM users WHERE id = $1', [key]
    );
    if (count.rows[0].count === 0) {
      throw new Error(`Data loss detected for key: ${key}`);
    }
  }
}
```

---

## Tools & Automation

### Progress Tracking

```typescript
class MigrationProgress {
  async track(migration: Migration) {
    const totalKeys = migration.keysToMove.length;
    let completed = 0;

    for (const key of migration.keysToMove) {
      await this.migrateKey(key);
      completed++;

      if (completed % 1000 === 0) {
        console.log(`Progress: ${completed}/${totalKeys} (${(completed/totalKeys*100).toFixed(2)}%)`);
        await this.saveCheckpoint(migration.id, completed);
      }
    }
  }

  async resume(migrationId: string) {
    const checkpoint = await this.loadCheckpoint(migrationId);
    return checkpoint.lastCompletedIndex;
  }
}
```

### Verification

```typescript
async function verifyMigration(keysToMove: MigrationKey[]) {
  const errors = [];

  for (const { key, from, to } of keysToMove) {
    const oldData = await shards.get(from).query('SELECT * FROM users WHERE id = $1', [key]);
    const newData = await shards.get(to).query('SELECT * FROM users WHERE id = $1', [key]);

    const oldHash = hash(JSON.stringify(oldData.rows[0]));
    const newHash = hash(JSON.stringify(newData.rows[0]));

    if (oldHash !== newHash) {
      errors.push({ key, from, to, reason: 'Data mismatch' });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Verification failed: ${errors.length} keys mismatched`);
  }
}
```

---

## Summary

| Strategy | Best For | Downtime | Complexity |
|----------|----------|----------|------------|
| Consistent Hashing | Hash sharding | Zero | Medium |
| Virtual Shards | Future growth | Zero | Low |
| Directory Update | Multi-tenant | Zero | Low |
| Range Split | Range hotspots | Zero | Medium |

**Golden Rule**: Always dual-write before switching reads

**Next Steps**: Load `implementation-patterns.md` for router code examples
