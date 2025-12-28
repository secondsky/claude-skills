# Custom Metrics for Cloudflare Workers

Track business metrics, performance indicators, and custom analytics.

## Metrics Categories

### 1. Request Metrics

```typescript
interface RequestMetrics {
  // Timing
  totalDuration: number;
  dbQueryTime: number;
  externalApiTime: number;
  processingTime: number;

  // Request details
  method: string;
  path: string;
  status: number;

  // Response
  responseSize: number;
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
}
```

### 2. Business Metrics

```typescript
interface BusinessMetrics {
  // User actions
  signups: number;
  logins: number;
  purchases: number;

  // Revenue
  orderValue: number;
  currency: string;

  // Engagement
  pageViews: number;
  apiCalls: number;
}
```

### 3. System Metrics

```typescript
interface SystemMetrics {
  // Resource usage
  cpuTime: number;
  memoryUsed: number;

  // Errors
  errorCount: number;
  errorType: string;

  // Dependencies
  dbConnections: number;
  cacheHitRate: number;
}
```

## Implementation Patterns

### Metrics Collector Class

```typescript
interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

class MetricsCollector {
  private startTime: number;
  private metrics: Map<string, number> = new Map();
  private tags: Map<string, string> = new Map();

  constructor(private env: Env) {
    this.startTime = Date.now();
  }

  // Timing helpers
  startTimer(name: string): () => void {
    const start = Date.now();
    return () => {
      this.metrics.set(`${name}_ms`, Date.now() - start);
    };
  }

  // Counter helpers
  increment(name: string, value: number = 1) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  // Tag helpers
  setTag(name: string, value: string) {
    this.tags.set(name, value);
  }

  // Write to Analytics Engine
  flush() {
    const blobs: string[] = [];
    const doubles: number[] = [];

    // Convert tags to blobs
    this.tags.forEach((value, key) => {
      blobs.push(`${key}:${value}`);
    });

    // Convert metrics to doubles
    this.metrics.forEach((value, key) => {
      doubles.push(value);
    });

    // Add total duration
    doubles.push(Date.now() - this.startTime);

    this.env.ANALYTICS.writeDataPoint({
      blobs: blobs.slice(0, 20),
      doubles: doubles.slice(0, 20),
      indexes: [this.tags.get('path')?.split('/')[1] || 'root'],
    });
  }
}
```

