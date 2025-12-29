# Alerting for Cloudflare Workers

Configure monitoring and alerting for production Workers.

## Alerting Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Your Worker    │────▶│   Tail Worker   │────▶│  Alert Service  │
│  (logs/metrics) │     │   (aggregates)  │     │ (Slack/PD/etc)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Analytics Engine│
                        │  (dashboards)   │
                        └─────────────────┘
```

## Cloudflare Dashboard Alerts

### Built-in Notifications

1. Go to **Notifications** in Cloudflare Dashboard
2. Create notification for:
   - Worker errors
   - Worker CPU exceeded
   - Worker memory exceeded
   - Deployment status

### Configuring

```
Workers → Notifications → Create
├── Trigger: Worker Script Exception
├── Workers: [Select specific or all]
├── Delivery: Email, Webhook, PagerDuty
└── Filters: Environment, Script name
```

## Custom Alert Implementation

### Alert Manager in Tail Worker

```typescript
interface Env {
  SLACK_WEBHOOK: string;
  PAGERDUTY_KEY: string;
  KV: KVNamespace; // Rate limiting
  ANALYTICS: AnalyticsEngineDataset;
}

interface AlertConfig {
  name: string;
  condition: (event: TailEvent) => boolean;
  severity: 'info' | 'warning' | 'critical';
  cooldown: number; // seconds
}

const ALERTS: AlertConfig[] = [
  {
    name: 'worker_exception',
    condition: (e) => e.outcome === 'exception' || e.exceptions.length > 0,
    severity: 'critical',
    cooldown: 300, // 5 minutes
  },
  {
    name: 'cpu_exceeded',
    condition: (e) => e.outcome === 'exceededCpu',
    severity: 'critical',
    cooldown: 300,
  },
  {
    name: 'high_error_rate',
    condition: (e) => e.event.response?.status ? e.event.response.status >= 500 : false,
    severity: 'warning',
    cooldown: 60,
  },
];

class AlertManager {
  constructor(private env: Env) {}

  async checkAndAlert(events: TailEvent[]) {
    for (const alert of ALERTS) {
      const triggered = events.filter(alert.condition);

      if (triggered.length > 0) {
        await this.sendAlert(alert, triggered);
      }
    }
  }

  private async sendAlert(alert: AlertConfig, events: TailEvent[]) {
    // Check cooldown
    const key = `alert:${alert.name}:${events[0].scriptName}`;
    const lastAlert = await this.env.KV.get(key);

    if (lastAlert) {
      const elapsed = Date.now() - parseInt(lastAlert);
      if (elapsed < alert.cooldown * 1000) return;
    }

    // Set cooldown
    await this.env.KV.put(key, String(Date.now()), {
      expirationTtl: alert.cooldown,
    });

    // Send based on severity
    switch (alert.severity) {
      case 'critical':
        await this.sendPagerDuty(alert, events);
        await this.sendSlack(alert, events);
        break;
      case 'warning':
        await this.sendSlack(alert, events);
        break;
      case 'info':
        // Log only
        break;
    }

    // Track alert
    this.env.ANALYTICS.writeDataPoint({
      blobs: [alert.name, alert.severity, events[0].scriptName],
      doubles: [events.length, 1],
      indexes: ['alert'],
    });
  }

  private async sendSlack(alert: AlertConfig, events: TailEvent[]) {
    const event = events[0];
    const exception = event.exceptions[0];

    await fetch(this.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.name}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Worker:*\n${event.scriptName}` },
              { type: 'mrkdwn', text: `*Outcome:*\n${event.outcome}` },
              { type: 'mrkdwn', text: `*Count:*\n${events.length} events` },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date(event.eventTimestamp).toISOString()}`,
              },
            ],
          },
          exception && {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Error:*\n\`\`\`${exception.name}: ${exception.message}\`\`\``,
            },
          },
        ].filter(Boolean),
      }),
    });
  }

  private async sendPagerDuty(alert: AlertConfig, events: TailEvent[]) {
    const event = events[0];

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: this.env.PAGERDUTY_KEY,
        event_action: 'trigger',
        dedup_key: `${alert.name}-${event.scriptName}`,
        payload: {
          summary: `[${alert.name}] ${event.scriptName}: ${event.outcome}`,
          severity: alert.severity === 'critical' ? 'critical' : 'warning',
          source: 'cloudflare-workers',
          custom_details: {
            worker: event.scriptName,
            outcome: event.outcome,
            exceptions: event.exceptions,
            eventCount: events.length,
          },
        },
      }),
    });
  }
}

