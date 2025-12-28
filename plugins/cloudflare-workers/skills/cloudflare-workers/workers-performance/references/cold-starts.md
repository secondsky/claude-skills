# Cold Start Optimization for Cloudflare Workers

Techniques for minimizing cold start latency and improving first-request performance.

## Understanding Cold Starts

Cold starts occur when:
1. First request to a new colo (data center)
2. Worker hasn't been used recently
3. After deployment
4. Isolate recycling due to memory pressure

### Cold Start Anatomy

```
Request → DNS → Edge → Isolate Creation → V8 Initialization → Module Evaluation → Handler Execution
                       └─────────────────── Cold Start Time ───────────────────┘
```

Typical cold start: 5-50ms depending on bundle size and initialization.

## Measuring Cold Starts

### Server-Timing Header

```typescript
let isWarm = false;

export default {
  async fetch(request: Request): Promise<Response> {
    const start = performance.now();
    const wasCold = !isWarm;
    isWarm = true;

    const response = await handleRequest(request);

    // Add timing info
    const newResponse = new Response(response.body, response);
    const handlerTime = performance.now() - start;

    newResponse.headers.set(
      'Server-Timing',
      `handler;dur=${handlerTime.toFixed(2)}, cold;desc="${wasCold}"`
    );

    return newResponse;
  }
};
```

### Cold Start Logging

```typescript
interface StartupMetrics {
  isCold: boolean;
  startupTime?: number;
  moduleLoadTime?: number;
}

const moduleLoadStart = Date.now();

// Track module initialization
const moduleLoadTime = Date.now() - moduleLoadStart;
let isolateStartTime: number | undefined;
let isFirstRequest = true;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestStart = Date.now();
    const metrics: StartupMetrics = { isCold: false };

    if (isFirstRequest) {
      isFirstRequest = false;
      isolateStartTime = requestStart;
      metrics.isCold = true;
      metrics.moduleLoadTime = moduleLoadTime;
    }

    const response = await handleRequest(request, env);

    if (metrics.isCold) {
      metrics.startupTime = Date.now() - requestStart;
      console.log('Cold start metrics:', metrics);
    }

    return response;
  }
};
```

## Reducing Cold Start Time

### Minimize Top-Level Code

```typescript
// ❌ Bad: Heavy initialization at module load
import { parse } from 'yaml';
import { readFileSync } from 'fs';

const config = parse(readFileSync('./config.yaml', 'utf8'));
const cache = new Map(Object.entries(config.cache));
const validators = Object.keys(config.routes).map(createValidator);

// ✅ Good: Lazy initialization
let config: Config | undefined;
let cache: Map<string, unknown> | undefined;
let validators: Validator[] | undefined;

function getConfig(): Config {
  if (!config) {
    config = JSON.parse(CONFIG_JSON); // Use JSON instead of YAML
  }
  return config;
}

function getCache(): Map<string, unknown> {
  if (!cache) {
    cache = new Map();
  }
  return cache;
}
```

### Defer Heavy Imports

```typescript
// ❌ Bad: Import at top level
import { createCanvas, Image } from 'canvas';
import sharp from 'sharp';

// ✅ Good: Import when needed
let sharp: typeof import('sharp') | undefined;

async function processImage(input: ArrayBuffer): Promise<ArrayBuffer> {
  if (!sharp) {
    sharp = await import('sharp');
  }

  return sharp.default(input)
    .resize(800, 600)
    .toBuffer();
}
```

### Singleton Pattern for Expensive Objects

```typescript
// Lazy singleton pattern
class DatabaseConnection {
  private static instance: DatabaseConnection | undefined;

  private constructor(private db: D1Database) {}

  static getInstance(db: D1Database): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(db);
    }
    return DatabaseConnection.instance;
  }

  async query(sql: string, params: unknown[]): Promise<unknown[]> {
    return this.db.prepare(sql).bind(...params).all();
  }
}
```

### Avoid Synchronous Operations

```typescript
// ❌ Bad: Sync operations block startup
const data = JSON.parse(largeJsonString); // Blocks
const sorted = data.sort((a, b) => a.name.localeCompare(b.name)); // Blocks

// ✅ Good: Async initialization
let sortedData: Data[] | undefined;

async function getSortedData(): Promise<Data[]> {
  if (!sortedData) {
    // Parse and sort on first request, not module load
    const data = JSON.parse(largeJsonString);
    sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sortedData;
}
```

## Bundle Size Impact

### Size vs Cold Start Time

