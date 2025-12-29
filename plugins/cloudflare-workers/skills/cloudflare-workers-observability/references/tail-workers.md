# Tail Workers for Log Aggregation

Real-time log streaming and aggregation with Tail Workers.

## Overview

Tail Workers receive logs, exceptions, and outcomes from other Workers in real-time. Use them to:
- Forward logs to external services (Datadog, Splunk, etc.)
- Filter and transform logs
- Aggregate metrics
- Trigger alerts

## Configuration

**Producer Worker (wrangler.jsonc)**:
```jsonc
{
  "name": "my-api-worker",
  "tail_consumers": [
    {
      "service": "log-aggregator",
      "environment": "production"
    }
  ]
}
```

**Tail Worker (wrangler.jsonc)**:
```jsonc
{
  "name": "log-aggregator",
  "main": "src/tail-worker.ts"
}
```

## Tail Event Structure

```typescript
interface TailEvent {
  // Which worker produced this event
  scriptName: string;

  // Request/response info (if fetch handler)
  event: {
    request?: {
      url: string;
      method: string;
      headers: Record<string, string>;
      cf?: IncomingRequestCfProperties;
    };
    response?: {
      status: number;
    };
    scheduledTime?: number; // For cron triggers
    queue?: { batchSize: number }; // For queue handlers
  };

  // Console output
  logs: Array<{
    level: 'log' | 'debug' | 'info' | 'warn' | 'error';
    message: unknown[];
    timestamp: number;
  }>;

  // Uncaught exceptions
  exceptions: Array<{
    name: string;
    message: string;
    timestamp: number;
  }>;

  // Request outcome
  outcome: 'ok' | 'exception' | 'exceededCpu' | 'exceededMemory' | 'canceled' | 'unknown';

  // When the event occurred
  eventTimestamp: number;
}
```

## Basic Tail Worker

```typescript
interface Env {
  LOGGING_ENDPOINT: string;
  LOGGING_TOKEN: string;
}

export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    const logsToSend = [];

    for (const event of events) {
      // Process each event
      const processed = {
        worker: event.scriptName,
        timestamp: event.eventTimestamp,
        outcome: event.outcome,
        request: event.event.request ? {
          method: event.event.request.method,
          url: event.event.request.url,
        } : undefined,
        response: event.event.response ? {
          status: event.event.response.status,
        } : undefined,
        logs: event.logs.map(log => ({
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
        })),
        exceptions: event.exceptions,
      };

      logsToSend.push(processed);
    }

    // Send batch to external service
    await fetch(env.LOGGING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.LOGGING_TOKEN}`,
      },
      body: JSON.stringify(logsToSend),
    });
  }
};
```

## Filtering Logs

```typescript
export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    // Only process events with errors or warnings
    const relevantEvents = events.filter(event =>
      event.outcome !== 'ok' ||
      event.exceptions.length > 0 ||
      event.logs.some(log => ['error', 'warn'].includes(log.level))
    );

    if (relevantEvents.length === 0) return;

    // Forward filtered events
    await forwardToLoggingService(relevantEvents, env);
  }
};
```

## External Service Integrations

### Datadog

```typescript
async function sendToDatadog(events: TailEvent[], env: Env) {
  const logs = events.flatMap(event => [
    // Main event log
    {
      ddsource: 'cloudflare-workers',
      ddtags: `worker:${event.scriptName},outcome:${event.outcome}`,
      hostname: 'cloudflare-edge',
      message: JSON.stringify({
        type: 'request',
        request: event.event.request,
        response: event.event.response,
        outcome: event.outcome,
      }),
      status: event.outcome === 'ok' ? 'info' : 'error',
      timestamp: event.eventTimestamp,
    },
    // Individual console logs
    ...event.logs.map(log => ({
      ddsource: 'cloudflare-workers',
      ddtags: `worker:${event.scriptName},level:${log.level}`,
      hostname: 'cloudflare-edge',
      message: JSON.stringify(log.message),
      status: log.level,
      timestamp: log.timestamp,
    })),
  ]);

  await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': env.DATADOG_API_KEY,
    },
    body: JSON.stringify(logs),
  });
}
```

### Splunk

```typescript
async function sendToSplunk(events: TailEvent[], env: Env) {
  const splunkEvents = events.map(event => ({
    time: event.eventTimestamp / 1000, // Splunk uses seconds
    host: 'cloudflare-workers',
    source: event.scriptName,
    sourcetype: 'cloudflare:workers',
    event: {
      outcome: event.outcome,
      request: event.event.request,
      response: event.event.response,
      logs: event.logs,
      exceptions: event.exceptions,
    },
  }));

  await fetch(`${env.SPLUNK_HEC_URL}/services/collector/event`, {
    method: 'POST',
    headers: {
      'Authorization': `Splunk ${env.SPLUNK_HEC_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: splunkEvents.map(e => JSON.stringify(e)).join('\n'),
  });
}
```

### Elasticsearch

```typescript
async function sendToElasticsearch(events: TailEvent[], env: Env) {
  const bulk = events.flatMap(event => [
    { index: { _index: 'cloudflare-workers-logs' } },
    {
      '@timestamp': new Date(event.eventTimestamp).toISOString(),
      worker: event.scriptName,
      outcome: event.outcome,
      request: event.event.request,
      response: event.event.response,
      logs: event.logs,
      exceptions: event.exceptions,
    },
  ]);

  await fetch(`${env.ELASTICSEARCH_URL}/_bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Authorization': `Basic ${btoa(`${env.ES_USER}:${env.ES_PASS}`)}`,
    },
    body: bulk.map(item => JSON.stringify(item)).join('\n') + '\n',
  });
}
```

## Alerting from Tail Workers

```typescript
interface Env {
  SLACK_WEBHOOK: string;
  KV: KVNamespace; // For rate limiting alerts
}

