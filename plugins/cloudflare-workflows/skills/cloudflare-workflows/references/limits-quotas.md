# Cloudflare Workflows Limits & Quotas

Complete reference for all Cloudflare Workflows limits with workarounds and optimization strategies.

## Instance Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max running instances | 100 per workflow | Queued instances wait |
| Max queued instances | 10,000 per workflow | Oldest dropped if exceeded |
| Instance retention | 7 days | After completion/failure |
| Instance ID length | 64 characters | Custom IDs must fit |
| Max instances per Worker request | No hard limit | Rate limits apply |

### Workarounds for Instance Limits

**High Volume Processing**:
```typescript
// Bad: Create many instances at once
for (const item of items) {
  await env.MY_WORKFLOW.create({ params: { item } });
}

// Good: Batch processing in single workflow
await env.MY_WORKFLOW.create({
  params: { items: items.slice(0, 1000) }
});
```

**Instance Management**:
```typescript
// Check running instances before creating new ones
const instances = await env.MY_WORKFLOW.list();
const running = instances.filter(i => i.status === 'running');

if (running.length >= 90) {
  // Wait or queue externally
  throw new Error('Too many running instances');
}
```

---

## Step Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max steps per instance | 1,000 | Across all step types |
| Step name length | 256 characters | Must be unique per instance |
| Step CPU time | 30 seconds | Per step.do() execution |
| Step wall-clock time | 15 minutes | Including I/O wait |
| Max concurrent steps | 1 | Sequential only |

### Step Limit Workarounds

**Breaking Large Operations into Batches**:
```typescript
// Bad: Single step with many items (may hit 30s limit)
await step.do('process all', async () => {
  for (const item of items) {
    await processItem(item); // 1000 items × 0.1s = 100s
  }
});

// Good: Batched steps
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  await step.do(`batch ${Math.floor(i/batchSize)}`, async () => {
    const batch = items.slice(i, i + batchSize);
    return Promise.all(batch.map(processItem));
  });
}
```

**Avoiding Step Limit Exhaustion**:
```typescript
// Bad: One step per item (hits 1000 step limit)
for (const item of items) {
  await step.do(`process ${item.id}`, () => process(item));
}

// Good: Batch items into fewer steps
const chunks = chunkArray(items, 10);
for (let i = 0; i < chunks.length; i++) {
  await step.do(`batch ${i}`, async () => {
    return Promise.all(chunks[i].map(process));
  });
}
```

---

## Payload & Data Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Step return value | 128 KB | JSON serialized |
| Workflow params | 128 KB | Input payload |
| Event payload | 128 KB | sendEvent data |
| Total state per instance | 1 MB | Sum of all step results |

### Payload Limit Workarounds

**Large Data Handling with KV/R2**:
```typescript
// Bad: Return large data from step
await step.do('fetch data', async () => {
  const data = await fetchLargeDataset(); // 500KB
  return data; // ERROR: exceeds 128KB
});

// Good: Store in KV, return key
await step.do('fetch and store', async () => {
  const data = await fetchLargeDataset();
  const key = `workflow-${event.instanceId}-data`;
  await env.KV.put(key, JSON.stringify(data));
  return { dataKey: key };
});

// Later step retrieves if needed
await step.do('process data', async () => {
  const key = previousResult.dataKey;
  const data = JSON.parse(await env.KV.get(key));
  return processData(data);
});
```

**Streaming Large Responses**:
```typescript
// For very large data, use R2
await step.do('store to r2', async () => {
  const data = await fetchHugeDataset(); // 10MB
  await env.R2.put(`workflow/${event.instanceId}/data.json`, JSON.stringify(data));
  return { stored: true, key: `workflow/${event.instanceId}/data.json` };
});
```

---

## Duration Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max workflow duration | 1 year | Total wall-clock time |
| Sleep duration | No limit | Can sleep for months |
| waitForEvent timeout | No default | Set explicitly |
| Step execution timeout | 15 minutes | Wall-clock time |

### Duration Best Practices

**Long-Running Workflows**:
```typescript
// Workflow can run for months
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
  // Start immediately
  await step.do('start', () => notifyStart());

  // Wait for a month
  await step.sleep('wait for billing cycle', '30 days');

  // Continue processing
  await step.do('monthly task', () => runMonthlyTask());

  // This is fine - workflows can last up to 1 year
}
```

