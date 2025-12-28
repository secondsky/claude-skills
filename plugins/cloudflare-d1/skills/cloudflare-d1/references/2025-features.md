# D1 2025 Features and Updates

**Purpose**: Comprehensive guide to all 2025 D1 updates, new features, and breaking changes

**Last Updated**: 2025-01-15

---

## Table of Contents

1. [Overview](#overview)
2. [Q1 2025: Performance & Reliability](#q1-2025-performance--reliability)
3. [Q2 2025: Read Replication](#q2-2025-read-replication)
4. [Q3 2025: Automatic Query Retries](#q3-2025-automatic-query-retries)
5. [Q4 2025: Data Localization](#q4-2025-data-localization)
6. [Migration Checklist](#migration-checklist)
7. [Breaking Changes Summary](#breaking-changes-summary)

---

## Overview

D1 received major updates throughout 2025, including:
- **40-60% performance improvement** (January 2025)
- **Read replication** for global low-latency reads (April 2025)
- **Automatic query retries** for reliability (September 2025)
- **Data localization** for compliance (November 2025)
- **Free tier enforcement** (February 10, 2025 - BREAKING CHANGE)

**Impact**: All D1 users benefit from performance improvements. Paid tier users can enable advanced features (read replication, data localization).

---

## Q1 2025: Performance & Reliability

### January 2025: Global Performance Optimization

**Status**: Generally Available (All users)

**Improvements**:
- **40-60% reduction in P50 query latency** globally
- Optimized SQLite engine for edge execution
- Reduced cold start impact for databases <100 MB
- Lower network round-trip times

**Before vs After** (typical query):
```
Before (December 2024):
- P50: 35ms
- P95: 180ms

After (January 2025):
- P50: 15ms (-57%)
- P95: 85ms (-53%)
```

**Action Required**: None (automatic for all databases)

**Verification**:
```bash
# Compare metrics before/after January 15, 2025
wrangler d1 insights <database-name> --from "2024-12-01" --to "2025-01-31"
```

**Full metrics guide**: `references/metrics-analytics.md`

---

### February 2025: PRAGMA optimize Support

**Status**: Generally Available

**Feature**: D1 now supports `PRAGMA optimize` for query planner improvements

**What It Does**:
- Analyzes table statistics
- Updates query planner statistics
- Improves query performance for complex WHERE clauses

**When to Use**:
```sql
-- After bulk inserts (>10,000 rows)
INSERT INTO users ...;  -- (many rows)
PRAGMA optimize;

-- After creating/dropping indexes
CREATE INDEX idx_users_email ON users(email);
PRAGMA optimize;

-- Weekly maintenance (via Cron Trigger)
PRAGMA optimize;
```

**Example Worker** (weekly optimization):
```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Weekly database optimization
    await env.DB.prepare('PRAGMA optimize').run();

    console.log('Database optimized:', new Date().toISOString());
  }
};
```

**Configure Cron Trigger** (wrangler.jsonc):
```jsonc
{
  "triggers": {
    "crons": ["0 2 * * 0"]  // 2 AM every Sunday
  }
}
```

**Performance Impact**: 5-20% query performance improvement for complex queries

---

### February 10, 2025: Free Tier Enforcement

**Status**: Breaking Change - ENFORCED

**What Changed**: Hard limits now enforced on Workers Free plan

| Limit | Before Feb 10 | After Feb 10 |
|-------|---------------|--------------|
| Databases per account | 10 (soft warning) | 10 (hard limit) |
| Database size | 500 MB (soft warning) | 500 MB (hard limit) |
| Queries per invocation | 50 (soft warning) | 50 (hard limit) |

**Behavior**:
- **Before**: Exceeding limits → Warnings logged, queries executed
- **After**: Exceeding limits → **429 Too Many Requests** errors, queries fail

**Error Examples**:
```typescript
// Exceeding 50 queries on free tier
// Error: D1_ERROR: Too many queries (50 per invocation on free plan)

// Database at 501 MB on free tier
// Error: D1_ERROR: Database size limit exceeded (500 MB on free plan)
```

**Migration Guide**:

**Step 1: Audit Current Usage**
```bash
# List all databases and sizes
wrangler d1 list

# Check specific database size
wrangler d1 info my-database
```

**Step 2: Identify Issues**
- **>10 databases?** → Consolidate or upgrade
- **Database >400 MB?** → Archive old data or upgrade
- **Regularly >40 queries/invocation?** → Implement batching or upgrade

**Step 3: Optimize (if staying on free tier)**

**A. Implement Query Batching**:
```typescript
// Before: 100 queries (exceeds limit)
for (const user of users) {
  await env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(user.name, user.email).run();
}

// After: 1 batch query
const statements = users.map(user =>
  env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(user.name, user.email)
);
await env.DB.batch(statements);  // Counts as 1 query
```

**B. Archive Old Data**:
```sql
-- Delete logs older than 90 days
DELETE FROM logs WHERE created_at < unixepoch() - 7776000;

PRAGMA optimize;
```

**C. Consolidate Databases** (if under 10 limit):
```bash
# Export from old database
wrangler d1 execute old-database --command "SELECT * FROM users" > users.sql

# Import to consolidated database
wrangler d1 execute main-database --file=users.sql
```

**Step 4: Upgrade to Paid (if needed)**

**Cost**: $5/month minimum (Workers Paid plan)

**Benefits**:
- 50,000 databases (vs 10)
- 10 GB per database (vs 500 MB)
- 1,000 queries/invocation (vs 50)
- 30-day Time Travel (vs 7 days)

**How to Upgrade**:
1. Cloudflare dashboard → Workers & Pages
2. Plans → Upgrade to Workers Paid
3. Confirm billing

**Full limits documentation**: `references/limits.md`

---

## Q2 2025: Read Replication

### April 2025: Read Replication (Public Beta)

**Status**: Public Beta (Production-Ready)

**Feature**: Deploy read replicas globally for lower latency reads

**Use Case**: Read-heavy applications (e.g., content delivery, dashboards, search)

**Benefits**:
- Up to **2x read throughput**
- **Lower latency** for reads from nearest region
- **No additional cost** (included in paid plan)

**Limitations**:
- Write queries still go to primary region
- Eventual consistency (~100ms lag typical)
- Paid plan only

**Setup**:

**Option 1: wrangler CLI**
```bash
# Enable read replication
wrangler d1 replicate enable my-database
```

**Option 2: wrangler.jsonc**
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "my-database",
    "database_id": "abc123...",
    "replicate": {
      "enabled": true,
      "regions": ["WEUR", "ENAM", "APAC"]  // Optional: specify regions
    }
  }]
}
```

**Sessions API** (Read-Write Separation):
```typescript
import { D1Database } from '@cloudflare/workers-types';

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      // Read from nearest replica (lower latency)
      const readSession = env.DB.withSession({ mode: 'read-only' });

      const users = await readSession
        .prepare('SELECT * FROM users WHERE status = ?')
        .bind('active')
        .all();

      return Response.json(users.results);
    } else {
      // Write to primary
      const writeSession = env.DB.withSession({ mode: 'read-write' });

      const { name, email } = await request.json();
      await writeSession
        .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .bind(name, email)
        .run();

      return Response.json({ success: true });
    }
  }
};
```

**Automatic Region Selection**:
```typescript
// Cloudflare automatically routes to nearest replica
const session = env.DB.withSession({ preferredRegion: 'auto' });

const users = await session.prepare('SELECT * FROM users').all();

// Check which region served the request
console.log('Served by:', users.meta.served_by_region);
```

**Consistency Guarantees**:
- **Eventual consistency**: Replicas lag ~100ms behind primary (typical)
- **Read-your-writes NOT guaranteed**: Recent writes may not be visible immediately on replicas
- **Recommendation**: Use read-write session for critical reads after writes

**Performance Impact**:
- **Read latency**: 20-50% lower for users far from primary region
- **Throughput**: Up to 2x for read-heavy workloads
- **Write latency**: No change (still goes to primary)

**Full read replication guide**: `references/read-replication.md`

---

## Q3 2025: Automatic Query Retries

### September 2025: Automatic Retries

**Status**: Generally Available (All users)

**Feature**: D1 automatically retries read-only queries on transient failures

**Behavior**:

| Query Type | Automatic Retries | Backoff |
|------------|-------------------|---------|
| **Read queries** (SELECT) | Up to 2 retries | 100ms, 200ms |
| **Write queries** (INSERT/UPDATE/DELETE) | No automatic retries | N/A |

**How It Works**:
1. Read query fails with transient error (network issue, timeout)
2. D1 waits 100ms, retries query
3. If still fails, waits 200ms, retries again
4. If still fails after 2 retries → Returns error to application

**Transparent**: Retries are logged in `wrangler tail` but invisible to application code

**Example Log**:
```
[D1] Query retry attempt 1/2: SELECT * FROM users WHERE email = ?
[D1] Query succeeded on retry 1
```

**Code Changes**: None required (transparent)

**When to Implement Application-Level Retries**:

Still implement retries for **write operations**:
```typescript
async function retryWrite<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

// Usage
await retryWrite(() =>
  env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind('Alice', 'alice@example.com')
    .run()
);
```

**Idempotency Considerations**:

Ensure write operations are idempotent to safely retry:
```typescript
// ❌ NOT idempotent (retry would create duplicate)
await env.DB.prepare('INSERT INTO users (email) VALUES (?)').bind(email).run();

// ✅ Idempotent (retry is safe)
await env.DB.prepare('INSERT OR IGNORE INTO users (email) VALUES (?)').bind(email).run();

// ✅ Idempotent with WHERE clause
await env.DB.prepare(
  'UPDATE users SET last_login = ? WHERE email = ? AND last_login < ?'
).bind(Date.now(), email, Date.now()).run();
```

**Full best practices guide**: `references/best-practices.md`

---

## Q4 2025: Data Localization

### November 2025: Jurisdiction-Specific Storage

**Status**: Generally Available (Paid Plans Only)

**Feature**: Specify data residency jurisdictions for compliance

**Use Case**: GDPR compliance, data sovereignty requirements, industry regulations

**Available Jurisdictions**:
- **EU**: European Union (GDPR Article 44-50 compliance)
- **US**: United States
- **GLOBAL**: Default (best performance, data may cross borders)

**Configuration**:

**Option 1: wrangler CLI**
```bash
# Create database with jurisdiction
wrangler d1 create my-database --jurisdiction EU

# Update existing database
wrangler d1 update my-database --jurisdiction EU
```

**Option 2: wrangler.jsonc**
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "my-database",
    "database_id": "abc123...",
    "jurisdiction": "EU"  // or "US", "GLOBAL"
  }]
}
```

**Compliance Guarantees**:
- **EU jurisdiction**: Data stored and processed only in European Union datacenters
- **US jurisdiction**: Data stored and processed only in United States datacenters
- **GLOBAL**: Data may be stored/processed in any Cloudflare datacenter

**Important**: Metadata (table names, query logs) may still cross borders for platform operations

**Performance Impact**:
- **Latency**: ~10-30ms higher for requests outside jurisdiction
- **Read replication**: Still allowed within jurisdiction
- **Throughput**: No change

**Example: GDPR Compliance**:
```typescript
// EU jurisdiction database for EU user data
const euSession = env.DB_EU.withSession({ jurisdiction: 'EU' });

await euSession.prepare(
  'INSERT INTO users (email, country) VALUES (?, ?)'
).bind('user@example.eu', 'Germany').run();

// GLOBAL database for non-EU data
const globalSession = env.DB_GLOBAL;

await globalSession.prepare(
  'INSERT INTO analytics (event, timestamp) VALUES (?, ?)'
).bind('page_view', Date.now()).run();
```

**Use Cases**:
- **GDPR (EU jurisdiction)**: European user data
- **HIPAA (US jurisdiction)**: Healthcare data in United States
- **Financial services**: Regulatory data residency requirements
- **Government contracts**: Data sovereignty mandates

---

## Migration Checklist

### From v2.x to v3.x (2025 Features)

**Step 1: Review Free Tier Usage** (if on free plan)
```bash
# Check database count and sizes
wrangler d1 list

# Check query usage (via metrics dashboard or GraphQL API)
# If approaching limits, plan to upgrade or optimize
```
- [ ] Database count < 10
- [ ] All databases < 400 MB
- [ ] Query count typically < 40 per invocation

**Step 2: Test PRAGMA optimize**
```bash
# Test in staging
wrangler d1 execute my-database --local --command "PRAGMA optimize"

# Apply in production (during low-traffic window)
wrangler d1 execute my-database --command "PRAGMA optimize"
```
- [ ] No errors from PRAGMA optimize
- [ ] Query performance improved (check metrics)

**Step 3: Enable Read Replication** (if read-heavy, paid plan)
```bash
# Enable replication
wrangler d1 replicate enable my-database

# Update code to use Sessions API
# (see references/read-replication.md)
```
- [ ] Read replicas enabled
- [ ] Code uses withSession() for read-write separation
- [ ] Metrics show improved read latency

**Step 4: Verify Automatic Retry Behavior**
```bash
# Monitor wrangler tail for retry logs
wrangler tail my-worker --format pretty | grep "retry"
```
- [ ] Read queries retry automatically on transient failures
- [ ] Write queries implemented with application-level retries

**Step 5: Configure Jurisdiction** (if compliance required, paid plan)
```bash
# Set jurisdiction
wrangler d1 update my-database --jurisdiction EU
```
- [ ] Jurisdiction configured (if needed)
- [ ] Compliance requirements met

**Step 6: Update Monitoring**
```bash
# Track new metrics (query efficiency, replica performance)
wrangler d1 insights my-database
```
- [ ] Metrics dashboard reviewed
- [ ] Alerts configured for P95 latency, database size
- [ ] Weekly insights review scheduled

**Step 7: Update Compatibility Date** (recommended)
```jsonc
{
  "compatibility_date": "2025-01-15"  // Performance improvements
}
```
- [ ] wrangler.jsonc updated
- [ ] Tested in staging
- [ ] Deployed to production

---

## Breaking Changes Summary

### February 10, 2025: Free Tier Enforcement

**Impact**: Users exceeding free tier limits will receive errors instead of warnings

**Affected Users**: Workers Free plan only

**Mitigation**:
- Implement query batching (reduce query count)
- Archive old data (reduce database size)
- Consolidate databases (reduce database count)
- Upgrade to Workers Paid ($5/month)

**Timeline**: Enforcement began February 10, 2025 (already in effect)

### No Other Breaking Changes

All other 2025 features are **additive** and **opt-in**:
- Performance improvements: Automatic, no code changes
- Read replication: Opt-in, paid plan only
- Automatic retries: Automatic, backwards compatible
- Data localization: Opt-in, paid plan only

---

## References

- **Release Notes**: https://developers.cloudflare.com/d1/platform/release-notes/
- **Read Replication**: `references/read-replication.md`
- **Limits**: `references/limits.md`
- **Metrics**: `references/metrics-analytics.md`
- **Best Practices**: `references/best-practices.md`

---

**Questions about 2025 updates?**

1. Review this guide for feature details
2. Check release notes for latest announcements
3. Test new features in staging before production
4. Monitor metrics for performance impact
5. Upgrade to paid plan to unlock advanced features (read replication, data localization)
