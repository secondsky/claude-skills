---
name: cloudflare-queues:troubleshoot
description: Quick troubleshooting for common Cloudflare Queues issues
argument-hint: [queue-name]
---

# Queue Troubleshoot Command

Troubleshoot Cloudflare Queue issues with systematic checks.

**Usage**: `/queue-troubleshoot my-queue-name`

## Step 1: Validate Input

If queue name provided as argument ($1), use it.
If not provided, ask user:
- "Which queue name do you want to troubleshoot?"
- Store as: `queueName`

## Step 2: Quick Status Check

Run diagnostics in parallel:

```bash
# Check if queue exists
wrangler queues list

# Get queue details
wrangler queues info $queueName
```

Analyze output for:
- ✅ Queue exists and is listed
- ⚠️ High backlog (>100 messages)
- ⚠️ No active consumer
- ❌ Queue not found (doesn't exist)

**Output Example**:
```
Queue Status: my-queue
├── Exists: ✅ Yes
├── Backlog: ⚠️ 250 messages (high)
├── Consumers: ⚠️ 0 active (no consumer configured)
└── Last Activity: 5 minutes ago
```

## Step 3: Configuration Check

Read wrangler.jsonc/wrangler.toml and verify:

**Producer Check**:
- Search for `queues.producers` array
- Check if any binding references `$queueName`
- Verify binding name is valid JavaScript identifier

**Consumer Check**:
- Search for `queues.consumers` array
- Check if any consumer references `$queueName`
- Verify settings are reasonable:
  - `max_batch_size`: 1-100
  - `max_retries`: 1-10 (3 is typical)
  - `max_concurrency`: 1-20 (1-5 is typical)
- Check if `dead_letter_queue` configured

**Output Example**:
```
Configuration Check:
Producer:
  ✅ Binding: MY_QUEUE → my-queue

Consumer:
  ❌ NOT CONFIGURED
  → Recommendation: Add consumer configuration:
    ```jsonc
    {
      "queues": {
        "consumers": [{
          "queue": "my-queue",
          "max_batch_size": 10,
          "max_retries": 3
        }]
      }
    }
    ```

DLQ:
  ⚠️ Not configured (recommended for production)
```

## Step 4: Common Issues Check

For each common issue, check and provide fix:

### Issue 1: Messages Not Being Consumed

**Symptom**: Backlog growing, no consumer errors
**Check**:
- Is consumer configured in wrangler.jsonc?
- Is Worker deployed with queue handler?
- Is queue() export present in Worker?

**Fix** (if missing queue handler):
```
❌ Issue: No queue() handler in Worker

Check Worker code for:
  export default {
    async queue(batch, env) { ... }
  }

If missing, add consumer handler:
  ```typescript
  export default {
    async queue(batch: MessageBatch, env: Env) {
      for (const message of batch.messages) {
        console.log('Processing:', message.body);
        // Add processing logic
        message.ack();
      }
    }
  }
  ```

Then deploy: wrangler deploy
```

### Issue 2: Message Size Too Large

**Symptom**: "Message too large" errors
**Check**: Grep for send() calls, estimate message sizes

**Fix**:
```
❌ Issue: Messages likely >128 KB

Solution: Store large payloads in R2, send reference
  ```typescript
  // Before: Send large payload
  await env.QUEUE.send(largeData); // May exceed 128 KB

  // After: Store in R2, send reference
  const objectKey = `payloads/${id}.json`;
  await env.R2.put(objectKey, JSON.stringify(largeData));
  await env.QUEUE.send({
    type: 'large-payload',
    r2Key: objectKey
  });
  ```

Load templates/queues-producer.ts for complete example
```

### Issue 3: Throughput Exceeded

**Symptom**: "429 Too Many Requests" errors
**Check**:
- Account tier (Free: 50 msg/invocation, Paid: 1000)
- Sending rate from producer logs
- Compare against 5,000 msg/s limit

**Fix**:
```
❌ Issue: Exceeding throughput limits

Current: ~6,000 messages/second
Limit: 5,000 messages/second

Solution: Implement rate limiting
  ```typescript
  // Add delay between batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    await env.QUEUE.sendBatch(batch.map(m => ({ body: m })));

    // Wait to stay under 5000 msg/s
    await new Promise(r => setTimeout(r, 20)); // 100 batches/s = 10k msg/s → 50 batches/s = 5k msg/s
  }
  ```
```

### Issue 4: DLQ Filling Up

**Symptom**: Dead letter queue has many messages
**Check**:
- DLQ message count
- Consumer error patterns (grep consumer code)
- max_retries setting