### Usage in Worker

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const metrics = new MetricsCollector(env);
    const url = new URL(request.url);

    // Set tags
    metrics.setTag('method', request.method);
    metrics.setTag('path', url.pathname);
    metrics.setTag('country', (request.cf?.country as string) || 'unknown');

    try {
      // Time database operation
      const stopDbTimer = metrics.startTimer('db');
      const data = await queryDatabase(env);
      stopDbTimer();

      // Time external API
      const stopApiTimer = metrics.startTimer('external_api');
      const enriched = await fetchExternalData(data);
      stopApiTimer();

      // Track business metric
      if (url.pathname === '/api/orders') {
        metrics.increment('orders_created');
        metrics.increment('order_value', enriched.total);
      }

      const response = new Response(JSON.stringify(enriched));
      metrics.setTag('status', String(response.status));
      metrics.increment('response_size', JSON.stringify(enriched).length);

      // Flush metrics after response
      ctx.waitUntil(Promise.resolve(metrics.flush()));

      return response;
    } catch (error) {
      metrics.setTag('status', '500');
      metrics.setTag('error', error.name);
      metrics.increment('errors');
      ctx.waitUntil(Promise.resolve(metrics.flush()));
      throw error;
    }
  }
};
```

## Performance Tracking

### Response Time Percentiles

```typescript
// Worker that tracks detailed timing
async function handleWithTiming(request: Request, env: Env, ctx: ExecutionContext) {
  const timings = {
    start: Date.now(),
    parseComplete: 0,
    authComplete: 0,
    dbComplete: 0,
    processComplete: 0,
    end: 0,
  };

  // Parse request
  const body = await request.json();
  timings.parseComplete = Date.now();

  // Auth check
  await verifyAuth(request.headers);
  timings.authComplete = Date.now();

  // Database query
  const data = await queryDb(env, body);
  timings.dbComplete = Date.now();

  // Process
  const result = processData(data);
  timings.processComplete = Date.now();

  // Respond
  const response = Response.json(result);
  timings.end = Date.now();

  // Write timing breakdown
  ctx.waitUntil(
    Promise.resolve(
      env.ANALYTICS.writeDataPoint({
        blobs: [request.method, new URL(request.url).pathname],
        doubles: [
          timings.parseComplete - timings.start,      // parse_ms
          timings.authComplete - timings.parseComplete, // auth_ms
          timings.dbComplete - timings.authComplete,    // db_ms
          timings.processComplete - timings.dbComplete, // process_ms
          timings.end - timings.processComplete,        // respond_ms
          timings.end - timings.start,                  // total_ms
        ],
        indexes: ['timing'],
      })
    )
  );

  return response;
}
```

### Cache Effectiveness

```typescript
async function fetchWithCache(
  env: Env,
  key: string,
  fetcher: () => Promise<unknown>
): Promise<{ data: unknown; cacheStatus: string }> {
  // Try cache first
  const cached = await env.KV.get(key, 'json');

  if (cached) {
    env.ANALYTICS.writeDataPoint({
      blobs: ['cache', 'HIT'],
      doubles: [1, 0], // hit count, miss count
      indexes: ['cache'],
    });
    return { data: cached, cacheStatus: 'HIT' };
  }

  // Cache miss - fetch and store
  const data = await fetcher();
  await env.KV.put(key, JSON.stringify(data), { expirationTtl: 3600 });

  env.ANALYTICS.writeDataPoint({
    blobs: ['cache', 'MISS'],
    doubles: [0, 1], // hit count, miss count
    indexes: ['cache'],
  });

  return { data, cacheStatus: 'MISS' };
}
```

## Business Metrics Examples

### E-Commerce

```typescript
function trackPurchase(env: Env, order: Order) {
  env.ANALYTICS.writeDataPoint({
    blobs: [
      'purchase',
      order.currency,
      order.paymentMethod,
      order.country,
    ],
    doubles: [
      order.total,
      order.items.length,
      order.discount,
      1, // order count
    ],
    indexes: ['purchase'],
  });
}

function trackCartAbandonment(env: Env, cart: Cart) {
  env.ANALYTICS.writeDataPoint({
    blobs: ['cart_abandoned', cart.userId],
    doubles: [cart.total, cart.items.length, 1],
    indexes: ['cart'],
  });
}
```

### SaaS

```typescript
function trackApiUsage(env: Env, userId: string, endpoint: string) {
  env.ANALYTICS.writeDataPoint({
    blobs: ['api_call', userId, endpoint],
    doubles: [1], // call count
    indexes: ['api_usage'],
  });
}

function trackFeatureUsage(env: Env, feature: string, userId: string) {
  env.ANALYTICS.writeDataPoint({
    blobs: ['feature', feature, userId],
    doubles: [1],
    indexes: ['features'],
  });
}
```

## Querying Custom Metrics

### Response Time Analysis

```sql
-- P50, P95, P99 by endpoint
SELECT
  blob2 as endpoint,
  quantile(0.50)(double6) as p50_ms,
  quantile(0.95)(double6) as p95_ms,
  quantile(0.99)(double6) as p99_ms,
  COUNT(*) as requests
FROM my_metrics
WHERE index1 = 'timing'
  AND timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY endpoint
ORDER BY p99_ms DESC
```

### Business Metrics Dashboard

```sql
-- Hourly revenue
SELECT
  toStartOfHour(timestamp) as hour,
  SUM(double1) as revenue,
  SUM(double4) as orders,
  AVG(double1 / double4) as avg_order_value
FROM my_metrics
WHERE index1 = 'purchase'
  AND timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY hour
ORDER BY hour
```

### Cache Hit Rate

```sql
SELECT
  toStartOfMinute(timestamp) as minute,
  SUM(double1) as hits,
  SUM(double2) as misses,
  SUM(double1) / (SUM(double1) + SUM(double2)) * 100 as hit_rate_pct
FROM my_metrics
WHERE index1 = 'cache'
  AND timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY minute
ORDER BY minute
```

## Best Practices

1. **Define schema upfront** - Document which blob/double index means what
2. **Use consistent naming** - Same blob positions across all writes
3. **Aggregate at write time** - Write counts as 1, then SUM in queries
4. **Use indexes for common filters** - Most-queried dimension as index
5. **Sample high-volume metrics** - 10% sample for request-level, 100% for business
