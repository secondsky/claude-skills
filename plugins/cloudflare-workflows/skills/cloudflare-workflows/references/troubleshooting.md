# Cloudflare Workflows Troubleshooting

Advanced debugging techniques, diagnostic procedures, and solutions for complex workflow issues.

## Diagnostic Decision Tree

```
Workflow Issue
│
├─ Deployment fails?
│  ├─ "Class not found" → Check exports (Section 1)
│  ├─ "Invalid configuration" → Validate wrangler.jsonc (Section 2)
│  └─ TypeScript errors → Check types (Section 3)
│
├─ Runtime error?
│  ├─ "I/O in run() method" → Move to step.do() (Section 4)
│  ├─ "Non-serializable" → Fix return values (Section 5)
│  ├─ "Step timeout" → Optimize or batch (Section 6)
│  └─ "NonRetryableError" → Check error handling (Section 7)
│
├─ Instance stuck?
│  ├─ In "queued" → Check instance limits (Section 8)
│  ├─ In "running" → Check for blocking operations (Section 9)
│  └─ In "paused" → Resume or investigate (Section 10)
│
└─ Performance issue?
   ├─ Slow execution → Optimize steps (Section 11)
   ├─ High cost → Reduce requests (Section 12)
   └─ High retry rate → Fix flaky operations (Section 13)
```

---

## Section 1: Class Export Issues

### Symptom
```
Error: Workflow class "MyWorkflow" not found
```

### Diagnosis
```bash
# Check if class is exported from main entry
grep "export.*MyWorkflow" src/index.ts

# Check if class extends WorkflowEntrypoint
grep "class MyWorkflow extends WorkflowEntrypoint" src/**/*.ts
```

### Solution

**1. Export from main entry file**:
```typescript
// src/index.ts
export { MyWorkflow } from './workflows/my-workflow';
```

**2. Verify wrangler.jsonc matches**:
```jsonc
{
  "workflows": [
    {
      "class_name": "MyWorkflow"  // Must match exported class name
    }
  ]
}
```

**3. Check for typos**:
- Class name is case-sensitive
- File name doesn't need to match class name
- But export statement must use exact class name

---

## Section 2: Configuration Issues

### Symptom
```
Error: Invalid wrangler.jsonc configuration
```

### Diagnosis
```bash
# Validate JSON syntax (strip comments)
grep -v '^[[:space:]]*//' wrangler.jsonc | jq '.'

# Check workflow configuration
./scripts/validate-workflow-config.sh
```

### Common Configuration Errors

**Missing required fields**:
```jsonc
// Wrong - missing required fields
{
  "workflows": [{ "class_name": "MyWorkflow" }]
}

// Correct - all required fields
{
  "workflows": [
    {
      "binding": "MY_WORKFLOW",    // Required
      "name": "my-workflow",       // Required
      "class_name": "MyWorkflow"   // Required
    }
  ]
}
```

**Duplicate workflow names**:
```jsonc
// Wrong - duplicate names
{
  "workflows": [
    { "binding": "WF1", "name": "workflow", "class_name": "Workflow1" },
    { "binding": "WF2", "name": "workflow", "class_name": "Workflow2" }
  ]
}

// Correct - unique names
{
  "workflows": [
    { "binding": "WF1", "name": "workflow-1", "class_name": "Workflow1" },
    { "binding": "WF2", "name": "workflow-2", "class_name": "Workflow2" }
  ]
}
```

**Invalid binding names**:
```jsonc
// Wrong - lowercase binding
{ "binding": "myWorkflow" }

// Correct - SCREAMING_SNAKE_CASE
{ "binding": "MY_WORKFLOW" }
```

---

## Section 3: TypeScript Errors

### Symptom
```
Type 'X' is not assignable to type 'Y'
```

### Diagnosis
```bash
# Run TypeScript check
npx tsc --noEmit
```

### Common Type Issues

**Missing Env interface**:
```typescript
// Wrong - Workflow binding not in Env
interface Env {
  KV: KVNamespace;
}

// Correct - include workflow binding
interface Env {
  KV: KVNamespace;
  MY_WORKFLOW: Workflow;  // Add this
}
```

**Incorrect generic types**:
```typescript
// Wrong - missing generics
export class MyWorkflow extends WorkflowEntrypoint {

// Correct - specify Env and Params
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
```

**Missing workers-types**:
```bash
# Install latest types
npm install -D @cloudflare/workers-types@latest
```

---

## Section 4: I/O Context Errors

### Symptom
```
Error: Cannot perform I/O outside of a step
```

### Diagnosis
Look for `await` statements in `run()` method that are not inside `step.do()`:

```typescript
// Wrong - I/O outside step.do()
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
  const data = await fetch('https://api.example.com');  // Error!

  await step.do('process', async () => {
    return process(data);
  });
}
```

### Solution

**Move ALL I/O inside step.do()**:
```typescript
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
  const data = await step.do('fetch data', async () => {
    const response = await fetch('https://api.example.com');
    return response.json();
  });

  await step.do('process', async () => {
    return process(data);
  });
}
```

