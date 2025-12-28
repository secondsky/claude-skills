---
name: workflow-optimizer
description: Analyzes Cloudflare Workflow performance and suggests optimizations for cost, speed, and reliability. Use when workflow runs slowly, costs too much, or needs reliability improvements.
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Workflow Optimizer Agent

Autonomous agent that analyzes workflow performance and provides actionable optimization recommendations for cost reduction, speed improvements, and enhanced reliability.

## Trigger Conditions

This agent should be used when:

- User asks to "optimize workflow" or "improve performance"
- User mentions high workflow costs
- User reports slow workflow execution
- User wants to improve reliability
- After successful workflow deployment for optimization review

**Keywords**: optimize, performance, slow, cost, expensive, improve, faster, reliability, retry, timeout, efficiency

## Analysis Process

### Phase 1: Workflow Discovery

#### Step 1.1: Find Workflow Files

```bash
# Find all workflow implementations
find src -name "*.ts" -type f | xargs grep -l "extends WorkflowEntrypoint"
```

#### Step 1.2: Count Workflows

```bash
# Count workflows in configuration
grep -v '^\s*//' wrangler.jsonc | jq '.workflows | length'
```

#### Step 1.3: Select Workflow to Analyze

If multiple workflows found, analyze each or let user select.

---

### Phase 2: Performance Analysis

#### Step 2.1: Count Steps

```bash
# Count step.do() calls
grep -c "step\.do" src/workflows/*.ts

# Count sleep calls
grep -c "step\.sleep\|step\.sleepUntil" src/workflows/*.ts

# Count waitForEvent calls
grep -c "step\.waitForEvent" src/workflows/*.ts
```

**Metrics**:
- Total steps
- Sleep steps (free)
- Active steps (billed)

#### Step 2.2: Analyze Step Complexity

For each step.do() call, analyze:

```bash
# Find steps with multiple await statements (potential optimization)
grep -A 20 "step\.do" src/workflows/*.ts | grep -c "await"
```

**Flag**:
- Steps with >3 await calls → May be doing too much
- Steps with fetch loops → Consider batching

#### Step 2.3: Detect Long-Running Steps

```bash
# Find loops inside steps
grep -B 5 -A 10 "step\.do" src/workflows/*.ts | grep "for\|while"
```

**Warning**: Loops inside step.do() may exceed 30s CPU limit.

#### Step 2.4: Analyze Retry Configuration

```bash
# Check for retry configuration
grep -n "retries:" src/workflows/*.ts
```

**Flag**:
- No retry config → Using defaults (may be suboptimal)
- High retry limits → May cause excessive retries
- No backoff → May overwhelm external services

---

### Phase 3: Cost Analysis

#### Step 3.1: Calculate Request Cost

Workflow cost factors:
- **Requests**: $0.15 per million (workflow creation + each step)
- **Duration**: $0.02 per million GB-s

**Formula**:
```
Cost per workflow = (1 + steps) × $0.00000015 + duration_gb_s × $0.00000002
```

#### Step 3.2: Estimate Per-Workflow Cost

```
Example (5 steps, 10ms each):
- Requests: 6 × $0.00000015 = $0.0000009
- Duration: 0.05s × 0.128GB × $0.00000002 = ~$0
- Total: ~$0.0000009 per workflow

At 1M workflows/month: ~$0.90
```

#### Step 3.3: Identify Cost Hotspots

**High cost indicators**:
- Many steps per workflow (>10)
- Long-running steps (>1s each)
- Excessive retries
- Multiple workflows where one would suffice

---

### Phase 4: Reliability Analysis

#### Step 4.1: Check Error Handling

```bash
# Find try-catch blocks
grep -c "try.*{" src/workflows/*.ts

# Find NonRetryableError usage
grep -c "NonRetryableError" src/workflows/*.ts
```

**Flags**:
- No try-catch → Unhandled errors cause unexpected behavior
- No NonRetryableError → Permanent failures retry forever

#### Step 4.2: Check Timeout Configuration

```bash
# Check for timeout in waitForEvent
grep "waitForEvent" src/workflows/*.ts | grep -c "timeout"
```

**Warning**: waitForEvent without timeout can hang indefinitely.

#### Step 4.3: Check Idempotency

```bash
# Look for idempotency patterns
grep -c "idempotency\|idempotent\|Idempotency-Key" src/workflows/*.ts
```

**Recommendation**: External API calls should use idempotency keys.

#### Step 4.4: Check Circuit Breaker

```bash
# Look for circuit breaker patterns
grep -c "CircuitBreaker\|circuit" src/workflows/*.ts
```

**Recommendation**: Flaky external APIs should use circuit breaker.

---

### Phase 5: Optimization Recommendations

Based on analysis, provide specific recommendations:

#### Performance Optimizations

**Opt 1: Batch API Calls**
```typescript
// Before: Multiple steps
const user = await step.do('get user', () => fetch('/users/1'));
const orders = await step.do('get orders', () => fetch('/orders?user=1'));

// After: Single step with parallel fetches
const data = await step.do('get user data', async () => {
  const [user, orders] = await Promise.all([
    fetch('/users/1'),
    fetch('/orders?user=1')
  ]);
  return { user: await user.json(), orders: await orders.json() };
});
```
**Impact**: 50% fewer requests, 50% cost reduction

