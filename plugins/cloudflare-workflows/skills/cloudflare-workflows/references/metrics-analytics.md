# Cloudflare Workflows Metrics & Analytics

Comprehensive guide to monitoring, observability, and analytics for Cloudflare Workflows.

## Built-in Monitoring

### Wrangler CLI Monitoring

**List Running Instances**:
```bash
# List all instances
wrangler workflows instances list my-workflow

# Filter by status
wrangler workflows instances list my-workflow --status running
wrangler workflows instances list my-workflow --status errored
wrangler workflows instances list my-workflow --status complete

# Limit results
wrangler workflows instances list my-workflow --limit 50
```

**Instance Details**:
```bash
# Get detailed instance information
wrangler workflows instances describe my-workflow <instance-id>

# Output includes:
# - Instance ID
# - Status (queued, running, paused, complete, errored, terminated)
# - Created timestamp
# - Completed timestamp (if finished)
# - Steps executed
# - Current step (if running)
# - Error details (if errored)
# - Output (if complete)
```

**Real-time Logs**:
```bash
# Stream workflow logs
wrangler tail my-worker --format pretty

# Filter for workflow events
wrangler tail my-worker | grep -E "(Workflow|step|instance)"
```

---

## Custom Metrics Implementation

### Step-Level Metrics

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  MY_WORKFLOW: Workflow;
  ANALYTICS: AnalyticsEngineDataset;
};

type Metrics = {
  stepDurations: Record<string, number>;
  totalDuration: number;
  retryCount: number;
};

export class InstrumentedWorkflow extends WorkflowEntrypoint<Env, any> {
  async run(event: WorkflowEvent<any>, step: WorkflowStep) {
    const startTime = Date.now();
    const metrics: Metrics = {
      stepDurations: {},
      totalDuration: 0,
      retryCount: 0
    };

    // Instrumented step wrapper
    const timedStep = async <T>(
      name: string,
      fn: () => Promise<T>,
      options?: { retries?: { limit: number } }
    ): Promise<T> => {
      const stepStart = Date.now();

      const result = await step.do(name, options || {}, fn);

      metrics.stepDurations[name] = Date.now() - stepStart;

      // Log step completion
      console.log(JSON.stringify({
        type: 'step_complete',
        workflow: 'my-workflow',
        instanceId: event.instanceId,
        step: name,
        duration: metrics.stepDurations[name]
      }));

      return result;
    };

    try {
      // Use instrumented steps
      await timedStep('validate', async () => {
        return await validate(event.payload);
      });

      await timedStep('process', async () => {
        return await process(event.payload);
      });

      await timedStep('complete', async () => {
        return await finalize(event.payload);
      });

      metrics.totalDuration = Date.now() - startTime;

      // Write final metrics
      this.env.ANALYTICS.writeDataPoint({
        blobs: [event.instanceId, 'complete'],
        doubles: [metrics.totalDuration],
        indexes: ['my-workflow']
      });

      return { status: 'complete', metrics };

    } catch (error) {
      metrics.totalDuration = Date.now() - startTime;

      this.env.ANALYTICS.writeDataPoint({
        blobs: [event.instanceId, 'error', error.message],
        doubles: [metrics.totalDuration],
        indexes: ['my-workflow']
      });

      throw error;
    }
  }
}
```

### Analytics Engine Integration

**Setup Analytics Engine**:

1. Enable in Cloudflare Dashboard > Analytics > Analytics Engine
2. Add binding to wrangler.jsonc:

```jsonc
{
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "workflow_metrics"
    }
  ]
}
```

**Write Metrics**:
```typescript
// Write workflow completion metric
env.ANALYTICS.writeDataPoint({
  blobs: [
    instanceId,           // blob1: instance identifier
    workflowName,         // blob2: workflow name
    status                // blob3: completion status
  ],
  doubles: [
    duration,             // double1: total duration (ms)
    stepCount,            // double2: steps executed
    retryCount            // double3: total retries
  ],
  indexes: [workflowName] // For efficient querying
});
```

**Query Metrics** (via GraphQL API):
```graphql
query WorkflowMetrics($date: Date!) {
  viewer {
    accounts(filter: { accountTag: "your-account-id" }) {
      workflowMetrics: analyticsEngineDatasets(
        dataset: "workflow_metrics"
        filter: { date: $date }
        limit: 1000
      ) {
        dimensions {
          blob1  # instanceId
          blob2  # workflowName
          blob3  # status
        }
        avg {
          double1  # avg duration
        }
        sum {
          double2  # total steps
          double3  # total retries
        }
        count
      }
    }
  }
}
```

---

## Structured Logging

### Log Format Standard

```typescript
interface WorkflowLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  type: 'workflow_start' | 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete' | 'workflow_error';
  workflow: string;
  instanceId: string;
  step?: string;
  duration?: number;
  error?: {
    message: string;
    code?: string;
    retryable: boolean;
  };
  metadata?: Record<string, unknown>;
}

