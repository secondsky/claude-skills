# Cloudflare Workflows Production Deployment Checklist

**Last Updated**: 2025-11-26

Complete this checklist before deploying workflow consumers to production to ensure reliability, proper error handling, and optimal performance.

---

## Pre-Deployment Checklist

### 1. I/O Context Isolation ✅

**Requirement**: ALL I/O must happen inside `step.do()` callbacks

**Why**: Each step runs in a separate request context. I/O outside `step.do()` causes the error: "Cannot perform I/O on behalf of different request"

**Verification**:
- [ ] Database calls inside `step.do()`
- [ ] API requests inside `step.do()`
- [ ] KV/R2/D1 operations inside `step.do()`
- [ ] No I/O in `run()` method outside steps

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  // ✅ All I/O inside step.do()
  const user = await step.do('fetch user', async () => {
    return await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(event.payload.userId)
      .first();
  });

  // ✅ API call inside step.do()
  const payment = await step.do('process payment', async () => {
    return await fetch('https://api.stripe.com/v1/charges', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.STRIPE_KEY}` },
      body: JSON.stringify({ amount: 1000, currency: 'usd' })
    });
  });
}
```

---

### 2. JSON Serialization Validation ✅

**Requirement**: Steps must return only JSON-serializable data

**Why**: State persists between steps and must be serialized. Non-serializable data causes "serialization error"

**Non-Serializable Types**:
- Functions
- Symbols
- undefined (use null instead)
- Circular references
- Class instances (use `.toJSON()` or plain objects)
- BigInt (convert to string)
- Date objects (convert to ISO string)

**Verification**:
- [ ] All step return values are JSON-serializable
- [ ] Class instances converted to plain objects
- [ ] Dates converted to ISO strings
- [ ] No functions or Symbols in return values

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  // ❌ Wrong: Returns Date object
  const wrongData = await step.do('get timestamp', async () => {
    return { createdAt: new Date() }; // Not JSON-serializable
  });

  // ✅ Correct: Returns ISO string
  const correctData = await step.do('get timestamp', async () => {
    return { createdAt: new Date().toISOString() }; // JSON-serializable
  });
}
```

---

### 3. NonRetryableError for Permanent Failures ✅

**Requirement**: Throw `NonRetryableError` for permanent failures to prevent infinite retries

**Why**: By default, all errors cause retries. Permanent failures (validation errors, missing resources) should not retry.

**Verification**:
- [ ] `NonRetryableError` thrown for validation failures
- [ ] `NonRetryableError` thrown for 404/410 responses
- [ ] `NonRetryableError` includes descriptive message
- [ ] Regular errors used for transient failures (network, 5xx)

**Important**: Always include a message with `NonRetryableError`. Empty messages cause dev/prod inconsistency.

**Example (Correct)**:
```typescript
import { NonRetryableError } from 'cloudflare:workers';

async run(event: WorkflowEvent, step: WorkflowStep) {
  await step.do('validate order', async () => {
    if (!event.payload.orderId) {
      // ✅ Permanent failure - don't retry
      throw new NonRetryableError('orderId is required');
    }

    const order = await fetchOrder(event.payload.orderId);
    if (!order) {
      // ✅ Order doesn't exist - don't retry
      throw new NonRetryableError(`Order ${event.payload.orderId} not found`);
    }

    return order;
  });
}
```

---

### 4. Event Name Consistency ✅

**Requirement**: Event names in `waitForEvent()` must exactly match `workflow.trigger()` calls

**Why**: Mismatched event names cause "WorkflowEvent not found" errors

**Verification**:
- [ ] Event names match exactly (case-sensitive)
- [ ] No typos in event names
- [ ] Event names documented in README
- [ ] Timeout configured for `waitForEvent()`

**Example (Correct)**:
```typescript
// In workflow
await step.waitForEvent('payment.completed', { timeout: '1 hour' });

// In trigger Worker
await env.MY_WORKFLOW.get(instanceId).trigger('payment.completed', {
  paymentId: 'ch_123',
  amount: 1000
});
```

---

### 5. Step Duration Limits ✅

**Requirement**: Break long computations into <30 second steps

**Why**: Steps have a 30-second CPU limit by default. Exceeding this causes "Step timeout exceeded"

**Verification**:
- [ ] No single step exceeds 30 seconds
- [ ] Large data processing split into batches
- [ ] Long computations use `step.sleep()` between batches
- [ ] CPU-intensive tasks optimized

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  const items = event.payload.items; // 10,000 items

  // ❌ Wrong: Process all items in one step (>30s)
  // await step.do('process all', async () => {
  //   return items.map(item => processItem(item));
  // });

  // ✅ Correct: Process in batches
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    await step.do(`process batch ${i / batchSize}`, async () => {
      const batch = items.slice(i, i + batchSize);
      return await Promise.all(batch.map(processItem));
    });

    // Optional: Sleep between batches
    if (i + batchSize < items.length) {
      await step.sleep('wait between batches', '1 second');
    }
  }
}
```

---

### 6. Error Handling in All Steps ✅

**Requirement**: Implement proper error handling with try-catch in steps

**Why**: Unhandled errors cause workflow to retry unexpectedly

**Verification**:
- [ ] Try-catch blocks in all steps
- [ ] Errors logged with context
- [ ] Transient errors allowed to retry
- [ ] Permanent errors throw NonRetryableError

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  await step.do('call external API', async () => {
    try {
      const response = await fetch('https://api.example.com/data');

      if (!response.ok) {
        if (response.status === 404) {
          // Permanent failure - don't retry
          throw new NonRetryableError(`Resource not found: ${response.status}`);
        }
        // Transient failure (5xx) - will retry
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Log error for debugging
      console.error('API call failed:', error);
      throw error; // Re-throw for retry logic
    }
  });
}
```

---

### 7. Retry Configuration ✅

**Requirement**: Configure appropriate retry behavior for your use case

**Why**: Default retry behavior may not suit all workflows

**Verification**:
- [ ] Max retries set appropriately
- [ ] Retry delays configured if needed
- [ ] Circuit breaker pattern for external APIs
- [ ] Exponential backoff implemented

**Example (with Exponential Backoff)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      return await step.do(`api call attempt ${attempt}`, async () => {
        return await callRateLimitedAPI();
      });
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw new NonRetryableError('Max retry attempts exceeded');
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delaySec = Math.pow(2, attempt);
      await step.sleep(`backoff ${delaySec}s`, `${delaySec} seconds`);
    }
  }
}
```

---

### 8. Timeout Configuration ✅

**Requirement**: Set timeouts for external dependencies and event waits

**Why**: Workflows can run indefinitely without timeouts, consuming resources

**Verification**:
- [ ] `waitForEvent()` has timeout configured
- [ ] External API calls have timeout
- [ ] Long-running operations have max duration
- [ ] Timeout errors handled gracefully

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  // ✅ Timeout on waitForEvent
  try {
    const approval = await step.waitForEvent('approval.decision', {
      timeout: '24 hours'
    });
    // Process approval
  } catch (error) {
    if (error.message.includes('timeout')) {
      // Handle timeout - escalate or auto-reject
      throw new NonRetryableError('Approval timeout - auto-rejected');
    }
    throw error;
  }

  // ✅ Timeout on fetch
  await step.do('fetch with timeout', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('https://api.example.com', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('API timeout');
      }
      throw error;
    }
  });
}
```

---

### 9. Workflow Naming Convention ✅

**Requirement**: Use unique, descriptive workflow names

**Why**: Workflow names must be unique within an account

**Verification**:
- [ ] Workflow names follow convention (e.g., `order-processing`, `user-onboarding`)
- [ ] Names describe the workflow's purpose
- [ ] No conflicts with existing workflows
- [ ] Names match between `wrangler.jsonc` and code

---

### 10. Monitoring & Logging ✅

**Requirement**: Configure monitoring and structured logging

**Why**: Production workflows need observability for debugging and alerting

**Verification**:
- [ ] Console.log statements in all critical steps
- [ ] Error logging includes context (instanceId, stepName, payload)
- [ ] Wrangler tail configured for monitoring
- [ ] Alerts set up for workflow failures

**Example (Correct)**:
```typescript
async run(event: WorkflowEvent, step: WorkflowStep) {
  console.log('Workflow started', {
    instanceId: event.instanceId,
    payload: event.payload
  });

  const result = await step.do('critical operation', async () => {
    try {
      const data = await performOperation();
      console.log('Operation succeeded', {
        instanceId: event.instanceId,
        result: data
      });
      return data;
    } catch (error) {
      console.error('Operation failed', {
        instanceId: event.instanceId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  });

  console.log('Workflow completed', {
    instanceId: event.instanceId
  });
}
```

---

## Deployment Workflow

### Step 1: Pre-Deployment Testing
```bash
# Run local tests
npm test

# Test in dev environment
wrangler dev

# Verify wrangler.jsonc configuration
cat wrangler.jsonc
```

### Step 2: Deploy to Production
```bash
# Deploy workflow
wrangler deploy

# Verify deployment
wrangler workflows instances list --workflow-name my-workflow
```

### Step 3: Monitor Initial Instances
```bash
# Watch for errors
wrangler tail my-worker --status error

# Check instance status
wrangler workflows instances list --workflow-name my-workflow --status running
```

### Step 4: Gradual Rollout
- Start with low traffic
- Monitor error rates
- Gradually increase traffic
- Roll back if issues detected

---

## Post-Deployment Monitoring

### Daily Checks
- [ ] Check workflow failure rate
- [ ] Review error logs
- [ ] Monitor workflow duration
- [ ] Check for stuck instances

### Weekly Reviews
- [ ] Analyze workflow performance
- [ ] Optimize slow steps
- [ ] Review retry patterns
- [ ] Update timeout configurations

---

## Additional Resources

- **Common Issues Guide**: `references/common-issues.md`
- **Workflow Patterns**: `references/workflow-patterns.md`
- **Wrangler Commands**: `references/wrangler-commands.md`
- **Official Docs**: https://developers.cloudflare.com/workflows/

---

**Remember**: Workflows are powerful but require careful attention to I/O context, serialization, and error handling. Take time to complete this checklist—it prevents costly production issues!
