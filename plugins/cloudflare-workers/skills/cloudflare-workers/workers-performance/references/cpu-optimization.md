# CPU Optimization for Cloudflare Workers

Techniques for staying within CPU time limits and maximizing throughput.

## Understanding CPU Limits

| Plan | CPU Time Limit | Use Case |
|------|----------------|----------|
| Free | 10ms | Simple transformations |
| Paid (Bundled) | 50ms | Complex processing |
| Paid (Unbound) | 30s (soft) | Long-running tasks |

CPU time is **actual execution time**, not wall-clock time. Waiting for I/O doesn't count.

## Profiling CPU Usage

### Basic Timing

```typescript
class CPUProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) throw new Error(`Mark ${startMark} not found`);

    const duration = performance.now() - start;

    const existing = this.measures.get(name) || [];
    existing.push(duration);
    this.measures.set(name, existing);

    return duration;
  }

  getSummary(): Record<string, { count: number; total: number; avg: number; max: number }> {
    const summary: Record<string, { count: number; total: number; avg: number; max: number }> = {};

    for (const [name, times] of this.measures) {
      summary[name] = {
        count: times.length,
        total: times.reduce((a, b) => a + b, 0),
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        max: Math.max(...times),
      };
    }

    return summary;
  }

  reset(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Usage
const profiler = new CPUProfiler();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    profiler.mark('start');

    profiler.mark('parse-start');
    const data = await request.json();
    profiler.measure('parse', 'parse-start');

    profiler.mark('process-start');
    const result = processData(data);
    profiler.measure('process', 'process-start');

    profiler.measure('total', 'start');

    console.log('CPU Profile:', profiler.getSummary());

    return Response.json(result);
  }
};
```

### Async Profiling with Context

```typescript
interface ProfileContext {
  requestId: string;
  timings: Record<string, number>;
}

async function withProfiling<T>(
  ctx: ProfileContext,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    ctx.timings[name] = performance.now() - start;
  }
}

// Usage
const ctx: ProfileContext = {
  requestId: crypto.randomUUID(),
  timings: {},
};

const user = await withProfiling(ctx, 'fetchUser', () =>
  db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
);

const orders = await withProfiling(ctx, 'fetchOrders', () =>
  db.prepare('SELECT * FROM orders WHERE user_id = ?').bind(userId).all()
);

console.log(`[${ctx.requestId}] Timings:`, ctx.timings);
```

## CPU-Intensive Operation Patterns

### Batch Processing

```typescript
// ❌ Bad: Process one at a time
for (const item of items) {
  await processItem(item);
}

// ✅ Good: Process in parallel batches
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
```

### Chunked Processing with Yielding

```typescript
// For very long arrays, yield to event loop
async function processWithYield<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(processor));

    // Yield to event loop every chunk
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

### Memoization

```typescript
// In-request memoization
function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result as ReturnType<T>);
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize((x: number, y: number) => {
  // Expensive computation
  return x ** y;
});
```

## Optimizing Common Operations

### String Operations

```typescript
// ❌ Bad: String concatenation in loop
let result = '';
for (const item of items) {
  result += item.toString() + ',';
}

// ✅ Good: Use array join
const result = items.map(item => item.toString()).join(',');

// ✅ Even better for large strings: Use TextEncoder
const encoder = new TextEncoder();
const parts: Uint8Array[] = items.map(item =>
  encoder.encode(item.toString())
);
```

### JSON Operations

```typescript
// ❌ Bad: Parse then stringify
const obj = JSON.parse(jsonString);
obj.newField = 'value';
const result = JSON.stringify(obj);

// ✅ Good: For simple additions, use string manipulation
const result = jsonString.slice(0, -1) + ',"newField":"value"}';

// ✅ Best: Use streaming for large JSON
import { JSONParser } from '@streamparser/json';

async function processLargeJSON(stream: ReadableStream): Promise<void> {
  const parser = new JSONParser({ paths: ['$.items.*'] });

  parser.onValue = (value, key, parent, stack) => {
    // Process each item as it's parsed
    processItem(value);
  };

  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.write(value);
  }
}
```

### Regular Expressions

```typescript
// ❌ Bad: Create regex in hot path
function findMatches(text: string, pattern: string): string[] {
  const regex = new RegExp(pattern, 'g');
  return text.match(regex) || [];
}

// ✅ Good: Pre-compile regex
const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/g;

function findEmails(text: string): string[] {
  return text.match(EMAIL_REGEX) || [];
}

// ✅ Even better: Use simpler string methods when possible
function containsKeyword(text: string, keyword: string): boolean {
  // indexOf is faster than regex for simple checks
  return text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
}
```

### Object Operations

```typescript
// ❌ Bad: Spread operator for large objects
const merged = { ...largeObj1, ...largeObj2 };

// ✅ Good: Object.assign for mutation
const result = Object.assign({}, largeObj1, largeObj2);

// ✅ Even better: Mutate if original not needed
Object.assign(largeObj1, largeObj2);

// ❌ Bad: Object.keys().forEach for iteration
Object.keys(obj).forEach(key => {
  process(obj[key]);
});

// ✅ Good: for...in with hasOwnProperty
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    process(obj[key]);
  }
}
```

## Avoiding CPU Spikes

### Spread Operations Out

```typescript
// ❌ Bad: All at once
const results = await Promise.all(
  thousandsOfItems.map(async item => heavyProcessing(item))
);

// ✅ Good: Rate-limited processing
async function rateLimitedProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = processor(item).then(result => {
      results.push(result);
    });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(e => e === p),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
```

### Early Returns

```typescript
// ❌ Bad: Process everything then filter
const processed = items.map(item => expensiveTransform(item));
const filtered = processed.filter(item => item.isValid);

// ✅ Good: Filter first, then process
const valid = items.filter(item => quickValidation(item));
const processed = valid.map(item => expensiveTransform(item));

// ✅ Even better: Short-circuit when possible
function processUntilLimit(items: Item[], limit: number): Result[] {
  const results: Result[] = [];

  for (const item of items) {
    if (results.length >= limit) break;

    const result = process(item);
    if (result.isValid) {
      results.push(result);
    }
  }

  return results;
}
```

## CPU Time Monitoring

### Add Timing Headers

```typescript
function addTimingHeaders(response: Response, timings: Record<string, number>): Response {
  const newResponse = new Response(response.body, response);

  // Server-Timing header for DevTools
  const serverTiming = Object.entries(timings)
    .map(([name, duration]) => `${name};dur=${duration}`)
    .join(', ');

  newResponse.headers.set('Server-Timing', serverTiming);

  return newResponse;
}
```

### Logging Slow Requests

```typescript
const SLOW_THRESHOLD_MS = 20;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = performance.now();

    try {
      return await handleRequest(request, env);
    } finally {
      const duration = performance.now() - start;

      if (duration > SLOW_THRESHOLD_MS) {
        console.warn('Slow request:', {
          url: request.url,
          method: request.method,
          duration: `${duration.toFixed(2)}ms`,
        });
      }
    }
  }
};
```