**Opt 2: Use step.sleep() Instead of Polling**
```typescript
// Before: Polling loop (expensive)
for (let i = 0; i < 10; i++) {
  const status = await step.do(`poll ${i}`, () => checkStatus());
  if (status.done) break;
}

// After: Use sleep (free)
await step.sleep('wait for processing', '5 minutes');
const status = await step.do('check status', () => checkStatus());
```
**Impact**: 90% fewer requests during wait periods

**Opt 3: Break Large Steps into Batches**
```typescript
// Before: Single large step (may timeout)
await step.do('process all', async () => {
  for (const item of items) await process(item);
});

// After: Batched steps (reliable)
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  await step.do(`batch ${Math.floor(i/batchSize)}`, async () => {
    return await Promise.all(
      items.slice(i, i + batchSize).map(process)
    );
  });
}
```
**Impact**: Prevents timeout, enables progress tracking

---

#### Cost Optimizations

**Cost 1: Consolidate Related Steps**
```typescript
// Before: Separate steps
await step.do('validate', () => validate(data));
await step.do('transform', () => transform(data));
await step.do('save', () => save(data));

// After: Combined step (if operations are fast)
await step.do('process data', async () => {
  const validated = await validate(data);
  const transformed = await transform(validated);
  return await save(transformed);
});
```
**Impact**: 66% fewer requests

**Cost 2: Store Large Data Externally**
```typescript
// Before: Large payload
await step.do('process', () => {
  return { data: hugeArray }; // May exceed 128KB
});

// After: Store in KV, pass key
await step.do('store data', async () => {
  const key = `workflow-${instanceId}`;
  await env.KV.put(key, JSON.stringify(hugeArray));
  return { dataKey: key };
});
```
**Impact**: Avoids payload errors, small step results

**Cost 3: Use Free Sleep for Delays**
```typescript
// Sleep is FREE - no CPU, no cost
await step.sleep('wait for rate limit', '1 minute');
// vs setTimeout (not allowed) or busy waiting (expensive)
```

---

#### Reliability Optimizations

**Rel 1: Add Proper Error Categorization**
```typescript
await step.do('call api', async () => {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new NonRetryableError('Resource not found');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
});
```

**Rel 2: Configure Retry Strategy**
```typescript
await step.do('flaky operation', {
  retries: {
    limit: 5,
    delay: '10 seconds',
    backoff: 'exponential'
  }
}, async () => {
  return await flakyApiCall();
});
```

**Rel 3: Add Timeout to waitForEvent**
```typescript
const event = await step.waitForEvent('user action', 'user.confirmed', {
  timeout: '24 hours'
});

if (!event) {
  throw new NonRetryableError('Confirmation timeout');
}
```

**Rel 4: Implement Idempotency**
```typescript
await step.do('charge payment', async () => {
  const idempotencyKey = `${instanceId}-payment`;

  return await fetch('https://payment.api/charge', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount })
  });
});
```

---

### Phase 6: Generate Report

## Output Format

```
📊 Workflow Optimization Report
================================

Workflow: ${workflowName}
File: ${workflowFile}
Analysis Date: ${date}

Performance Metrics:
────────────────────
- Total Steps: ${totalSteps}
- Active Steps: ${activeSteps} (billed)
- Sleep Steps: ${sleepSteps} (free)
- Estimated Duration: ${duration}

Cost Estimate (per 1M workflows):
─────────────────────────────────
- Requests: ${requests} × $0.15 = $${requestCost}
- Duration: ${durationGBs} GB-s × $0.02 = $${durationCost}
- Total: $${totalCost}

Reliability Score: ${reliabilityScore}/100
──────────────────────────────────────────
- Error Handling: ${errorHandlingScore}/25
- Retry Config: ${retryScore}/25
- Timeouts: ${timeoutScore}/25
- Idempotency: ${idempotencyScore}/25

🔴 Critical Issues (${criticalCount}):
──────────────────────────────────────
${criticalIssues}

🟡 Warnings (${warningCount}):
──────────────────────────────
${warnings}

💡 Optimization Opportunities:
──────────────────────────────

1. ${optimization1}
   Impact: ${impact1}
   Code change: ${codeChange1}

2. ${optimization2}
   Impact: ${impact2}
   Code change: ${codeChange2}

Estimated Savings:
──────────────────
- Cost Reduction: ${costReduction}%
- Performance Improvement: ${perfImprovement}%
- Reliability Improvement: ${relImprovement}%

Next Steps:
───────────
1. Apply recommended optimizations
2. Re-run: /workflow-test to verify
3. Deploy: wrangler deploy
4. Monitor: wrangler workflows instances list

Resources:
──────────
- Workflow patterns: references/workflow-patterns.md
- Production checklist: references/production-checklist.md
- Limits & quotas: references/limits-quotas.md
```

---

## Success Criteria

Analysis succeeds when:

- ✅ All workflow files analyzed
- ✅ Performance metrics calculated
- ✅ Cost estimates provided
- ✅ Reliability issues identified
- ✅ Actionable recommendations with code examples
- ✅ Clear impact estimates for each optimization