**waitForEvent with Timeout**:
```typescript
// Always set timeout to prevent indefinite waiting
const approval = await step.waitForEvent('wait for approval', 'user.approved', {
  timeout: '7 days'
});

if (!approval) {
  throw new NonRetryableError('Approval timeout - escalating');
}
```

---

## Retry Limits

| Limit | Default | Max |
|-------|---------|-----|
| Retry attempts | 3 | Configurable |
| Retry delay | Exponential | Configurable |
| Max retry delay | 1 hour | Capped |

### Retry Configuration

```typescript
// Configure retries per step
await step.do('flaky api', {
  retries: {
    limit: 5,           // Max 5 retries
    delay: '10 seconds', // Initial delay
    backoff: 'exponential' // 10s, 20s, 40s, 80s, 160s
  }
}, async () => {
  return await callFlakyAPI();
});

// Disable retries for idempotency-unsafe operations
await step.do('one-time action', {
  retries: { limit: 0 }
}, async () => {
  return await nonIdempotentAction();
});
```

---

## Rate Limits

| Operation | Limit | Period |
|-----------|-------|--------|
| Instance creation | 1,000/min | Per workflow |
| sendEvent | 1,000/min | Per instance |
| Status queries | 10,000/min | Per account |
| List instances | 100/min | Per workflow |

### Rate Limit Handling

```typescript
// Implement rate limiting for bulk operations
async function createInstancesWithRateLimit(
  workflow: Workflow,
  params: any[],
  ratePerMinute = 500
) {
  const delayMs = 60000 / ratePerMinute;
  const results = [];

  for (const param of params) {
    const instance = await workflow.create({ params: param });
    results.push(instance);
    await new Promise(r => setTimeout(r, delayMs));
  }

  return results;
}
```

---

## Cost Considerations

| Resource | Price | Notes |
|----------|-------|-------|
| Requests | $0.15/million | Instance creation + each step |
| Duration | $0.02/million GB-s | CPU time only |
| Sleep | FREE | No CPU usage |
| waitForEvent | FREE | While waiting |

### Cost Optimization Examples

**Use Sleep Instead of Polling**:
```typescript
// Expensive: Polling loop (10 steps = 10 requests)
for (let i = 0; i < 10; i++) {
  const ready = await step.do(`check ${i}`, () => checkReady());
  if (ready) break;
  await step.sleep('wait', '1 minute'); // Free
}

// Cheaper: Single sleep then check
await step.sleep('wait for processing', '10 minutes'); // Free
await step.do('verify', () => verifyComplete()); // 1 request
```

**Consolidate Steps**:
```typescript
// Expensive: 3 steps = 3 requests
await step.do('validate', () => validate(data));
await step.do('transform', () => transform(data));
await step.do('save', () => save(data));

// Cheaper: 1 step = 1 request
await step.do('process', async () => {
  const validated = await validate(data);
  const transformed = await transform(validated);
  return await save(transformed);
});
```

---

## Quota Check Script

Use this script to check if your workflow is within limits:

```bash
./scripts/check-workflow-limits.sh src/workflows/my-workflow.ts
```

Output example:
```
Workflow Limits Check: my-workflow
==================================

Steps Analysis:
- Total step.do() calls: 15
- Status: ✅ Within limit (1000 max)

Payload Analysis:
- Largest return statement: ~2KB estimated
- Status: ✅ Within limit (128KB max)

Duration Analysis:
- Estimated max duration: 5 minutes
- Status: ✅ Within limit (1 year max)

Cost Estimate (per 1000 workflows):
- Requests: 16,000 × $0.15/M = $0.0024
- Duration: ~0.005 GB-s × $0.02/M = ~$0
- Total: ~$0.0024 per 1000 workflows
```

---

## Quick Reference Card

```
INSTANCE LIMITS:
- Running: 100 max
- Queued: 10,000 max
- Retention: 7 days

STEP LIMITS:
- Steps/instance: 1,000 max
- CPU time/step: 30 seconds
- Wall time/step: 15 minutes

PAYLOAD LIMITS:
- Step return: 128 KB
- Params: 128 KB
- Event: 128 KB
- Total state: 1 MB

DURATION:
- Max workflow: 1 year
- Sleep: unlimited (free)

COST:
- Requests: $0.15/million
- Duration: $0.02/million GB-s
- Sleep/wait: FREE
```

---

## When to Load This Reference

Load this file when:
- User asks about workflow limits or quotas
- Designing workflows that may hit limits
- Optimizing workflow costs
- Debugging "payload too large" or "step limit exceeded" errors
- Planning high-volume workflow deployments