**Also applies to**:
- `env.KV.get/put`
- `env.D1.prepare().run()`
- `env.R2.put/get`
- Any external API calls
- Database operations

---

## Section 5: Serialization Errors

### Symptom
```
Error: Cannot serialize step result
```

### Diagnosis
Check for non-JSON-serializable values in step returns:

```bash
# Find potential issues
grep -n "return.*new Date()\|return.*function\|return.*undefined" src/workflows/*.ts
```

### Non-Serializable Types

| Type | Problem | Solution |
|------|---------|----------|
| `Date` | Object, not primitive | Use `.toISOString()` |
| `undefined` | Not JSON-valid | Use `null` or omit |
| `Function` | Cannot serialize | Remove or use identifier |
| `Symbol` | Cannot serialize | Use string |
| `BigInt` | Not JSON-native | Convert to string |
| Circular refs | Infinite recursion | Break cycles |

### Solution

```typescript
// Wrong
await step.do('get data', async () => {
  return {
    createdAt: new Date(),        // Object
    callback: () => {},           // Function
    value: undefined,             // undefined
    bigNum: 12345678901234567890n // BigInt
  };
});

// Correct
await step.do('get data', async () => {
  return {
    createdAt: new Date().toISOString(),  // String
    callbackId: 'process-callback',       // Identifier
    value: null,                          // Explicit null
    bigNum: '12345678901234567890'        // String
  };
});
```

---

## Section 6: Step Timeout Issues

### Symptom
```
Error: Step exceeded 30 second CPU limit
```

### Diagnosis
Find long-running operations:

```bash
# Find loops inside steps
grep -B5 -A10 "step\.do" src/workflows/*.ts | grep -E "for|while"
```

### Solution

**Batch large operations**:
```typescript
// Wrong - may timeout
await step.do('process all', async () => {
  for (const item of largeArray) {
    await processItem(item);  // 1000 items × 0.1s = 100s
  }
});

// Correct - batched
const batchSize = 50;
for (let i = 0; i < largeArray.length; i += batchSize) {
  await step.do(`batch-${i}`, async () => {
    const batch = largeArray.slice(i, i + batchSize);
    return Promise.all(batch.map(processItem));
  });
}
```

**Use parallel processing within batches**:
```typescript
await step.do('process batch', async () => {
  return Promise.all(items.map(async (item) => {
    return await processItem(item);
  }));
});
```

---

## Section 7: NonRetryableError Issues

### Symptom
- Errors retry forever
- Expected failures don't stop workflow
- Missing error context

### Diagnosis
```bash
# Check NonRetryableError usage
grep -n "NonRetryableError" src/workflows/*.ts

# Check for empty constructors
grep -n "new NonRetryableError()" src/workflows/*.ts
```

### Solution

**Import NonRetryableError**:
```typescript
import { NonRetryableError } from 'cloudflare:workflows';
```

**Use descriptive messages**:
```typescript
// Wrong - no message
throw new NonRetryableError();

// Correct - descriptive
throw new NonRetryableError('Order validation failed: missing customer email');
```

**Categorize errors correctly**:
```typescript
await step.do('call api', async () => {
  const response = await fetch(url);

  if (!response.ok) {
    // 4xx = permanent failure
    if (response.status >= 400 && response.status < 500) {
      throw new NonRetryableError(`Client error: ${response.status}`);
    }
    // 5xx = transient, will retry
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
});
```

---

## Section 8: Queued Instances

### Symptom
Instances stuck in "queued" status

### Diagnosis
```bash
# Check running instances
wrangler workflows instances list my-workflow --status running

# Count running (max 100)
wrangler workflows instances list my-workflow --status running | wc -l
```

### Causes
1. **100 running instances limit**: New instances wait in queue
2. **Slow step execution**: Instances don't complete fast enough
3. **Waiting for events**: Instances blocked on waitForEvent

### Solution

**Optimize workflow speed**:
- Reduce step count
- Batch operations
- Use parallel processing

**Handle backpressure**:
```typescript
// Check queue before creating new instances
export default {
  async fetch(req: Request, env: Env) {
    const instances = await env.MY_WORKFLOW.list();
    const running = instances.filter(i => i.status === 'running');

    if (running.length >= 90) {
      return Response.json({
        error: 'Queue full',
        queuePosition: running.length
      }, { status: 429 });
    }

    const instance = await env.MY_WORKFLOW.create({ params });
    return Response.json({ id: instance.id });
  }
};
```

---

## Section 9: Stuck Running Instances

### Symptom
Instances stay in "running" status indefinitely

### Diagnosis
```bash
# Find long-running instances
wrangler workflows instances list my-workflow --status running
```

### Causes
1. **Infinite loop in step.do()**: Step never completes
2. **waitForEvent without timeout**: Waiting forever
3. **Deadlock**: Waiting for external event that won't arrive

### Solution

**Always set waitForEvent timeout**:
```typescript
// Wrong - waits forever
const event = await step.waitForEvent('approval', 'user.approved');

// Correct - with timeout
const event = await step.waitForEvent('approval', 'user.approved', {
  timeout: '24 hours'
});

if (!event) {
  throw new NonRetryableError('Approval timeout');
}
```

