# Structured Logging for Cloudflare Workers

Comprehensive guide for implementing production-grade logging in Workers.

## Log Levels

| Level | Use Case | Production Behavior |
|-------|----------|---------------------|
| `debug` | Development details | Disabled in production |
| `info` | Normal operations | Sampled in high-traffic |
| `warn` | Recoverable issues | Always captured |
| `error` | Failures requiring attention | Always captured + alerted |

## Logging Best Practices

### 1. Always Use Structured JSON

```typescript
// ❌ Bad: Plain text
console.log(`User ${userId} logged in from ${ip}`);

// ✅ Good: Structured JSON
console.log(JSON.stringify({
  level: 'info',
  event: 'user_login',
  userId,
  ip,
  timestamp: Date.now()
}));
```

### 2. Include Request Context

```typescript
// Add request ID to correlate logs
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID();

    console.log(JSON.stringify({
      requestId,
      event: 'request_start',
      method: request.method,
      url: request.url,
      cf: request.cf // Cloudflare request metadata
    }));

    // Pass requestId to all functions
    return handleRequest(request, env, requestId);
  }
};
```

### 3. Redact Sensitive Data

```typescript
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /api[_-]?key/i,
  /credit[_-]?card/i,
  /ssn/i,
];

function redactSensitive(obj: object): object {
  const redacted = { ...obj };

  for (const [key, value] of Object.entries(redacted)) {
    if (SENSITIVE_PATTERNS.some(p => p.test(key))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    }
  }

  return redacted;
}
```

### 4. Implement Log Sampling

```typescript
class SampledLogger {
  constructor(
    private sampleRate: number = 0.1, // 10% sampling
    private alwaysLogLevels: string[] = ['error', 'warn']
  ) {}

  log(level: string, message: string, data?: object) {
    // Always log errors and warnings
    if (this.alwaysLogLevels.includes(level)) {
      this.write(level, message, data);
      return;
    }

    // Sample other logs
    if (Math.random() < this.sampleRate) {
      this.write(level, message, { ...data, sampled: true });
    }
  }

  private write(level: string, message: string, data?: object) {
    console.log(JSON.stringify({
      level,
      message,
      ...data,
      timestamp: Date.now()
    }));
  }
}
```

## Production Logger Class

```typescript
interface LoggerOptions {
  service: string;
  environment: string;
  sampleRate?: number;
  redactPatterns?: RegExp[];
}

export class ProductionLogger {
  private requestId: string;
  private options: Required<LoggerOptions>;
  private startTime: number;

  constructor(requestId: string, options: LoggerOptions) {
    this.requestId = requestId;
    this.startTime = Date.now();
    this.options = {
      sampleRate: 1,
      redactPatterns: [],
      ...options
    };
  }

  private shouldLog(level: string): boolean {
    if (['error', 'warn'].includes(level)) return true;
    return Math.random() < this.options.sampleRate;
  }

  private format(level: string, message: string, data?: object) {
    return JSON.stringify({
      level,
      message,
      requestId: this.requestId,
      service: this.options.service,
      environment: this.options.environment,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.startTime,
      ...this.redact(data || {})
    });
  }

  private redact(data: object): object {
    const result = { ...data };
    for (const [key, value] of Object.entries(result)) {
      if (this.options.redactPatterns.some(p => p.test(key))) {
        result[key] = '[REDACTED]';
      }
    }
    return result;
  }

  debug(message: string, data?: object) {
    if (this.options.environment === 'development') {
      console.log(this.format('debug', message, data));
    }
  }

  info(message: string, data?: object) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, data));
    }
  }

  warn(message: string, data?: object) {
    console.warn(this.format('warn', message, data));
  }

  error(message: string, error?: Error, data?: object) {
    console.error(this.format('error', message, {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }));
  }

  // Log request completion with timing
  complete(status: number, data?: object) {
    this.info('request_complete', {
      ...data,
      status,
      duration: Date.now() - this.startTime
    });
  }
}
```

## Request Logging Middleware

```typescript
type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

export function withLogging(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const logger = new ProductionLogger(
      request.headers.get('cf-ray') || crypto.randomUUID(),
      {
        service: 'my-worker',
        environment: env.ENVIRONMENT || 'production',
        sampleRate: 0.1,
        redactPatterns: [/password/i, /token/i, /secret/i]
      }
    );

    const url = new URL(request.url);

    logger.info('request_start', {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: request.headers.get('user-agent'),
      country: request.cf?.country,
      colo: request.cf?.colo
    });

    try {
      const response = await handler(request, env, ctx);

      logger.complete(response.status, {
        contentType: response.headers.get('content-type')
      });

      return response;
    } catch (error) {
      logger.error('request_failed', error as Error);
      throw error;
    }
  };
}

// Usage
export default {
  fetch: withLogging(async (request, env, ctx) => {
    // Handler logic
    return new Response('OK');
  })
};
```

## Wrangler Logging Configuration

**wrangler.jsonc**:
```jsonc
{
  "name": "my-worker",
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1 // 1 = all requests, 0.1 = 10%
  }
}
```

## Viewing Logs

### Wrangler Tail (Real-time)

```bash
# All logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST

# Filter by search term
wrangler tail --search "user_login"

# JSON format
wrangler tail --format json
```

### Dashboard

1. Go to Workers & Pages in Cloudflare Dashboard
2. Select your worker
3. Click "Logs" tab
4. Use filters for time range, status, search

## Log Size Limits

- **Single log entry**: 128 KB max
- **Total per request**: No hard limit, but affects performance
- **Recommendation**: Keep entries under 10 KB

```typescript
// Handle large payloads
function logLargePayload(logger: ProductionLogger, payload: object) {
  const json = JSON.stringify(payload);

  if (json.length > 10000) {
    // Log summary instead
    logger.info('large_payload', {
      size: json.length,
      keys: Object.keys(payload),
      preview: json.substring(0, 500)
    });
  } else {
    logger.info('payload', payload);
  }
}
```

## Troubleshooting

### Logs Not Appearing

1. Verify `observability.enabled: true` in wrangler.jsonc
2. Check sampling rate isn't 0
3. Ensure using `console.log/error/warn` (not custom transport)
4. Wait 1-2 minutes for log propagation

### Log Truncation

- Single entry limit: 128 KB
- Solution: Chunk large payloads or use external logging

### Missing Correlation

- Always include `requestId` in every log entry
- Use `cf-ray` header when available
- Pass context through function calls
