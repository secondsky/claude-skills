# Integration Patterns - Cloudflare Cron Triggers

Production-ready patterns for implementing scheduled tasks in Cloudflare Workers.

**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Standalone Scheduled Worker](#1-standalone-scheduled-worker) - Workers that only run on schedule
2. [Combined with Hono](#2-combined-with-hono-fetch--scheduled) - HTTP endpoints + scheduled tasks
3. [Multiple Cron Triggers](#3-multiple-cron-triggers) - Different schedules for different tasks
4. [Accessing Environment Bindings](#4-accessing-environment-bindings) - Use D1, KV, R2, AI, Workflows
5. [Combining with Workflows](#5-combining-with-workflows) - Trigger complex multi-step workflows
6. [Error Handling](#6-error-handling-in-scheduled-handlers) - Retry logic, alerting, monitoring

---

## 1. Standalone Scheduled Worker

**Best for:** Workers that only run on schedule (no HTTP requests)

```typescript
// src/index.ts
interface Env {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Running scheduled maintenance...');

    // Database cleanup
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
      .bind(Date.now())
      .run();

    // Generate daily report
    const report = await generateDailyReport(env.DB);

    // Upload to R2
    await env.MY_BUCKET.put(
      `reports/${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report)
    );

    console.log('Maintenance complete');
  },
};
```

**Key Points:**
- Simple pattern for background tasks
- No fetch handler needed
- Access all environment bindings
- Use `console.log()` for monitoring

---

## 2. Combined with Hono (Fetch + Scheduled)

**Best for:** Workers that handle both HTTP requests and scheduled tasks

```typescript
// src/index.ts
import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Regular HTTP routes
app.get('/', (c) => c.text('Worker is running'));

app.get('/api/stats', async (c) => {
  const stats = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  return c.json(stats);
});

// Export both fetch handler and scheduled handler
export default {
  // Handle HTTP requests
  fetch: app.fetch,

  // Handle cron triggers
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron triggered:', controller.cron);

    // Run scheduled task
    await updateCache(env.DB);

    // Log completion
    ctx.waitUntil(logExecution(controller.scheduledTime));
  },
};
```

**Why this pattern:**
- One Worker handles both use cases
- Share environment bindings
- Reduce number of Workers to manage
- Lower costs (one Worker subscription)

---

## 3. Multiple Cron Triggers

**Best for:** Different schedules for different tasks

**wrangler.jsonc:**

```jsonc
{
  "triggers": {
    "crons": [
      "*/5 * * * *",    // Every 5 minutes
      "0 */6 * * *",    // Every 6 hours
      "0 0 * * *"       // Daily at midnight UTC
    ]
  }
}
```

**src/index.ts:**

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Route based on which cron triggered this execution
    switch (controller.cron) {
      case '*/5 * * * *':
        // Every 5 minutes: Check system health
        await checkSystemHealth(env);
        break;

      case '0 */6 * * *':
        // Every 6 hours: Sync data from external API
        await syncExternalData(env);
        break;

      case '0 0 * * *':
        // Daily at midnight: Generate reports and cleanup
        await generateDailyReports(env);
        await cleanupOldData(env);
        break;

      default:
        console.warn(`Unknown cron trigger: ${controller.cron}`);
    }
  },
};
```

**CRITICAL:**
- Use exact cron expression match (whitespace sensitive)
- Maximum 3 cron triggers per Worker (Free plan)
- Standard/Paid plan supports more (check limits)

---

## 4. Accessing Environment Bindings

**All Worker bindings available in scheduled handler:**

```typescript
interface Env {
  // Databases
  DB: D1Database;

  // Storage
  MY_BUCKET: R2Bucket;
  KV_NAMESPACE: KVNamespace;

  // AI & Vectors
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Queues & Workflows
  MY_QUEUE: Queue;
  MY_WORKFLOW: Workflow;

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;

  // Secrets
  API_KEY: string;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // D1 Database
    const users = await env.DB.prepare('SELECT * FROM users WHERE active = 1').all();

    // R2 Storage
    const file = await env.MY_BUCKET.get('data.json');

    // KV Storage
    const config = await env.KV_NAMESPACE.get('config', 'json');

    // Workers AI
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: 'Summarize today\'s data',
    });

    // Send to Queue
    await env.MY_QUEUE.send({ type: 'process', data: users.results });

    // Trigger Workflow
    await env.MY_WORKFLOW.create({ params: { timestamp: Date.now() } });

    // Use secrets
    await fetch('https://api.example.com/webhook', {
      headers: { Authorization: `Bearer ${env.API_KEY}` },
    });
  },
};
```

**Available Bindings:**
- **D1 Database** - SQL queries, transactions
- **R2 Storage** - Object storage (files, backups)
- **KV Namespace** - Key-value storage
- **Workers AI** - Run AI models
- **Vectorize** - Vector search
- **Queues** - Send messages to queues
- **Workflows** - Trigger long-running workflows
- **Durable Objects** - Stateful coordination
- **Secrets** - Environment variables

---

## 5. Combining with Workflows

**Best for:** Multi-step, long-running tasks triggered on schedule

**wrangler.jsonc:**

```jsonc
{
  "triggers": {
    "crons": ["0 2 * * *"]  // Daily at 2am UTC
  },
  "workflows": [
    {
      "name": "daily-report-workflow",
      "binding": "DAILY_REPORT"
    }
  ]
}
```

**src/index.ts:**

```typescript
interface Env {
  DAILY_REPORT: Workflow;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log('Triggering daily report workflow...');

    // Trigger workflow with initial state
    const instance = await env.DAILY_REPORT.create({
      params: {
        date: new Date().toISOString().split('T')[0],
        reportType: 'daily-summary',
      },
    });

    console.log(`Workflow started: ${instance.id}`);
  },
};
```

**Why use Workflows:**
- Workflows can run for hours (cron handlers have CPU limits)
- Built-in retry and error handling
- State persistence across steps
- Better for complex, multi-step processes

**Reference:** [Cloudflare Workflows Docs](https://developers.cloudflare.com/workflows/)

---

## 6. Error Handling in Scheduled Handlers

```typescript
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    try {
      // Main task
      await performScheduledTask(env);
    } catch (error) {
      // Log error
      console.error('Scheduled task failed:', error);

      // Send alert
      await sendAlert({
        worker: 'my-scheduled-worker',
        cron: controller.cron,
        error: error.message,
        timestamp: new Date(controller.scheduledTime).toISOString(),
      });

      // Store failure in database
      ctx.waitUntil(
        env.DB.prepare(
          'INSERT INTO cron_failures (cron, error, timestamp) VALUES (?, ?, ?)'
        )
          .bind(controller.cron, error.message, Date.now())
          .run()
      );

      // Re-throw to mark execution as failed
      throw error;
    }
  },
};

async function sendAlert(details: any): Promise<void> {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Cron job failed: ${details.worker}`,
      blocks: [
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Worker:*\n${details.worker}` },
            { type: 'mrkdwn', text: `*Cron:*\n${details.cron}` },
            { type: 'mrkdwn', text: `*Error:*\n${details.error}` },
            { type: 'mrkdwn', text: `*Time:*\n${details.timestamp}` },
          ],
        },
      ],
    }),
  });
}
```

**Error Handling Best Practices:**

1. **Always catch errors** - Prevent silent failures
2. **Log everything** - Use `console.error()` for visibility in Cloudflare dashboard
3. **Send alerts** - Notify via Slack, email, or monitoring service
4. **Store failures** - Track history in database for analysis
5. **Re-throw errors** - Let Cloudflare mark execution as failed for retry
6. **Use ctx.waitUntil()** - Complete async operations like logging even after handler returns

**Monitoring Options:**
- **Cloudflare Dashboard** - View logs at https://dash.cloudflare.com
- **Logpush** - Stream logs to external services
- **Tail Workers** - Capture logs in real-time
- **Sentry/DataDog** - Third-party error tracking

---

## Pattern Comparison

| Pattern | Use Case | Complexity | Best For |
|---------|----------|------------|----------|
| **Standalone** | Background tasks only | Low | Database cleanup, report generation |
| **Hono Combo** | HTTP + scheduled tasks | Low | APIs that need periodic updates |
| **Multiple Crons** | Different schedules | Medium | System with varied maintenance tasks |
| **Bindings Access** | Complex integrations | Medium | Multi-service orchestration |
| **Workflows** | Long-running processes | High | Multi-step data pipelines |
| **Error Handling** | Production reliability | High | Critical scheduled tasks |

---

## Performance Tips

### Execution Context

Use `ctx.waitUntil()` for non-blocking operations:

```typescript
export default {
  async scheduled(controller, env, ctx) {
    // Blocking (waits for completion)
    await criticalTask(env);

    // Non-blocking (continues after handler returns)
    ctx.waitUntil(logToAnalytics(controller));
    ctx.waitUntil(updateCache(env));
  },
};
```

### Batching Operations

Group multiple operations for efficiency:

```typescript
// ❌ Slow: Multiple round trips
for (const user of users) {
  await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?')
    .bind(Date.now(), user.id)
    .run();
}

// ✅ Fast: Batch update
const batch = users.map(user =>
  env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?')
    .bind(Date.now(), user.id)
);
await env.DB.batch(batch);
```

### Timeouts

Cron handlers have resource limits:

- **CPU Time**: 10 ms per invocation (Free), 30 seconds for schedules with intervals < 1 hour, and up to 15 minutes for schedules with intervals ≥ 1 hour (Paid)
- **Memory**: 128 MB (Free), 1 GB (Paid)
- **Subrequests**: 50 (Free), 1000 (Paid)

For long-running tasks, use Workflows instead.

---

**Last Updated**: 2025-11-25
**Official Docs**: https://developers.cloudflare.com/workers/configuration/cron-triggers/