**Terminate stuck instances**:
```bash
wrangler workflows instances terminate my-workflow <instance-id>
```

**Add circuit breaker**:
```typescript
await step.do('call api', async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
});
```

---

## Section 10: Paused Instances

### Symptom
Instances in "paused" status

### Causes
1. **Explicit pause**: `instance.pause()` was called
2. **System pause**: Rate limiting or maintenance

### Solution

**Resume manually**:
```bash
wrangler workflows instances resume my-workflow <instance-id>
```

**Resume programmatically**:
```typescript
const instance = await env.MY_WORKFLOW.get(instanceId);
await instance.resume();
```

---

## Section 11: Slow Execution

### Diagnosis
```bash
# Benchmark workflow
./scripts/benchmark-workflow.sh my-workflow 10
```

### Optimization Strategies

**1. Reduce step count**:
```typescript
// Slow: 3 steps
await step.do('validate', () => validate(data));
await step.do('transform', () => transform(data));
await step.do('save', () => save(data));

// Fast: 1 step
await step.do('process', async () => {
  const validated = await validate(data);
  const transformed = await transform(validated);
  return await save(transformed);
});
```

**2. Use Promise.all()**:
```typescript
await step.do('fetch all', async () => {
  const [users, orders, products] = await Promise.all([
    fetch('/users').then(r => r.json()),
    fetch('/orders').then(r => r.json()),
    fetch('/products').then(r => r.json())
  ]);
  return { users, orders, products };
});
```

**3. Cache expensive operations**:
```typescript
await step.do('get config', async () => {
  // Check cache first
  const cached = await env.KV.get('config', 'json');
  if (cached) return cached;

  // Fetch and cache
  const config = await fetchConfig();
  await env.KV.put('config', JSON.stringify(config), { expirationTtl: 3600 });
  return config;
});
```

---

## Section 12: High Cost

### Diagnosis
```bash
# Check step count
grep -c "step\.do" src/workflows/*.ts

# Check for polling patterns
grep -B5 -A5 "for.*step\.do\|while.*step\.do" src/workflows/*.ts
```

### Cost Reduction Strategies

**1. Replace polling with sleep**:
```typescript
// Expensive: 10 steps
for (let i = 0; i < 10; i++) {
  const done = await step.do(`check-${i}`, () => checkStatus());
  if (done) break;
}

// Cheap: 2 steps + free sleep
await step.sleep('wait', '5 minutes');  // FREE
const done = await step.do('check', () => checkStatus());
```

**2. Replace polling with events**:
```typescript
// Expensive: polling
for (let i = 0; i < 60; i++) {
  const status = await step.do(`poll-${i}`, () => getStatus());
  if (status === 'complete') break;
  await step.sleep('wait', '1 minute');
}

// Cheap: event-driven
await step.do('initiate', () => startProcess());
const event = await step.waitForEvent('complete', 'process.complete', {
  timeout: '1 hour'
});
```

---

## Section 13: High Retry Rate

### Diagnosis
Check logs for retry patterns:
```bash
wrangler tail my-worker | grep -i "retry"
```

### Solutions

**1. Configure appropriate retry strategy**:
```typescript
await step.do('flaky api', {
  retries: {
    limit: 5,
    delay: '5 seconds',
    backoff: 'exponential'
  }
}, async () => {
  return await callFlakyAPI();
});
```

**2. Add circuit breaker**:
```typescript
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000;

let failures = 0;
let lastFailure = 0;

await step.do('protected call', async () => {
  // Check circuit breaker
  if (failures >= FAILURE_THRESHOLD) {
    if (Date.now() - lastFailure < RESET_TIMEOUT) {
      throw new NonRetryableError('Circuit breaker open');
    }
    failures = 0;  // Reset after timeout
  }

  try {
    const result = await riskyOperation();
    failures = 0;  // Reset on success
    return result;
  } catch (error) {
    failures++;
    lastFailure = Date.now();
    throw error;
  }
});
```

**3. Use idempotency keys**:
```typescript
await step.do('payment', async () => {
  const idempotencyKey = `${event.instanceId}-payment`;

  return await fetch('https://payment.api/charge', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({ amount })
  });
});
```

---

## Debugging Tools Quick Reference

| Tool | Command | Purpose |
|------|---------|---------|
| Validate config | `./scripts/validate-workflow-config.sh` | Check configuration |
| Test workflow | `./scripts/test-workflow.sh` | Run test instance |
| Benchmark | `./scripts/benchmark-workflow.sh` | Measure performance |
| Check limits | `./scripts/check-workflow-limits.sh` | Validate against limits |
| List instances | `wrangler workflows instances list` | See all instances |
| Describe instance | `wrangler workflows instances describe` | Get instance details |
| View logs | `wrangler tail` | Stream real-time logs |
| TypeScript check | `npx tsc --noEmit` | Validate types |

---

## When to Load This Reference

Load this file when:
- Debugging complex workflow issues
- Errors don't match common patterns
- Need systematic diagnostic approach
- Performance optimization needed
- High retry or error rates observed
