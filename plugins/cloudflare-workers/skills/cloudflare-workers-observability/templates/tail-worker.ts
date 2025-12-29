/**
 * Tail Worker for Log Aggregation and Alerting
 *
 * Features:
 * - Receives logs from producer workers
 * - Filters and transforms logs
 * - Forwards to external services (Datadog, Splunk, etc.)
 * - Triggers alerts on errors
 * - Rate-limited alerting
 *
 * Usage:
 * 1. Copy to src/tail-worker.ts
 * 2. Configure wrangler.jsonc for this worker
 * 3. Add tail_consumers to producer workers
 */

// Types for Tail Events
interface TailEvent {
  scriptName: string;
  event: {
    request?: {
      url: string;
      method: string;
      headers: Record<string, string>;
      cf?: {
        country?: string;
        colo?: string;
        asn?: number;
      };
    };
    response?: {
      status: number;
    };
    scheduledTime?: number;
    queue?: {
      batchSize: number;
    };
  };
  logs: Array<{
    level: 'log' | 'debug' | 'info' | 'warn' | 'error';
    message: unknown[];
    timestamp: number;
  }>;
  exceptions: Array<{
    name: string;
    message: string;
    timestamp: number;
  }>;
  outcome: 'ok' | 'exception' | 'exceededCpu' | 'exceededMemory' | 'canceled' | 'unknown';
  eventTimestamp: number;
}

// Environment bindings
interface Env {
  // External service endpoints
  DATADOG_API_KEY?: string;
  SPLUNK_HEC_URL?: string;
  SPLUNK_HEC_TOKEN?: string;
  ELASTICSEARCH_URL?: string;
  ES_USER?: string;
  ES_PASS?: string;

  // Alerting
  SLACK_WEBHOOK?: string;
  PAGERDUTY_KEY?: string;

  // Rate limiting
  KV: KVNamespace;
}

// Configuration
const CONFIG = {
  // Which log levels to forward
  forwardLevels: ['warn', 'error'] as string[],

  // Always forward if these outcomes occur
  forwardOutcomes: ['exception', 'exceededCpu', 'exceededMemory'] as string[],

  // Alert cooldown in seconds per worker
  alertCooldown: 300,

  // Batch size for external services
  batchSize: 100,
};

// Main Tail Worker
export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    // Filter events worth forwarding
    const relevantEvents = events.filter(
      (event) =>
        CONFIG.forwardOutcomes.includes(event.outcome) ||
        event.exceptions.length > 0 ||
        event.logs.some((log) => CONFIG.forwardLevels.includes(log.level))
    );

    if (relevantEvents.length === 0) return;

    // Process in parallel
    await Promise.all([
      // Forward to logging service
      forwardLogs(relevantEvents, env),

      // Check for alerts
      checkAlerts(relevantEvents, env),
    ]);
  },
};

// Log forwarding functions
async function forwardLogs(events: TailEvent[], env: Env): Promise<void> {
  // Choose based on configured service
  if (env.DATADOG_API_KEY) {
    await sendToDatadog(events, env);
  } else if (env.SPLUNK_HEC_URL && env.SPLUNK_HEC_TOKEN) {
    await sendToSplunk(events, env);
  } else if (env.ELASTICSEARCH_URL) {
    await sendToElasticsearch(events, env);
  }
  // Add more services as needed
}

async function sendToDatadog(events: TailEvent[], env: Env): Promise<void> {
  const logs = events.flatMap((event) => [
    // Request event
    {
      ddsource: 'cloudflare-workers',
      ddtags: `worker:${event.scriptName},outcome:${event.outcome}`,
      hostname: 'cloudflare-edge',
      service: event.scriptName,
      message: JSON.stringify({
        type: 'request',
        outcome: event.outcome,
        request: event.event.request,
        response: event.event.response,
      }),
      status: event.outcome === 'ok' ? 'info' : 'error',
      timestamp: event.eventTimestamp,
    },
    // Console logs
    ...event.logs
      .filter((log) => CONFIG.forwardLevels.includes(log.level))
      .map((log) => ({
        ddsource: 'cloudflare-workers',
        ddtags: `worker:${event.scriptName},level:${log.level}`,
        hostname: 'cloudflare-edge',
        service: event.scriptName,
        message: JSON.stringify(log.message),
        status: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warn' : 'info',
        timestamp: log.timestamp,
      })),
    // Exceptions
    ...event.exceptions.map((ex) => ({
      ddsource: 'cloudflare-workers',
      ddtags: `worker:${event.scriptName},exception:${ex.name}`,
      hostname: 'cloudflare-edge',
      service: event.scriptName,
      message: `${ex.name}: ${ex.message}`,
      status: 'error',
      timestamp: ex.timestamp,
    })),
  ]);

  if (logs.length === 0) return;

  await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': env.DATADOG_API_KEY!,
    },
    body: JSON.stringify(logs),
  });
}