| Bundle Size | Typical Cold Start |
|-------------|-------------------|
| < 100 KB | 5-10ms |
| 100-500 KB | 10-20ms |
| 500 KB - 1 MB | 20-40ms |
| > 1 MB | 40-100ms+ |

### Minimize Bundle

```typescript
// esbuild.config.ts
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  treeShaking: true,
  format: 'esm',
  target: 'es2022',
  drop: ['console', 'debugger'],
  mangleProps: /^_/, // Mangle private properties
  outfile: 'dist/index.js',
});
```

## Warming Strategies

### Cron-Based Warming

```typescript
// Keep worker warm with scheduled requests
export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Called by cron trigger every 5 minutes
    // Just accessing the worker keeps it warm

    // Optionally pre-warm caches
    ctx.waitUntil(prewarmCaches(env));
  },
};

// wrangler.jsonc
// "triggers": {
//   "crons": ["*/5 * * * *"]  // Every 5 minutes
// }
```

### Service Binding Warming

```typescript
// From main worker, periodically call dependent workers
async function warmServices(env: Env): Promise<void> {
  await Promise.all([
    env.AUTH_SERVICE.fetch(new Request('http://internal/health')),
    env.DATA_SERVICE.fetch(new Request('http://internal/health')),
    env.CACHE_SERVICE.fetch(new Request('http://internal/health')),
  ]);
}
```

### Multi-Colo Warming

```typescript
// Warm worker in multiple colos
async function warmGlobally(workerUrl: string, locations: string[]): Promise<void> {
  // Use Cloudflare Durable Objects or external service
  // to make requests from different regions

  for (const location of locations) {
    // Request through specific colo
    await fetch(workerUrl, {
      headers: {
        'CF-Preferred-Colo': location, // Not a real header - illustration only
      },
    });
  }
}
```

## Isolate Reuse

### Global State Considerations

```typescript
// Global state persists across requests in the same isolate
let requestCount = 0;
let lastRequestTime = 0;

export default {
  async fetch(request: Request): Promise<Response> {
    requestCount++;
    lastRequestTime = Date.now();

    // ⚠️ Be careful with global state
    // - Don't store request-specific data
    // - Don't store sensitive information
    // - Do use for caching and connection pooling

    return handleRequest(request);
  }
};
```

### Connection Pooling

```typescript
// Reuse connections across requests
let dbConnection: DatabaseConnection | undefined;

function getConnection(env: Env): DatabaseConnection {
  if (!dbConnection) {
    dbConnection = new DatabaseConnection(env.DB);
  }
  return dbConnection;
}

// Will be reused for subsequent requests in same isolate
```

## Preloading

### Preload Common Data

```typescript
// Preload data likely to be needed
let commonData: CommonData | undefined;

async function preload(env: Env): Promise<void> {
  if (!commonData) {
    // Load common data once per isolate
    commonData = {
      config: await env.KV.get('config', 'json'),
      translations: await env.KV.get('translations', 'json'),
      routes: await env.KV.get('routes', 'json'),
    };
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Preload in background on first request
    ctx.waitUntil(preload(env));

    return handleRequest(request, env);
  }
};
```

### Speculative Preloading

```typescript
// Predict and preload based on request patterns
const prefetchMap = new Map<string, string[]>([
  ['/products', ['/api/categories', '/api/featured']],
  ['/checkout', ['/api/payment-methods', '/api/shipping']],
]);

async function speculativePrefetch(
  path: string,
  env: Env
): Promise<void> {
  const toPrefetch = prefetchMap.get(path);
  if (!toPrefetch) return;

  await Promise.all(
    toPrefetch.map(async (url) => {
      // Prefetch and cache
      const response = await fetch(url);
      await caches.default.put(new Request(url), response);
    })
  );
}
```

## Monitoring Cold Starts

### Analytics Engine Tracking

```typescript
interface ColdStartMetric {
  timestamp: number;
  isCold: boolean;
  startupMs: number;
  bundleSize: number;
  colo: string;
}

function trackColdStart(
  analytics: AnalyticsEngineDataset,
  metrics: ColdStartMetric
): void {
  analytics.writeDataPoint({
    indexes: [metrics.colo],
    blobs: [metrics.isCold ? 'cold' : 'warm'],
    doubles: [metrics.startupMs, metrics.bundleSize],
  });
}

// Query cold start metrics
// SELECT
//   blob1 as start_type,
//   AVG(double1) as avg_startup_ms,
//   COUNT(*) as count
// FROM worker_cold_starts
// WHERE timestamp > now() - interval '1' hour
// GROUP BY start_type
```