**Fix**:
```
❌ Issue: 150 messages in DLQ

Common causes:
1. Invalid message format (missing fields)
   → Add validation before processing
2. External API failures
   → Add retry logic with backoff
3. Logic errors in consumer
   → Check error logs for stack traces

Solution: Add error handling
  ```typescript
  for (const message of batch.messages) {
    try {
      // Validate message
      if (!message.body.userId) {
        console.error('Invalid message, skipping');
        message.ack(); // Don't retry invalid messages
        continue;
      }

      await processMessage(message.body);
      message.ack();
    } catch (error) {
      console.error('Processing failed:', error);
      // Message will retry, then go to DLQ
    }
  }
  ```

Check DLQ messages: wrangler queues info my-queue-dlq
```

### Issue 5: Consumer Errors

**Symptom**: Consumer throwing errors
**Check**: Run `wrangler tail` to see error logs

**Fix**:
```
❌ Issue: Consumer errors detected

Run diagnostics:
  wrangler tail

Common errors:
- "Cannot read property X" → Missing field validation
- "Timeout" → Processing too slow (reduce batch size)
- "429 from external API" → External rate limiting

Solution: Add defensive coding
  ```typescript
  // Validate fields before access
  const userId = message.body.user?.userId;
  if (!userId) {
    console.error('Missing userId');
    message.ack(); // Skip
    continue;
  }

  // Add timeouts for external calls
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  ```
```

## Step 5: Generate Quick Report

Summarize findings:

```
Quick Troubleshoot Report: my-queue

Issues Found:
1. ❌ CRITICAL: No consumer configured
   → Add consumer binding to wrangler.jsonc
   → Deploy Worker with queue() handler

2. ⚠️ WARNING: DLQ not configured
   → Create DLQ: wrangler queues create my-queue-dlq
   → Add to consumer config: "dead_letter_queue": "my-queue-dlq"

3. ⚠️ WARNING: High backlog (250 messages)
   → Will clear once consumer is active

Configuration:
✅ Producer configured (MY_QUEUE → my-queue)
❌ Consumer NOT configured
❌ DLQ NOT configured

Immediate Actions:
1. Add consumer to wrangler.jsonc
2. Add queue() handler to Worker
3. Deploy: wrangler deploy
4. Monitor: wrangler tail

For detailed analysis, run: /queue-debugger (launches diagnostic agent)
```

## Step 6: Offer Next Steps

Based on issues found:

**If no consumer configured**:
```
Next Step: Add consumer configuration

Would you like me to:
1. Add consumer binding to wrangler.jsonc
2. Generate queue() handler code
3. Both

Type the number or I can do both automatically.
```

**If DLQ issues**:
```
Next Step: Investigate DLQ messages

Options:
1. Show DLQ status: wrangler queues info my-queue-dlq
2. Analyze error patterns (requires consumer logs)
3. Launch queue-debugger agent for full analysis

Recommendation: Launch queue-debugger for comprehensive diagnosis
```

**If performance issues**:
```
Next Step: Optimize queue settings

Options:
1. Launch queue-optimizer agent
   → Analyzes configuration
   → Suggests optimal batch size, concurrency
   → Generates optimized wrangler.jsonc

2. Manual tuning
   → Increase max_batch_size: 10 → 25
   → Increase max_concurrency: 1 → 5

Recommendation: Use queue-optimizer for data-driven recommendations
```

**If no issues found**:
```
✅ No critical issues detected!

Queue appears healthy:
- Configuration valid
- No backlog buildup
- Consumer active

Recommendations:
- Monitor with: wrangler queues info my-queue
- Set up DLQ if not configured (production best practice)
- Review best practices: Load references/best-practices.md
```

---

## Error Handling

### Queue Not Found
```
❌ Error: Queue 'my-queue' not found

Check:
1. Verify queue name: wrangler queues list
2. Create queue if needed: wrangler queues create my-queue

Available queues:
<list from wrangler queues list>
```

### Wrangler Not Authenticated
```
❌ Error: Not authenticated

Solution:
1. Run: wrangler login
2. Retry troubleshooting command
```

### Configuration File Missing
```
❌ Error: wrangler.jsonc not found

Cannot check configuration without wrangler.jsonc.

Create one? (y/n)
If yes → Run queue-setup wizard
```

---

## Summary

This command provides **quick queue troubleshooting** through 6 steps:
1. Validate input (queue name)
2. Quick status check (wrangler queues info)
3. Configuration check (wrangler.jsonc validation)
4. Common issues check (5 common problems)
5. Generate quick report (summary of findings)
6. Offer next steps (actionable recommendations)

**Output**: Quick diagnosis with immediate fixes and recommendations.

**When to Use**: Fast troubleshooting for known issues. For comprehensive analysis, use `/queue-debugger` agent instead.

**Escalation Path**: If quick fixes don't resolve, automatically suggest queue-debugger agent for full 9-phase diagnostic.
