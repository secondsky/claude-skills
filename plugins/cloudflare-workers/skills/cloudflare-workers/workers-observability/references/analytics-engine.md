# Analytics Engine for Cloudflare Workers

Build custom analytics and metrics dashboards with Workers Analytics Engine.

## Overview

Analytics Engine is a time-series database built into Workers:
- **Write** from any Worker with zero latency impact
- **Query** via SQL API or GraphQL
- **Aggregate** automatically (no manual rollups)
- **Retain** data for 90 days

## Configuration

**wrangler.jsonc**:
```jsonc
{
  "name": "my-worker",
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "my_worker_metrics"
    }
  ]
}
```

## Writing Data Points

```typescript
interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

// Basic write
env.ANALYTICS.writeDataPoint({
  blobs: ['GET', '/api/users', '200'],  // Strings (up to 20)
  doubles: [150, 1024],                  // Numbers (up to 20)
  indexes: ['api']                       // Fast query indexes (up to 1)
});
```

### Data Point Structure

| Field | Type | Count | Use Case |
|-------|------|-------|----------|
| `blobs` | string[] | 0-20 | Categorical data (method, path, status) |
| `doubles` | number[] | 0-20 | Numeric data (latency, size, count) |
| `indexes` | string[] | 0-1 | Fast filtering (most common query dimension) |

### Best Practices

```typescript
// ✅ Good: Consistent schema across all writes
env.ANALYTICS.writeDataPoint({
  blobs: [
    request.method,           // blob1: HTTP method
    url.pathname,             // blob2: Path
    String(response.status),  // blob3: Status code
    request.cf?.country || 'unknown', // blob4: Country
    request.cf?.colo || 'unknown'     // blob5: Colo
  ],
  doubles: [
    Date.now() - startTime,   // double1: Response time (ms)
    responseSize,             // double2: Response size (bytes)
    1                         // double3: Request count (for SUM)
  ],
  indexes: [url.pathname.split('/')[1] || 'root']
});

// ❌ Bad: Inconsistent schema
// Different writes with different blob meanings
```

## Complete Metrics Example

```typescript
interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

interface RequestMetrics {
  method: string;
  path: string;
  status: number;
  duration: number;
  responseSize: number;
  country: string;
  error?: string;
}

function writeMetrics(env: Env, metrics: RequestMetrics) {
  env.ANALYTICS.writeDataPoint({
    blobs: [
      metrics.method,
      metrics.path,
      String(metrics.status),
      metrics.country,
      metrics.error || ''
    ],
    doubles: [
      metrics.duration,
      metrics.responseSize,
      1, // count for aggregation
      metrics.status >= 400 ? 1 : 0, // error count
      metrics.status >= 500 ? 1 : 0  // server error count
    ],
    indexes: [metrics.status >= 400 ? 'error' : 'success']
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const start = Date.now();
    const url = new URL(request.url);

    try {
      const response = await handleRequest(request, env);
      const body = await response.clone().arrayBuffer();

      ctx.waitUntil(
        Promise.resolve(writeMetrics(env, {
          method: request.method,
          path: url.pathname,
          status: response.status,
          duration: Date.now() - start,
          responseSize: body.byteLength,
          country: (request.cf?.country as string) || 'unknown'
        }))
      );

      return response;
    } catch (error) {
      writeMetrics(env, {
        method: request.method,
        path: url.pathname,
        status: 500,
        duration: Date.now() - start,
        responseSize: 0,
        country: (request.cf?.country as string) || 'unknown',
        error: error.message
      });

      throw error;
    }
  }
};
```

## Querying Data

### SQL API

```bash
# Query via API
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT blob1 as method, COUNT(*) as requests, AVG(double1) as avg_latency FROM my_worker_metrics WHERE timestamp > NOW() - INTERVAL '\''1'\'' HOUR GROUP BY blob1"
  }'
```

### Common Queries

**Request count by status**:
```sql
SELECT
  blob3 as status,
  COUNT(*) as requests
FROM my_worker_metrics
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY blob3
ORDER BY requests DESC
```

**Average latency by path**:
```sql
SELECT
  blob2 as path,
  AVG(double1) as avg_latency_ms,
  MAX(double1) as max_latency_ms,
  COUNT(*) as requests
FROM my_worker_metrics
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY blob2
ORDER BY avg_latency_ms DESC
LIMIT 10
```

**Error rate over time**:
```sql
SELECT
  toStartOfMinute(timestamp) as minute,
  SUM(double4) / SUM(double3) * 100 as error_rate_pct,
  SUM(double3) as total_requests
FROM my_worker_metrics
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY minute
ORDER BY minute
```

**Geographic distribution**:
```sql
SELECT
  blob4 as country,
  COUNT(*) as requests,
  AVG(double1) as avg_latency_ms
FROM my_worker_metrics
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY country
ORDER BY requests DESC
LIMIT 20
```

**P99 latency**:
```sql
SELECT
  blob2 as path,
  quantile(0.99)(double1) as p99_latency_ms,
  quantile(0.95)(double1) as p95_latency_ms,
  quantile(0.50)(double1) as p50_latency_ms
FROM my_worker_metrics
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY path
ORDER BY p99_latency_ms DESC
```

## Building Dashboards

### Grafana Integration

```typescript
// Worker endpoint for Grafana JSON datasource
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/query') {
      const body = await request.json();
      const results = await queryAnalytics(env, body.targets);
      return Response.json(results);
    }

    return new Response('Analytics API', { status: 200 });
  }
};

async function queryAnalytics(env: Env, targets: any[]) {
  // Transform Grafana targets to Analytics Engine queries
  // Return data in Grafana format
}
```

### Custom Dashboard Worker

```typescript
// Simple HTML dashboard
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const metrics = await getMetrics(env);

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Worker Metrics</title></head>
        <body>
          <h1>Last Hour Metrics</h1>
          <ul>
            <li>Total Requests: ${metrics.totalRequests}</li>
            <li>Error Rate: ${metrics.errorRate.toFixed(2)}%</li>
            <li>Avg Latency: ${metrics.avgLatency.toFixed(0)}ms</li>
            <li>P99 Latency: ${metrics.p99Latency.toFixed(0)}ms</li>
          </ul>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
```

## Limits and Quotas

| Limit | Value |
|-------|-------|
| Writes per request | Unlimited |
| Blobs per data point | 20 |
| Doubles per data point | 20 |
| Indexes per data point | 1 |
| Data retention | 90 days |
| Query timeout | 10 seconds |
| Query result limit | 10,000 rows |

## Cost Optimization

1. **Use indexes wisely** - Only index the most-queried dimension
2. **Aggregate at write** - Write `count: 1` and SUM instead of counting rows
3. **Sample high-volume** - Write 10% of requests for patterns, 100% for errors
4. **Batch writes** - Use `ctx.waitUntil()` to not block responses