function log(entry: WorkflowLogEntry) {
  console.log(JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  }));
}
```

### Example Logging Implementation

```typescript
export class LoggingWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const workflowName = 'order-processing';

    // Log workflow start
    log({
      level: 'info',
      type: 'workflow_start',
      workflow: workflowName,
      instanceId: event.instanceId,
      metadata: { params: event.payload }
    });

    try {
      // Log step start
      log({
        level: 'debug',
        type: 'step_start',
        workflow: workflowName,
        instanceId: event.instanceId,
        step: 'validate'
      });

      const startTime = Date.now();
      const result = await step.do('validate', async () => {
        return await validate(event.payload);
      });

      // Log step complete
      log({
        level: 'info',
        type: 'step_complete',
        workflow: workflowName,
        instanceId: event.instanceId,
        step: 'validate',
        duration: Date.now() - startTime
      });

      // ... more steps

      // Log workflow complete
      log({
        level: 'info',
        type: 'workflow_complete',
        workflow: workflowName,
        instanceId: event.instanceId,
        duration: Date.now() - workflowStartTime
      });

      return result;

    } catch (error) {
      // Log workflow error
      log({
        level: 'error',
        type: 'workflow_error',
        workflow: workflowName,
        instanceId: event.instanceId,
        error: {
          message: error.message,
          retryable: !(error instanceof NonRetryableError)
        }
      });

      throw error;
    }
  }
}
```

---

## External Monitoring Integration

### Logpush to External Services

Configure Cloudflare Logpush for workflow logs:

1. Go to Cloudflare Dashboard > Logs > Logpush
2. Create job for Workers logs
3. Select destination (S3, Datadog, Splunk, etc.)

**Example Datadog Integration**:
```typescript
// Log in Datadog-compatible format
console.log(JSON.stringify({
  ddsource: 'cloudflare-workflows',
  ddtags: `workflow:${workflowName},env:production`,
  hostname: 'cloudflare-workers',
  service: workflowName,
  status: 'info',
  message: `Step ${stepName} completed`,
  duration: stepDuration,
  workflow: {
    instanceId,
    step: stepName,
    params: event.payload
  }
}));
```

### Custom Webhook Notifications

```typescript
async function notifyExternal(event: {
  type: string;
  workflow: string;
  instanceId: string;
  data: Record<string, unknown>;
}) {
  await fetch('https://your-webhook.com/workflow-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      source: 'cloudflare-workflows'
    })
  });
}

// Use in workflow
await step.do('notify start', async () => {
  await notifyExternal({
    type: 'workflow.started',
    workflow: 'order-processing',
    instanceId: event.instanceId,
    data: { orderId: event.payload.orderId }
  });
});
```

---

## Dashboard Queries

### Instance Status Overview

```sql
-- Analytics Engine SQL API (if enabled)
SELECT
  blob2 AS workflow_name,
  blob3 AS status,
  COUNT(*) AS instance_count,
  AVG(double1) AS avg_duration_ms,
  SUM(double3) AS total_retries
FROM workflow_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY blob2, blob3
ORDER BY instance_count DESC
```

### Error Rate Tracking

```sql
SELECT
  blob2 AS workflow_name,
  COUNT(*) FILTER (WHERE blob3 = 'error') AS errors,
  COUNT(*) FILTER (WHERE blob3 = 'complete') AS successes,
  ROUND(
    COUNT(*) FILTER (WHERE blob3 = 'error') * 100.0 / COUNT(*),
    2
  ) AS error_rate_pct
FROM workflow_metrics
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY blob2
```

### Performance Percentiles

```sql
SELECT
  blob2 AS workflow_name,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY double1) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY double1) AS p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY double1) AS p99_ms
FROM workflow_metrics
WHERE blob3 = 'complete'
  AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY blob2
```

---

## Alerting Patterns

### Error Rate Alert

```typescript
// Check error rate periodically
async function checkErrorRate(env: Env, threshold = 5) {
  const stats = await getWorkflowStats(env, '1 hour');

  const errorRate = (stats.errors / stats.total) * 100;

  if (errorRate > threshold) {
    await sendAlert({
      severity: 'critical',
      message: `Workflow error rate ${errorRate.toFixed(1)}% exceeds ${threshold}%`,
      workflow: 'order-processing',
      metrics: stats
    });
  }
}
```

### Latency Alert

```typescript
async function checkLatency(env: Env, thresholdMs = 30000) {
  const p95 = await getP95Latency(env, '1 hour');

  if (p95 > thresholdMs) {
    await sendAlert({
      severity: 'warning',
      message: `Workflow P95 latency ${p95}ms exceeds ${thresholdMs}ms`,
      workflow: 'order-processing'
    });
  }
}
```

### Stuck Instance Detection

```typescript
async function detectStuckInstances(env: Env) {
  const instances = await env.MY_WORKFLOW.list();

  const stuckThreshold = 60 * 60 * 1000; // 1 hour
  const now = Date.now();

  for (const instance of instances) {
    if (instance.status === 'running') {
      const age = now - new Date(instance.created).getTime();

      if (age > stuckThreshold) {
        await sendAlert({
          severity: 'warning',
          message: `Instance ${instance.id} running for ${Math.round(age / 60000)} minutes`,
          workflow: 'order-processing'
        });
      }
    }
  }
}
```

---

## Monitoring Script

Use the included monitoring script:

```bash
# Basic status check
./scripts/benchmark-workflow.sh my-workflow 1

# Performance benchmark
./scripts/benchmark-workflow.sh my-workflow 10

# Output:
# Workflow Benchmark: my-workflow
# ===============================
# Iterations: 10
#
# Results:
# - Min Duration: 1.2s
# - Max Duration: 2.1s
# - Avg Duration: 1.5s
# - Success Rate: 100%
#
# Cost Estimate:
# - Requests: 60 × $0.15/M = $0.000009
# - Duration: 0.015 GB-s × $0.02/M = ~$0
# - Total: ~$0.00001 per run
```

---

## When to Load This Reference

Load this file when:
- Setting up workflow monitoring
- Implementing custom metrics
- Integrating with external monitoring tools
- Creating dashboards for workflow visibility
- Debugging performance issues
- Setting up alerts for workflow health