export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    const alertManager = new AlertManager(env);
    await alertManager.checkAndAlert(events);
  }
};
```

## Error Rate Alerting

### Analytics Engine-Based Alerts

```typescript
// Scheduled worker that checks error rates
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const errorRate = await checkErrorRate(env);

    if (errorRate > 5) { // > 5% error rate
      await sendAlert(env, {
        title: 'High Error Rate Alert',
        message: `Error rate is ${errorRate.toFixed(2)}% (threshold: 5%)`,
        severity: 'warning',
      });
    }

    if (errorRate > 10) { // > 10% error rate
      await sendAlert(env, {
        title: 'Critical Error Rate Alert',
        message: `Error rate is ${errorRate.toFixed(2)}% (threshold: 10%)`,
        severity: 'critical',
      });
    }
  }
};

async function checkErrorRate(env: Env): Promise<number> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT
            SUM(double4) as errors,
            SUM(double3) as total,
            SUM(double4) / SUM(double3) * 100 as error_rate
          FROM my_worker_metrics
          WHERE timestamp > NOW() - INTERVAL '5' MINUTE
        `,
      }),
    }
  );

  const data = await response.json();
  return data.data?.[0]?.error_rate || 0;
}
```

## Alert Integrations

### Slack

```typescript
async function sendSlackAlert(webhookUrl: string, alert: Alert) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.title}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: alert.title },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: alert.message },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `Severity: *${alert.severity}*` },
            { type: 'mrkdwn', text: `Time: ${new Date().toISOString()}` },
          ],
        },
      ],
    }),
  });
}
```

### PagerDuty

```typescript
async function sendPagerDutyAlert(routingKey: string, alert: Alert) {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: routingKey,
      event_action: 'trigger',
      dedup_key: alert.dedupKey,
      payload: {
        summary: alert.title,
        severity: alert.severity,
        source: 'cloudflare-workers',
        custom_details: alert.details,
      },
    }),
  });
}
```

### OpsGenie

```typescript
async function sendOpsGenieAlert(apiKey: string, alert: Alert) {
  await fetch('https://api.opsgenie.com/v2/alerts', {
    method: 'POST',
    headers: {
      'Authorization': `GenieKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: alert.title,
      description: alert.message,
      priority: alert.severity === 'critical' ? 'P1' : 'P3',
      tags: ['cloudflare-workers', alert.worker],
    }),
  });
}
```

## Alert Best Practices

### 1. Set Appropriate Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 1% | > 5% |
| P99 latency | > 1s | > 5s |
| CPU exceeded | 1/hour | 5/hour |
| Memory exceeded | 1/hour | 3/hour |

### 2. Implement Cooldowns

- **Critical**: 5-10 minute cooldown
- **Warning**: 1-5 minute cooldown
- **Info**: No cooldown (log only)

### 3. Add Context to Alerts

```typescript
{
  worker: 'api-worker',
  outcome: 'exception',
  error: 'TypeError: Cannot read property...',
  request: { method: 'POST', path: '/api/users' },
  recentChanges: 'Deployed 15 minutes ago',
  runbook: 'https://wiki.example.com/runbooks/api-worker'
}
```

### 4. Group Related Alerts

- Deduplicate by error type + worker
- Aggregate counts in single alert
- Show first occurrence + count

### 5. Auto-Resolve

```typescript
// Resolve PagerDuty when recovered
await fetch('https://events.pagerduty.com/v2/enqueue', {
  method: 'POST',
  body: JSON.stringify({
    routing_key: key,
    event_action: 'resolve',
    dedup_key: dedupKey,
  }),
});
```
