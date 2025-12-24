# Testing Guide - Cloudflare Cron Triggers

Complete guide for testing scheduled functions locally and in production.

**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Local Testing with Wrangler](#local-testing-with-wrangler) - Test scheduled handlers in development
2. [Triggering Handlers](#trigger-scheduled-handler) - Manually invoke cron handlers
3. [Verifying Output](#verify-handler-output) - Check handler execution and logs
4. [Testing Multiple Crons](#test-multiple-cron-expressions) - Test different schedules
5. [Python Workers Testing](#python-workers-testing) - Special endpoint for Python
6. [Unit Testing](#unit-testing-scheduled-handlers) - Test handler logic
7. [Integration Testing](#integration-testing) - End-to-end testing strategies

---

## Local Testing with Wrangler

Wrangler provides a special flag for testing scheduled functions locally:

```bash
# Start dev server with scheduled testing enabled
bunx wrangler dev --test-scheduled
```

This command:
- Starts local development server
- Exposes `/__scheduled` endpoint for manual triggering
- Allows testing without waiting for actual cron schedule

**Why use `--test-scheduled`?**
- No need to wait for cron schedule (could be hours/days)
- Rapid iteration during development
- Debug handler logic locally before deploying

---

## Trigger Scheduled Handler

Once `wrangler dev --test-scheduled` is running, trigger handlers using curl:

### Basic Trigger

```bash
# Trigger with default cron (if only one configured)
curl "http://localhost:8787/__scheduled"
```

### Trigger with Specific Cron

```bash
# Trigger hourly cron (0 * * * *)
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"

# Trigger every 5 minutes (*/5 * * * *)
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"

# Trigger daily at midnight (0 0 * * *)
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+*"

# Trigger weekly on Monday (0 0 * * 1)
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+1"
```

**CRITICAL URL Encoding:**
- Use `+` instead of spaces in cron expression
- Example: `0 * * * *` becomes `0+*+*+*+*`
- Or use proper URL encoding: `0%20*%20*%20*%20*`

### Using Postman/Insomnia

```
GET http://localhost:8787/__scheduled?cron=0+*+*+*+*
```

No authentication needed in local development.

---

## Verify Handler Output

Watch handler execution in real-time:

### Terminal Setup

**Terminal 1** (Run Wrangler):
```bash
bunx wrangler dev --test-scheduled
```

**Terminal 2** (Trigger Handler):
```bash
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

### Expected Output

**Terminal 1** will show:
```
[wrangler:inf] GET /__scheduled?cron=0+*+*+*+* 200 OK (45ms)
Cron job executed at: 2025-10-23T15:00:00.000Z
Triggered by cron: 0 * * * *
Scheduled task completed successfully
```

**Terminal 2** will show:
```
HTTP/1.1 200 OK
```

### Logging Best Practices

Add detailed logging to your handler for easier debugging:

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log('🕐 Cron triggered:', controller.cron);
    console.log('🕐 Scheduled time:', new Date(controller.scheduledTime).toISOString());
    console.log('🕐 Actual time:', new Date().toISOString());

    try {
      await performTask(env);
      console.log('✅ Task completed successfully');
    } catch (error) {
      console.error('❌ Task failed:', error);
      throw error;
    }
  },
};
```

---

## Test Multiple Cron Expressions

If your Worker has multiple cron triggers, test each one:

```bash
# Test every 5 minutes cron
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"

# Test every 6 hours cron
curl "http://localhost:8787/__scheduled?cron=0+*/6+*+*+*"

# Test daily cron
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+*"

# Test weekly cron
curl "http://localhost:8787/__scheduled?cron=0+0+*+*+1"
```

### Testing Handler Routing

If using `controller.cron` to route execution:

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log('Testing cron:', controller.cron);

    switch (controller.cron) {
      case '*/5 * * * *':
        console.log('✓ Frequent check path');
        break;
      case '0 */6 * * *':
        console.log('✓ Periodic sync path');
        break;
      case '0 0 * * *':
        console.log('✓ Daily report path');
        break;
      default:
        console.warn('✗ Unknown cron:', controller.cron);
    }
  },
};
```

Test each path individually by triggering with specific cron expressions.

---

## Python Workers Testing

Python Workers use a different endpoint for scheduled handler testing:

```bash
# Python Workers endpoint
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=*+*+*+*+*"
```

**Why different endpoint?**
- Python Workers runtime has different internal structure
- Uses Cloudflare-specific handler path

**Python handler example:**

```python
async def on_fetch(request, env):
    return Response("Hello")

async def scheduled(controller, env, ctx):
    print(f"Cron triggered: {controller.cron}")
    # Your scheduled task logic
```

---

## Unit Testing Scheduled Handlers

Test handler logic without network requests:

### Vitest Example

```typescript
// src/index.ts
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await cleanupDatabase(env.DB);
  },
};

export async function cleanupDatabase(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(Date.now())
    .run();
}
```

```typescript
// src/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import { cleanupDatabase } from './index';

describe('scheduled handler', () => {
  it('should clean up expired sessions', async () => {
    // Mock D1 database
    const mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    };

    await cleanupDatabase(mockDB as any);

    expect(mockDB.prepare).toHaveBeenCalledWith(
      'DELETE FROM sessions WHERE expires_at < ?'
    );
  });
});
```

### Jest Example

```typescript
// __tests__/scheduled.test.ts
import { scheduled } from '../src/index';

describe('Cron Handler', () => {
  it('should execute for correct cron expression', async () => {
    const controller = {
      cron: '0 * * * *',
      scheduledTime: Date.now(),
    };

    const env = {
      DB: mockDatabase,
    };

    const ctx = {
      waitUntil: jest.fn(),
    };

    await scheduled(controller, env, ctx);

    expect(ctx.waitUntil).toHaveBeenCalled();
  });
});
```

---

## Integration Testing

Test complete scheduled workflows including bindings:

### Using Miniflare

```typescript
// test/integration.test.ts
import { Miniflare } from 'miniflare';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Scheduled Handler Integration', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    mf = new Miniflare({
      scriptPath: './src/index.ts',
      modules: true,
      d1Databases: ['DB'],
      kvNamespaces: ['KV'],
    });
  });

  afterAll(async () => {
    await mf.dispose();
  });

  it('should execute scheduled handler', async () => {
    // Option 1: Call scheduled method directly on worker
    const scheduledTime = Date.now();
    const response = await mf.getWorker().scheduled({
      scheduledTime,
      cron: '0 * * * *',
    });

    expect(response).toBeDefined();
  });

  it('should execute scheduled handler via HTTP endpoint', async () => {
    // Option 2: Use HTTP endpoint (similar to wrangler dev --test-scheduled)
    const scheduledTime = Date.now();
    const url = new URL('http://localhost:8787/__scheduled');
    url.searchParams.set('time', scheduledTime.toString());
    url.searchParams.set('cron', '0 * * * *');
    
    const response = await mf.fetch(url);
    
    expect(response.ok).toBe(true);
  });
});
```

### Testing with Real Bindings

```typescript
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('Scheduled Handler with Real Bindings', () => {
  it('should access D1 database', async () => {
    const controller = {
      cron: '0 * * * *',
      scheduledTime: Date.now(),
    };

    const ctx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    };

    // Call handler with real env from cloudflare:test
    await scheduled(controller, env, ctx);

    // Verify database was accessed
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM sessions').first();
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Handler executes for each configured cron expression
- [ ] Correct logic runs for each cron (`controller.cron` routing)
- [ ] All bindings (D1, KV, R2, etc.) are accessible
- [ ] Error handling works (try/catch blocks)
- [ ] Logging provides useful debugging information
- [ ] Long-running tasks complete within CPU limits
- [ ] `ctx.waitUntil()` used for non-blocking operations
- [ ] No hardcoded credentials or secrets in code

---

## Debugging Tips

### View Detailed Logs

```bash
# Verbose logging
bunx wrangler dev --test-scheduled --log-level debug
```

### Inspect Controller Object

```typescript
export default {
  async scheduled(controller: ScheduledController): Promise<void> {
    console.log('Controller:', JSON.stringify({
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
      scheduledTimeISO: new Date(controller.scheduledTime).toISOString(),
    }, null, 2));
  },
};
```

### Test with Different Timezones

```typescript
import { DateTime } from 'luxon';

export default {
  async scheduled(controller: ScheduledController): Promise<void> {
    const utc = DateTime.now().setZone('UTC');
    const pacific = DateTime.now().setZone('America/Los_Angeles');
    const tokyo = DateTime.now().setZone('Asia/Tokyo');

    console.log('UTC:', utc.toISO());
    console.log('Pacific:', pacific.toISO());
    console.log('Tokyo:', tokyo.toISO());
  },
};
```

---

## Production Testing

### Tail Logs

Monitor production executions in real-time:

```bash
# Watch all logs
bunx wrangler tail

# Filter for scheduled events
bunx wrangler tail --format json | grep "scheduled"

# Watch specific Worker
bunx wrangler tail my-scheduled-worker
```

### View Dashboard Logs

https://dash.cloudflare.com → Workers & Pages → [Your Worker] → Logs

**Scheduled Execution Events:**
- Trigger time
- Execution duration
- Success/failure status
- Console output

### Test Staging First

Deploy to staging environment before production:

```bash
# Deploy to staging
bunx wrangler deploy --env staging

# Watch staging logs
bunx wrangler tail --env staging

# After verification, deploy to production
bunx wrangler deploy --env production
```

---

**Last Updated**: 2025-11-25
**Official Docs**: https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers
