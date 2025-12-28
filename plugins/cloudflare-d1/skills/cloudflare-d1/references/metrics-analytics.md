# D1 Metrics and Analytics

**Purpose**: Observability and performance monitoring guide for Cloudflare D1

**Last Updated**: 2025-01-15

---

## Table of Contents

1. [Overview](#overview)
2. [Available Metrics](#available-metrics)
3. [Dashboard Access](#dashboard-access)
4. [GraphQL Analytics API](#graphql-analytics-api)
5. [Experimental: wrangler d1 insights](#experimental-wrangler-d1-insights)
6. [Query Efficiency Metric](#query-efficiency-metric)
7. [Performance Baselines (2025)](#performance-baselines-2025)
8. [Monitoring Best Practices](#monitoring-best-practices)
9. [Common Patterns](#common-patterns)
10. [Integration with Observability Tools](#integration-with-observability-tools)

---

## Overview

Monitor D1 performance using three approaches:
1. **Cloudflare Dashboard**: Visual metrics with customizable time windows
2. **GraphQL API**: Programmatic access for custom dashboards
3. **wrangler d1 insights** (Experimental): Query-level performance analysis

**Data Retention**: All metrics retain data for **31 days**

---

## Available Metrics

D1 exposes **7 key metrics** for database monitoring:

### 1. Query Performance Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Read Queries (QPS)** | SELECT queries per second | Track read load |
| **Write Queries (QPS)** | INSERT/UPDATE/DELETE per second | Track write load |
| **Query Latency** | Response time (P50/P95/P99 percentiles) | Identify slow queries |

**Query Latency** is the total query response time, including:
- SQL execution time
- Result serialization time
- Network round-trip time

**Percentiles Explained**:
- **P50 (median)**: 50% of queries faster than this
- **P95**: 95% of queries faster than this (common SLA target)
- **P99**: 99% of queries faster than this (tail latency)

### 2. Data Transfer Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Rows Read** | Total rows scanned by queries | Detect inefficient queries |
| **Rows Written** | Total rows inserted/updated/deleted | Track data growth |
| **Query Response Size (bytes)** | Total bytes returned by queries | Monitor bandwidth usage |

**Rows Read** includes all scanned rows, even if not returned:
```sql
-- Scans 10,000 rows, returns 100 rows
SELECT * FROM users WHERE status = 'active';  -- Missing index

-- Rows Read: 10,000 (inefficient)
-- Rows Returned: 100
```

### 3. Storage Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Database Size (bytes)** | Current database size | Track storage usage vs limits |

**Tracked hourly**. Use to:
- Monitor database growth rate
- Plan for capacity (approaching 500 MB free / 10 GB paid limits)
- Estimate when to archive old data

---

## Dashboard Access

### Via Cloudflare Dashboard

**Navigation**:
1. Log in to Cloudflare dashboard
2. Navigate to **Workers & Pages** → **D1**
3. Select your database
4. Click **"Metrics"** tab

**Features**:
- **Customizable time windows**: 24 hours (default), 7 days, 30 days, custom range
- **Interactive graphs**: Hover for exact values
- **Multiple databases**: Switch between databases
- **Real-time updates**: Auto-refresh every 60 seconds

**Example Metrics View**:
```
[Graph: Read/Write QPS]
- Peak read QPS: 45
- Peak write QPS: 12
- Time: 2025-01-15 14:30 UTC

[Graph: Query Latency]
- P50: 15ms
- P95: 120ms
- P99: 450ms

[Graph: Database Size]
- Current: 380 MB
- Trend: +2 MB/day
```

**Use Cases**:
- **Daily monitoring**: Check P95 latency daily
- **Incident investigation**: Correlate latency spikes with error logs
- **Capacity planning**: Track database size growth

---

## GraphQL Analytics API

**Purpose**: Programmatic access to metrics for custom dashboards, alerting, or analysis

**Base URL**: `https://api.cloudflare.com/client/v4/graphql`

**Authentication**: API token with `Analytics:Read` permission

### Available Datasets

1. **d1AnalyticsAdaptiveGroups**: Query performance metrics (QPS, latency, rows)
2. **d1StorageAdaptiveGroups**: Storage metrics (database size)
3. **d1QueriesAdaptiveGroups**: Query-level analytics (experimental)

### Example: Query Performance Metrics

```graphql
query GetD1Metrics($accountId: String!, $databaseId: String!, $from: Time!, $to: Time!) {
  viewer {
    accounts(filter: {accountTag: $accountId}) {
      d1AnalyticsAdaptiveGroups(
        filter: {
          databaseId: $databaseId,
          datetime_geq: $from,
          datetime_leq: $to
        }
        limit: 1000
        orderBy: [datetime_ASC]
      ) {
        dimensions {
          ts: datetime
        }
        sum {
          readQueries
          writeQueries
          rowsRead
          rowsWritten
          queryResponseBytes
        }
        avg {
          queryLatencyMs
        }
        quantiles {
          queryLatencyMsP50
          queryLatencyMsP95
          queryLatencyMsP99
        }
      }
    }
  }
}
```

**Variables**:
```json
{
  "accountId": "your-account-id",
  "databaseId": "your-database-id",
  "from": "2025-01-01T00:00:00Z",
  "to": "2025-01-31T23:59:59Z"
}
```

**Response**:
```json
{
  "data": {
    "viewer": {
      "accounts": [{
        "d1AnalyticsAdaptiveGroups": [
          {
            "dimensions": { "ts": "2025-01-15T14:00:00Z" },
            "sum": {
              "readQueries": 1250,
              "writeQueries": 340,
              "rowsRead": 45000,
              "rowsWritten": 340,
              "queryResponseBytes": 2500000
            },
            "avg": { "queryLatencyMs": 18 },
            "quantiles": {
              "queryLatencyMsP50": 12,
              "queryLatencyMsP95": 85,
              "queryLatencyMsP99": 220
            }
          }
        ]
      }]
    }
  }
}
```

### Example: Storage Metrics

```graphql
query GetD1Storage($accountId: String!, $databaseId: String!) {
  viewer {
    accounts(filter: {accountTag: $accountId}) {
      d1StorageAdaptiveGroups(
        filter: {databaseId: $databaseId}
        limit: 100
        orderBy: [datetime_DESC]
      ) {
        dimensions {
          ts: datetime
        }
        max {
          databaseSizeBytes
        }
      }
    }
  }
}
```

**Use Cases**:
- **Custom dashboards**: Build Grafana/Datadog dashboards
- **Alerting**: Trigger alerts when P95 > threshold
- **Capacity planning**: Analyze growth trends
- **Cost optimization**: Identify inefficient queries

**Full GraphQL API Docs**: https://developers.cloudflare.com/analytics/graphql-api/

---

## Experimental: wrangler d1 insights

**Status**: Experimental (subject to change)

**Purpose**: Query-level performance analysis with actionable recommendations

**Command**:
```bash
wrangler d1 insights <database-name> [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--slow` | Show only slow queries (P95 > 200ms) | `wrangler d1 insights my-db --slow` |
| `--from` | Start date (ISO 8601) | `--from "2025-01-01"` |
| `--to` | End date (ISO 8601) | `--to "2025-01-31"` |
| `--limit` | Max queries to display (default: 10) | `--limit 20` |

### Output Format

```
Top 10 Queries by Execution Count (Last 24 hours)

1. SELECT * FROM users WHERE email = ?
   Executions: 1,200
   Avg Duration: 18ms
   P95 Duration: 85ms
   P99 Duration: 220ms
   Rows Read: 1,200
   Rows Returned: 1,200
   Efficiency: 1.0 (100%)
   Status: ✅ Excellent

2. SELECT * FROM orders WHERE user_id = ?
   Executions: 850
   Avg Duration: 145ms
   P95 Duration: 450ms
   P99 Duration: 890ms
   Rows Read: 85,000
   Rows Returned: 4,250
   Efficiency: 0.05 (5%)
   Status: ⚠️ Needs Index

   Recommendation: CREATE INDEX idx_orders_user_id ON orders(user_id);
   Expected Impact: P95 450ms → ~15ms (97% improvement)

3. SELECT COUNT(*) FROM users WHERE status = ?
   Executions: 600
   Avg Duration: 75ms
   P95 Duration: 180ms
   Rows Read: 120,000
   Rows Returned: 1
   Efficiency: 0.0001 (<0.01%)
   Status: ❌ Critical

   Recommendation: CREATE INDEX idx_users_status ON users(status);
   Expected Impact: P95 180ms → ~8ms (96% improvement)
```

### Understanding Output

**Efficiency = rows_returned / rows_read**

| Efficiency | Status | Action |
|------------|--------|--------|
| **1.0** | ✅ Excellent | Perfect - every row read is returned |
| **0.5-0.99** | ✅ Good | Acceptable for filtered queries |
| **0.1-0.49** | ⚠️ Moderate | Consider index if query is frequent |
| **< 0.1** | ❌ Poor | Add index urgently |

### Use Cases

**Weekly Performance Review**:
```bash
# Audit slow queries weekly
wrangler d1 insights my-db --slow --from "$(date -d '7 days ago' +%Y-%m-%d)"
```

**Identify Missing Indexes**:
```bash
# Find queries with efficiency < 10%
wrangler d1 insights my-db | grep "Efficiency: 0.0"
```

**Post-Deployment Validation**:
```bash
# Check if new code introduced slow queries
wrangler d1 insights my-db --from "$(date +%Y-%m-%d)"
```

**Automation**:
```bash
# Weekly cron job to email slow query report
#!/bin/bash
REPORT=$(wrangler d1 insights my-db --slow --from "$(date -d '7 days ago' +%Y-%m-%d)")
echo "$REPORT" | mail -s "D1 Slow Query Report" team@example.com
```

---

## Query Efficiency Metric

**Definition**: `efficiency = rows_returned / rows_read`

### Why It Matters

**Low efficiency** means you're reading 10x-1000x more data than you need:
- Wastes database CPU
- Increases query latency
- Consumes more invocation quota

**Example: Missing Index**:
```sql
-- Query: Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Without index:
-- Rows Read: 100,000 (full table scan)
-- Rows Returned: 1
-- Efficiency: 0.00001 (0.001%)
-- Latency: 450ms

-- After: CREATE INDEX idx_users_email ON users(email);
-- Rows Read: 1 (index seek)
-- Rows Returned: 1
-- Efficiency: 1.0 (100%)
-- Latency: 8ms
```

### Efficiency Targets

| Query Type | Target Efficiency | Notes |
|------------|-------------------|-------|
| **Primary key lookup** | 1.0 | Perfect efficiency |
| **Indexed WHERE clause** | > 0.9 | Nearly perfect |
| **Filtered query with index** | > 0.1 | Acceptable |
| **Full table scan** | < 0.01 | Needs index |

### Improving Efficiency

**Step 1: Identify Low-Efficiency Queries**
```bash
wrangler d1 insights my-db | grep -A 5 "Efficiency: 0\."
```

**Step 2: Explain Query Plan**
```bash
wrangler d1 execute my-db --command "EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?"
```

**Output**:
```
SCAN TABLE users
```

**Interpretation**: `SCAN TABLE` = full table scan (bad). Need index.

**Step 3: Add Index**
```sql
CREATE INDEX idx_users_email ON users(email);
```

**Step 4: Verify Improvement**
```bash
wrangler d1 execute my-db --command "EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?"
```

**Output**:
```
SEARCH TABLE users USING INDEX idx_users_email (email=?)
```

**Interpretation**: `SEARCH ... USING INDEX` = index seek (good)

**Full query optimization guide**: `references/query-patterns.md`

---

## Performance Baselines (2025)

**As of January 2025**: D1 performance improved 40-60% due to global optimization.

### Typical Latencies (Post-Optimization)

| Query Type | P50 | P95 | P99 |
|------------|-----|-----|-----|
| **Primary key lookup** | < 10ms | < 20ms | < 50ms |
| **Indexed WHERE clause** | < 15ms | < 40ms | < 100ms |
| **Simple JOIN (2 tables, indexed)** | < 25ms | < 80ms | < 200ms |
| **Full table scan (<10k rows)** | < 50ms | < 150ms | < 400ms |
| **Aggregation (COUNT, SUM)** | < 30ms | < 100ms | < 250ms |

**If exceeding these baselines**: Check for missing indexes, inefficient queries, or database size issues.

### Database Size Impact

| Database Size | Cold Start Impact | Notes |
|---------------|-------------------|-------|
| **< 100 MB** | Minimal (<50ms) | Optimal performance |
| **100-500 MB** | Moderate (50-200ms) | Acceptable |
| **500 MB - 1 GB** | Higher (200-500ms) | Consider archival |
| **> 1 GB** | Significant (500ms+) | Upgrade to paid or archive |

**Cold start** = first query after database hasn't been accessed in 15+ minutes.

### Read Replication Performance

**With read replicas** (April 2025 public beta):
- Up to **2x read throughput** for read-heavy workloads
- **Lower latency** for reads from nearest region
- See `references/read-replication.md` for setup

---

## Monitoring Best Practices

### 1. Set Up Alerts

**Recommended alerts**:

**High Latency**:
```
IF P95 query latency > 200ms for 5 minutes
THEN alert team
```

**Database Size**:
```
IF database size > 400 MB (80% of free tier limit)
THEN alert team to plan archival or upgrade
```

**Error Rate**:
```
IF D1_ERROR count > 10 in 1 minute
THEN alert team
```

**Implementation** (using GraphQL API + custom alerting):
```javascript
// Fetch metrics every 5 minutes
const metrics = await fetchD1Metrics(accountId, databaseId);

if (metrics.queryLatencyMsP95 > 200) {
  await sendAlert('High latency detected', { p95: metrics.queryLatencyMsP95 });
}

if (metrics.databaseSizeBytes > 400 * 1024 * 1024) { // 400 MB
  await sendAlert('Approaching storage limit', { size: metrics.databaseSizeBytes });
}
```

### 2. Track Efficiency Weekly

**Weekly audit script**:
```bash
#!/bin/bash
# weekly-d1-audit.sh

REPORT=$(wrangler d1 insights my-db --slow --from "$(date -d '7 days ago' +%Y-%m-%d)")
echo "$REPORT" > reports/d1-audit-$(date +%Y-%m-%d).txt

# Check for critical inefficiencies
if echo "$REPORT" | grep -q "Efficiency: 0.0"; then
  echo "⚠️ Critical inefficiencies detected! Review report."
fi
```

**Automate with cron**:
```cron
0 9 * * 1 /path/to/weekly-d1-audit.sh
```

### 3. Review Slow Queries Monthly

**Monthly checklist**:
1. Run `wrangler d1 insights --slow`
2. Identify queries with P95 > 200ms
3. Add indexes or optimize queries
4. Re-test and compare metrics

### 4. Correlate Metrics with Application Errors

**Cross-reference**:
- **High query latency** → Check for application timeouts
- **Spike in write queries** → Check for data duplication bugs
- **Database size growth** → Check for missing cleanup jobs

### 5. Baseline After Changes

**After deployments**:
1. Note pre-deployment P95 latency
2. Deploy changes
3. Wait 1 hour for metrics to update
4. Compare new P95 vs baseline
5. Rollback if P95 increases >50%

---

## Common Patterns

### High Latency Investigation

**Workflow**:
1. **Check insights**:
   ```bash
   wrangler d1 insights my-db --slow
   ```

2. **Identify top slow queries** (sorted by P95 latency)

3. **Review query efficiency** (look for < 0.1)

4. **Check for missing indexes**:
   ```bash
   wrangler d1 execute my-db --command "EXPLAIN QUERY PLAN [your query]"
   ```

5. **Add indexes** if `SCAN TABLE` detected:
   ```sql
   CREATE INDEX idx_table_column ON table(column);
   PRAGMA optimize;
   ```

6. **Verify improvement** (wait 10 minutes, recheck insights)

### High Row Read Count

**Cause**: Inefficient queries reading many rows but returning few

**Solution**:
1. Run `wrangler d1 insights my-db` → Find queries with low efficiency
2. Add indexes on filtered/joined columns
3. Use `LIMIT` for unbounded queries
4. Consider materialized views for complex aggregations

**Example**:
```sql
-- Before: Scans entire users table
SELECT COUNT(*) FROM users WHERE status = 'active';
-- Rows Read: 100,000

-- After: Add index
CREATE INDEX idx_users_status ON users(status);
-- Rows Read: 5,000 (only active users)
```

### Database Size Growth

**Monitoring**:
```bash
# Track size daily
wrangler d1 info my-db | grep "Size"
```

**Mitigation**:
1. **Archive old data**:
   ```sql
   DELETE FROM logs WHERE created_at < unixepoch() - 7776000; -- 90 days
   PRAGMA optimize;
   ```

2. **Implement retention policy** (Cron Trigger):
   ```typescript
   export default {
     async scheduled(event: ScheduledEvent, env: Env) {
       await env.DB.prepare(
         'DELETE FROM logs WHERE created_at < ?'
       ).bind(Date.now() - 90 * 24 * 60 * 60 * 1000).run();

       await env.DB.prepare('PRAGMA optimize').run();
     }
   };
   ```

---

## Integration with Observability Tools

### Send Metrics to External Monitoring

**Example: Custom metrics to Datadog**:
```typescript
import { D1Database } from '@cloudflare/workers-types';

export default {
  async fetch(request: Request, env: Env) {
    const startTime = Date.now();
    let rowsRead = 0;

    try {
      const result = await env.DB.prepare('SELECT * FROM users WHERE status = ?')
        .bind('active')
        .all();

      rowsRead = result.results.length;

      // Send metrics to Datadog
      await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': env.DATADOG_API_KEY
        },
        body: JSON.stringify({
          series: [{
            metric: 'd1.query.latency',
            points: [[Math.floor(Date.now() / 1000), Date.now() - startTime]],
            type: 'gauge',
            tags: [`database:${env.DB_NAME}`, 'query:select_users']
          }, {
            metric: 'd1.rows.read',
            points: [[Math.floor(Date.now() / 1000), rowsRead]],
            type: 'count',
            tags: [`database:${env.DB_NAME}`, 'query:select_users']
          }]
        })
      });

      return Response.json(result.results);
    } catch (error) {
      // Send error metric
      await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': env.DATADOG_API_KEY
        },
        body: JSON.stringify({
          series: [{
            metric: 'd1.query.errors',
            points: [[Math.floor(Date.now() / 1000), 1]],
            type: 'count',
            tags: [`database:${env.DB_NAME}`, `error:${error.message}`]
          }]
        })
      });

      throw error;
    }
  }
};
```

### Logging Query Performance

**Worker-level logging**:
```typescript
async function logQuery(db: D1Database, query: string, params: any[]) {
  const startTime = Date.now();

  try {
    const result = await db.prepare(query).bind(...params).all();
    const latency = Date.now() - startTime;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      query: query,
      latency_ms: latency,
      rows_returned: result.results.length,
      success: true
    }));

    return result;
  } catch (error) {
    const latency = Date.now() - startTime;

    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      query: query,
      latency_ms: latency,
      error: error.message,
      success: false
    }));

    throw error;
  }
}

// Usage
const users = await logQuery(env.DB, 'SELECT * FROM users WHERE status = ?', ['active']);
```

**View logs**:
```bash
wrangler tail my-worker --format pretty
```

---

## References

- **Official Metrics Documentation**: https://developers.cloudflare.com/d1/observability/metrics-analytics/
- **GraphQL Analytics API**: https://developers.cloudflare.com/analytics/graphql-api/
- **Query Optimization**: `references/query-patterns.md`
- **Limits & Quotas**: `references/limits.md`
- **Best Practices**: `references/best-practices.md`

---

**Questions about metrics?**

1. View dashboard metrics (Cloudflare UI → D1 → Metrics)
2. Run insights for query-level analysis: `wrangler d1 insights <database-name>`
3. Check for inefficient queries (efficiency < 0.1)
4. Add indexes where needed: `CREATE INDEX ...`
5. Monitor weekly with automated audits