export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    for (const event of events) {
      // Check for critical issues
      if (event.outcome === 'exception' || event.exceptions.length > 0) {
        await sendAlert(event, env);
      }
    }
  }
};

async function sendAlert(event: TailEvent, env: Env) {
  // Rate limit: 1 alert per worker per 5 minutes
  const alertKey = `alert:${event.scriptName}`;
  const lastAlert = await env.KV.get(alertKey);

  if (lastAlert) {
    const elapsed = Date.now() - parseInt(lastAlert);
    if (elapsed < 5 * 60 * 1000) return; // Skip if within 5 minutes
  }

  await env.KV.put(alertKey, String(Date.now()), { expirationTtl: 300 });

  const exception = event.exceptions[0];
  await fetch(env.SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🚨 Worker Exception' },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Worker:*\n${event.scriptName}` },
            { type: 'mrkdwn', text: `*Outcome:*\n${event.outcome}` },
            { type: 'mrkdwn', text: `*Error:*\n${exception?.name}: ${exception?.message}` },
          ],
        },
      ],
    }),
  });
}
```

## Multi-Worker Setup

```typescript
// Tail multiple workers with different handling
export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    const grouped = groupBy(events, e => e.scriptName);

    for (const [worker, workerEvents] of Object.entries(grouped)) {
      switch (worker) {
        case 'api-worker':
          await handleApiLogs(workerEvents, env);
          break;
        case 'auth-worker':
          await handleAuthLogs(workerEvents, env);
          break;
        default:
          await handleGenericLogs(workerEvents, env);
      }
    }
  }
};

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
```

## Limits

| Limit | Value |
|-------|-------|
| Events per batch | Up to 100 |
| Tail Worker execution time | 10 seconds |
| Max tail consumers per producer | 10 |
| Log message size | 128 KB |

## Troubleshooting

### Tail Worker Not Receiving Events

1. Verify `tail_consumers` config in producer worker
2. Check Tail Worker is deployed and running
3. Ensure service names match exactly
4. Check environment matches (production/staging)

### Missing Logs

1. Verify producer is using `console.log/error/warn`
2. Check log sampling rate in producer
3. Ensure Tail Worker isn't filtering them out

### Duplicate Events

- Normal during deployments
- Implement idempotency with event fingerprints
