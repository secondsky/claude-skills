# Cloudflare Workflows 2025 Features

Recent features, updates, and improvements to Cloudflare Workflows as of 2025.

## New in 2025

### 1. Enhanced Retry Configuration (January 2025)

Granular control over retry behavior with exponential backoff:

```typescript
await step.do('api call', {
  retries: {
    limit: 5,
    delay: '10 seconds',
    backoff: 'exponential' // 10s, 20s, 40s, 80s, 160s
  }
}, async () => {
  return await callExternalAPI();
});
```

**Key Features**:
- `limit`: Number of retry attempts (0 to disable)
- `delay`: Initial delay between retries
- `backoff`: 'linear' | 'exponential' | 'constant'
- Max backoff capped at 1 hour

### 2. Workflow Events System (Late 2024/2025)

Send events to running workflow instances:

```typescript
// In Worker: Send event to workflow
const instance = await env.MY_WORKFLOW.get(instanceId);
await instance.sendEvent('payment.received', {
  amount: 99.99,
  transactionId: 'txn_123'
});

// In Workflow: Wait for event
const event = await step.waitForEvent('wait for payment', 'payment.received', {
  timeout: '24 hours'
});

if (event) {
  console.log('Payment received:', event.payload);
}
```

**Use Cases**:
- Human-in-the-loop approvals
- External webhook integration
- Multi-system coordination
- Payment confirmation flows

### 3. Instance Lifecycle Management

New methods for controlling workflow instances:

```typescript
// Get instance by ID
const instance = await env.MY_WORKFLOW.get(instanceId);

// Check status
const status = await instance.status();
// Returns: 'queued' | 'running' | 'paused' | 'complete' | 'errored' | 'terminated'

// Pause running instance
await instance.pause();

// Resume paused instance
await instance.resume();

// Terminate instance
await instance.terminate();
```

### 4. Improved Wrangler CLI Commands

New commands for workflow management:

```bash
# List all instances
wrangler workflows instances list my-workflow

# Filter by status
wrangler workflows instances list my-workflow --status running

# Describe specific instance
wrangler workflows instances describe my-workflow abc-123

# Terminate instance
wrangler workflows instances terminate my-workflow abc-123

# Pause instance
wrangler workflows instances pause my-workflow abc-123

# Resume instance
wrangler workflows instances resume my-workflow abc-123
```

### 5. Custom Instance IDs

Specify your own instance IDs for idempotency:

```typescript
// Create with custom ID
const instance = await env.MY_WORKFLOW.create({
  id: `order-${orderId}`,  // Custom, unique ID
  params: { orderId }
});

// Prevents duplicate processing
try {
  await env.MY_WORKFLOW.create({
    id: `order-${orderId}`,  // Same ID
    params: { orderId }
  });
} catch (e) {
  // Instance already exists - check status instead
  const existing = await env.MY_WORKFLOW.get(`order-${orderId}`);
  return await existing.status();
}
```

### 6. Enhanced Error Information

More detailed error objects with stack traces:

```typescript
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
  try {
    await step.do('risky operation', async () => {
      throw new Error('Something went wrong');
    });
  } catch (error) {
    // Enhanced error object
    console.log({
      message: error.message,
      step: error.step,           // Which step failed
      attempt: error.attempt,     // Which retry attempt
      stack: error.stack          // Full stack trace
    });
  }
}
```

### 7. Workflow Metrics & Analytics

Access workflow metrics through Workers Analytics Engine:

```typescript
// Query workflow metrics
const metrics = await env.ANALYTICS.query({
  dimensions: ['workflow_name', 'status'],
  metrics: ['instance_count', 'avg_duration', 'error_rate'],
  timeRange: { hours: 24 }
});
```

**Available Metrics**:
- Instance count by status
- Average/P50/P95/P99 duration
- Step execution counts
- Error rates and types
- Retry statistics

---

## Compatibility Date Requirements

Different features require specific compatibility dates:

| Feature | Min Compatibility Date |
|---------|----------------------|
| Basic Workflows | 2024-01-01 |
| Events System | 2024-10-01 |
| Enhanced Retries | 2024-12-01 |
| Instance Control | 2024-12-01 |

**Update your wrangler.jsonc**:
```jsonc
{
  "compatibility_date": "2025-01-01"  // Use latest for all features
}
```

---

## Migration Guide

### From Pre-2025 Workflows

**Old retry syntax** (deprecated):
```typescript
// Old way - still works but limited
await step.do('api call', async () => {
  return await callAPI();
});
// Uses default 3 retries
```

**New retry syntax** (recommended):
```typescript
// New way - full control
await step.do('api call', {
  retries: {
    limit: 5,
    delay: '10s',
    backoff: 'exponential'
  }
}, async () => {
  return await callAPI();
});
```

### Adding Events to Existing Workflows

```typescript
// Before: Polling for status changes
for (let i = 0; i < 60; i++) {
  const status = await step.do(`poll ${i}`, () => checkPaymentStatus());
  if (status === 'complete') break;
  await step.sleep('wait', '1 minute');
}

// After: Event-driven (recommended)
await step.do('initiate payment', () => initiatePayment());

const event = await step.waitForEvent('payment confirmation', 'payment.complete', {
  timeout: '1 hour'
});

if (!event) {
  throw new NonRetryableError('Payment timeout');
}
```

---

## Best Practices for 2025

### 1. Always Set Event Timeouts

```typescript
// Always include timeout
const event = await step.waitForEvent('user action', 'user.confirmed', {
  timeout: '24 hours'  // Don't wait forever
});

if (!event) {
  // Handle timeout gracefully
  await step.do('escalate', () => notifyTimeout());
}
```

### 2. Use Custom IDs for Idempotency

```typescript
// Generate deterministic ID from input
const instanceId = `process-${hashInput(params)}`;

// Check if already processed
try {
  const existing = await env.MY_WORKFLOW.get(instanceId);
  const status = await existing.status();
  if (status.status === 'complete') {
    return { alreadyProcessed: true, result: status.output };
  }
} catch {
  // Instance doesn't exist, create new
}

await env.MY_WORKFLOW.create({
  id: instanceId,
  params
});
```

### 3. Leverage Free Sleep for Cost Optimization

```typescript
// Sleep is FREE - use it liberally
await step.sleep('rate limit cooldown', '1 minute');  // $0
await step.sleep('wait for next business day', '16 hours');  // $0
await step.sleep('monthly check', '30 days');  // $0

// Steps cost money - minimize when possible
await step.do('process', async () => {  // $0.00000015
  return await process();
});
```

### 4. Use Enhanced Retries for External APIs

```typescript
await step.do('call external api', {
  retries: {
    limit: 5,
    delay: '5 seconds',
    backoff: 'exponential'  // 5s, 10s, 20s, 40s, 80s
  }
}, async () => {
  const response = await fetch('https://api.example.com/data');

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - retry will handle backoff
      throw new Error('Rate limited');
    }
    if (response.status >= 500) {
      // Server error - worth retrying
      throw new Error(`Server error: ${response.status}`);
    }
    // Client error - don't retry
    throw new NonRetryableError(`Client error: ${response.status}`);
  }

  return await response.json();
});
```

---

## Upcoming Features (Roadmap)

Based on Cloudflare's public roadmap:

1. **Workflow Versioning**: Deploy new versions without affecting running instances
2. **Conditional Branching**: Built-in if/else step logic
3. **Parallel Steps**: Execute multiple steps concurrently
4. **Sub-workflows**: Call workflows from workflows
5. **Dashboard UI**: Visual workflow monitoring and management
6. **Workflow Templates**: Pre-built patterns for common use cases

---

## When to Load This Reference

Load this file when:
- User asks about new Workflow features
- Migrating older workflows to new patterns
- Implementing events, retries, or instance control
- Checking compatibility date requirements
- Planning workflow architecture with latest capabilities
