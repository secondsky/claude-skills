# Debugging Tools for Cloudflare Workers

Techniques and tools for debugging Workers locally and in production.

## Console Logging

### Structured Logging

```typescript
interface LogContext {
  requestId: string;
  method: string;
  path: string;
  [key: string]: unknown;
}

function log(level: string, message: string, ctx: LogContext) {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: Date.now(),
    ...ctx,
  }));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);

    const ctx: LogContext = {
      requestId,
      method: request.method,
      path: url.pathname,
    };

    log('info', 'Request received', ctx);

    try {
      const response = await handleRequest(request, env);
      log('info', 'Request completed', { ...ctx, status: response.status });
      return response;
    } catch (error) {
      log('error', 'Request failed', {
        ...ctx,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }
};
```

### Conditional Logging

```typescript
interface Env {
  ENVIRONMENT: string;
  DEBUG: string;
}

function createLogger(env: Env) {
  const isDebug = env.DEBUG === 'true' || env.ENVIRONMENT === 'development';

  return {
    debug: (...args: unknown[]) => {
      if (isDebug) console.log('[DEBUG]', ...args);
    },
    info: (...args: unknown[]) => console.log('[INFO]', ...args),
    warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  };
}
```

## Wrangler Tail

Real-time logs from deployed workers:

```bash
# Basic tail
bunx wrangler tail

# Filter by status
bunx wrangler tail --status error
bunx wrangler tail --status ok

# Filter by method
bunx wrangler tail --method POST

# Filter by path
bunx wrangler tail --search "/api/users"

# JSON output for parsing
bunx wrangler tail --format json

# Specific environment
bunx wrangler tail --env production

# With IP addresses
bunx wrangler tail --ip
```

### Parsing Tail Output

```bash
# Filter errors with jq
bunx wrangler tail --format json | jq 'select(.outcome == "exception")'

# Count by status
bunx wrangler tail --format json | jq '.event.response.status' | sort | uniq -c

# Save to file
bunx wrangler tail --format json > logs.json
```

## Chrome DevTools

### Enable Inspector

```bash
# Start with inspector enabled
bunx wrangler dev --inspector-port 9229
```

### Connect Chrome DevTools

1. Open `chrome://inspect` in Chrome
2. Click "Configure..." and add `localhost:9229`
3. Click "inspect" on your worker
4. Use Sources tab for breakpoints

### VS Code Debugging

**.vscode/launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Worker",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "sourceMaps": true,
      "resolveSourceMapLocations": [
        "${workspaceFolder}/**"
      ]
    }
  ]
}
```

Then:
1. Run `bunx wrangler dev --inspector-port 9229`
2. Press F5 in VS Code
3. Set breakpoints in your code

## Error Tracking

### Error Boundary Pattern

```typescript
async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: object
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      },
      context,
      timestamp: Date.now(),
    }));

    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return withErrorTracking(
      () => handleRequest(request, env),
      {
        url: request.url,
        method: request.method,
      }
    );
  }
};
```

### External Error Tracking

```typescript
// Sentry integration example
async function reportToSentry(error: Error, context: object): Promise<void> {
  await fetch('https://sentry.io/api/xxx/envelope/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
    },
    body: JSON.stringify({
      event_id: crypto.randomUUID(),
      exception: {
        values: [{
          type: error.name,
          value: error.message,
          stacktrace: error.stack,
        }],
      },
      extra: context,
    }),
  });
}
```

## Request/Response Debugging

### Request Inspector

```typescript
function inspectRequest(request: Request): object {
  return {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    cf: request.cf, // Cloudflare-specific info
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('Request:', JSON.stringify(inspectRequest(request), null, 2));

    const response = await handleRequest(request, env);

    console.log('Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers),
    });

    return response;
  }
};
```

### Response Timing

```typescript
async function timeRequest<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[TIMING] ${name}: ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.log(`[TIMING] ${name}: ${Date.now() - start}ms (failed)`);
    throw error;
  }
}

// Usage
const data = await timeRequest('database', () => db.query('SELECT...'));
const external = await timeRequest('api', () => fetch('https://api.com'));
```

## Memory Debugging

### Heap Usage (Development)

```typescript
// Check memory in development
if (typeof process !== 'undefined' && process.memoryUsage) {
  const usage = process.memoryUsage();
  console.log('Memory:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
  });
}
```

### Large Object Detection

```typescript
function estimateSize(obj: unknown): number {
  const seen = new WeakSet();

  function size(value: unknown): number {
    if (value === null) return 4;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'number') return 8;
    if (typeof value === 'string') return value.length * 2;

    if (typeof value === 'object') {
      if (seen.has(value)) return 0;
      seen.add(value);

      if (Array.isArray(value)) {
        return value.reduce((acc, item) => acc + size(item), 0);
      }

      return Object.entries(value).reduce(
        (acc, [key, val]) => acc + key.length * 2 + size(val),
        0
      );
    }

    return 0;
  }

  return size(obj);
}

// Warn if object is large
function checkSize(name: string, obj: unknown, maxKB: number = 100): void {
  const sizeKB = estimateSize(obj) / 1024;
  if (sizeKB > maxKB) {
    console.warn(`[MEMORY] ${name} is ${sizeKB.toFixed(1)}KB (limit: ${maxKB}KB)`);
  }
}
```

## Performance Profiling

### Request Timing

```typescript
class Timer {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) throw new Error(`Mark ${startMark} not found`);
    return Date.now() - start;
  }

  getTimings(): object {
    const entries: Record<string, number> = {};
    let previous = 0;

    for (const [name, time] of this.marks) {
      entries[name] = previous ? time - previous : 0;
      previous = time;
    }

    return entries;
  }
}

// Usage
const timer = new Timer();
timer.mark('start');

await step1();
timer.mark('step1');

await step2();
timer.mark('step2');

console.log('Timings:', timer.getTimings());
```

## Debug Headers

Add debug info to responses:

```typescript
function addDebugHeaders(
  response: Response,
  debug: object
): Response {
  const newResponse = new Response(response.body, response);

  // Only add in development
  if (process.env.NODE_ENV === 'development') {
    newResponse.headers.set('X-Debug', JSON.stringify(debug));
  }

  return newResponse;
}
```

## Troubleshooting Checklist

1. **Check console output** - `wrangler tail` or dev server logs
2. **Verify bindings** - Ensure all bindings are configured
3. **Check compatibility date** - May affect runtime behavior
4. **Inspect request/response** - Log full request details
5. **Use debugger** - Chrome DevTools or VS Code
6. **Check external services** - Time and log external calls
7. **Verify secrets** - Ensure secrets are set for environment