async function sendToSplunk(events: TailEvent[], env: Env): Promise<void> {
  const splunkEvents = events.map((event) => ({
    time: event.eventTimestamp / 1000, // Splunk uses seconds
    host: 'cloudflare-workers',
    source: event.scriptName,
    sourcetype: 'cloudflare:workers',
    event: {
      outcome: event.outcome,
      request: event.event.request,
      response: event.event.response,
      logs: event.logs.filter((l) => CONFIG.forwardLevels.includes(l.level)),
      exceptions: event.exceptions,
    },
  }));

  await fetch(`${env.SPLUNK_HEC_URL}/services/collector/event`, {
    method: 'POST',
    headers: {
      Authorization: `Splunk ${env.SPLUNK_HEC_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: splunkEvents.map((e) => JSON.stringify(e)).join('\n'),
  });
}

async function sendToElasticsearch(events: TailEvent[], env: Env): Promise<void> {
  const bulk = events.flatMap((event) => [
    { index: { _index: `cloudflare-workers-${new Date().toISOString().slice(0, 10)}` } },
    {
      '@timestamp': new Date(event.eventTimestamp).toISOString(),
      worker: event.scriptName,
      outcome: event.outcome,
      request: event.event.request,
      response: event.event.response,
      logs: event.logs.filter((l) => CONFIG.forwardLevels.includes(l.level)),
      exceptions: event.exceptions,
    },
  ]);

  const auth = Buffer.from(`${env.ES_USER}:${env.ES_PASS}`).toString('base64');

  await fetch(`${env.ELASTICSEARCH_URL}/_bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-ndjson',
      Authorization: `Basic ${auth}`,
    },
    body: bulk.map((item) => JSON.stringify(item)).join('\n') + '\n',
  });
}

// Alerting functions
async function checkAlerts(events: TailEvent[], env: Env): Promise<void> {
  // Group by worker
  const byWorker = new Map<string, TailEvent[]>();
  for (const event of events) {
    const existing = byWorker.get(event.scriptName) || [];
    existing.push(event);
    byWorker.set(event.scriptName, existing);
  }

  // Check each worker for alert conditions
  for (const [worker, workerEvents] of byWorker) {
    const criticalEvents = workerEvents.filter(
      (e) =>
        e.outcome === 'exception' ||
        e.outcome === 'exceededCpu' ||
        e.outcome === 'exceededMemory' ||
        e.exceptions.length > 0
    );

    if (criticalEvents.length > 0) {
      await sendAlert(worker, criticalEvents, env);
    }
  }
}

async function sendAlert(worker: string, events: TailEvent[], env: Env): Promise<void> {
  // Rate limit: one alert per worker per cooldown period
  const alertKey = `alert:${worker}`;
  const lastAlert = await env.KV.get(alertKey);

  if (lastAlert) {
    const elapsed = Date.now() - parseInt(lastAlert);
    if (elapsed < CONFIG.alertCooldown * 1000) {
      return; // Still in cooldown
    }
  }

  // Set cooldown
  await env.KV.put(alertKey, String(Date.now()), {
    expirationTtl: CONFIG.alertCooldown,
  });

  const event = events[0];
  const exception = event.exceptions[0];

  // Send to Slack
  if (env.SLACK_WEBHOOK) {
    await fetch(env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 Worker Alert: ${worker}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Outcome:*\n${event.outcome}` },
              { type: 'mrkdwn', text: `*Events:*\n${events.length}` },
              {
                type: 'mrkdwn',
                text: `*Error:*\n${exception ? `${exception.name}: ${exception.message}` : 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date(event.eventTimestamp).toISOString()}`,
              },
            ],
          },
          event.event.request && {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Request:*\n\`${event.event.request.method} ${event.event.request.url}\``,
            },
          },
        ].filter(Boolean),
      }),
    });
  }

  // Send to PagerDuty for critical issues
  if (env.PAGERDUTY_KEY && event.outcome !== 'ok') {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: env.PAGERDUTY_KEY,
        event_action: 'trigger',
        dedup_key: `${worker}-${event.outcome}`,
        payload: {
          summary: `[${worker}] ${event.outcome}: ${exception?.message || 'Worker failure'}`,
          severity: 'critical',
          source: 'cloudflare-workers-tail',
          custom_details: {
            worker,
            outcome: event.outcome,
            exceptions: event.exceptions,
            eventCount: events.length,
            request: event.event.request,
          },
        },
      }),
    });
  }
}

// wrangler.jsonc for this Tail Worker:
/*
{
  "name": "log-aggregator",
  "main": "src/tail-worker.ts",
  "compatibility_date": "2024-01-01",
  "kv_namespaces": [
    { "binding": "KV", "id": "your-kv-namespace-id" }
  ],
  "vars": {
    "DATADOG_API_KEY": "your-datadog-api-key",
    "SLACK_WEBHOOK": "https://hooks.slack.com/services/xxx"
  }
}
*/

// Producer worker wrangler.jsonc addition:
/*
{
  "tail_consumers": [
    {
      "service": "log-aggregator",
      "environment": "production"
    }
  ]
}
*/
