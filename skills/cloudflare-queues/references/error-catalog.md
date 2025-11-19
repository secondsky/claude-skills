# Cloudflare Queues Error Catalog

Complete catalog of 10 documented errors with solutions and troubleshooting.

---

## Error #1: Message Too Large

**Error**: Message exceeds 128 KB limit

**Source**: Cloudflare Queues Limits documentation

**Why It Happens**: Message body exceeds the 128 KB per-message limit

**Solution**: Store large data in R2, send reference

```typescript
// ❌ Bad: Message >128 KB
await env.MY_QUEUE.send({
  data: largeArray, // >128 KB
});

// ✅ Good: Check size before sending
const message = { data: largeArray };
const size = new TextEncoder().encode(JSON.stringify(message)).length;

if (size > 128000) {
  // Store in R2, send reference
  const key = `messages/${crypto.randomUUID()}.json`;
  await env.MY_BUCKET.put(key, JSON.stringify(message));
  await env.MY_QUEUE.send({ type: 'large-message', r2Key: key });
} else {
  await env.MY_QUEUE.send(message);
}
```

**In consumer - retrieve from R2:**

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      if (message.body.type === 'large-message') {
        const object = await env.MY_BUCKET.get(message.body.r2Key);
        const largeData = await object.json();

        // Process large data
        await process(largeData);

        // Cleanup
        await env.MY_BUCKET.delete(message.body.r2Key);
        message.ack();
      } else {
        await process(message.body);
        message.ack();
      }
    }
  },
};
```

---

## Error #2: Throughput Exceeded

**Error**: Exceeding 5000 messages/second per queue

**Source**: Cloudflare Queues Limits

**Why It Happens**: Sending too many messages too quickly

**Solution**: Use sendBatch() and rate limiting

```typescript
// ❌ Bad: Exceeding 5000 msg/s per queue
for (let i = 0; i < 10000; i++) {
  await env.MY_QUEUE.send({ id: i }); // Too fast!
}

// ✅ Good: Use sendBatch
const messages = Array.from({ length: 10000 }, (_, i) => ({
  body: { id: i },
}));

// Send in batches of 100
for (let i = 0; i < messages.length; i += 100) {
  await env.MY_QUEUE.sendBatch(messages.slice(i, i + 100));
}

// ✅ Even better: Rate limit with delay
for (let i = 0; i < messages.length; i += 100) {
  await env.MY_QUEUE.sendBatch(messages.slice(i, i + 100));
  if (i + 100 < messages.length) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  }
}
```

---

## Error #3: Consumer Timeout (CPU Limit Exceeded)

**Error**: Consumer exceeds CPU time limit (default 30 seconds)

**Source**: Cloudflare Workers CPU limits

**Why It Happens**: Message processing takes longer than CPU limit

**Solution**: Increase CPU limit in wrangler.jsonc

```typescript
// ❌ Bad: Long processing without CPU limit increase
export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      await processForMinutes(message.body); // CPU timeout!
    }
  },
};
```

**wrangler.jsonc:**

```jsonc
{
  "limits": {
    "cpu_ms": 300000  // 5 minutes (max allowed)
  }
}
```

**Alternative: Break into smaller chunks**

```typescript
// ✅ Process in smaller batches
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Process in parallel chunks
    const chunkSize = 5;
    for (let i = 0; i < batch.messages.length; i += chunkSize) {
      const chunk = batch.messages.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (message) => {
          await process(message.body);
          message.ack();
        })
      );
    }
  },
};
```

---

## Error #4: Queue Backlog Growing

**Error**: Messages accumulating faster than consumer can process

**Source**: Queue metrics showing growing backlog

**Why It Happens**: Consumer too slow, not scaling, or errors blocking processing

**Solution**: Multiple approaches

**Solution 1: Increase batch size**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 100  // Process more per invocation (default 10)
    }]
  }
}
```

**Solution 2: Let concurrency auto-scale**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      // Don't set max_concurrency - let it auto-scale
      "max_batch_size": 100
    }]
  }
}
```

**Solution 3: Optimize consumer code (parallel processing)**

```typescript
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // ❌ Bad: Sequential processing
    // for (const message of batch.messages) {
    //   await process(message.body);
    // }

    // ✅ Good: Parallel processing
    await Promise.all(
      batch.messages.map(async (message) => {
        await process(message.body);
        message.ack();
      })
    );
  },
};
```

---

## Error #5: Messages Not Being Delivered to Consumer

**Error**: Messages sent but never reach consumer

**Source**: Queue monitoring

**Why It Happens**: Consumer not deployed, wrong queue name, delivery paused, or consumer errors

**Solution**: Systematic debugging

```bash
# 1. Check queue info (verify messages exist)
npx wrangler queues info my-queue

# 2. Check if delivery paused
npx wrangler queues resume-delivery my-queue

# 3. Verify consumer is deployed
npx wrangler deployments list

# 4. Check consumer logs for errors
npx wrangler tail my-consumer

# 5. Verify queue name in wrangler.jsonc matches
```

**Common misconfigurations:**

```jsonc
// ❌ Wrong: Queue name mismatch
{
  "queues": {
    "consumers": [{
      "queue": "my-qeue"  // Typo!
    }]
  }
}

// ✅ Correct: Exact queue name
{
  "queues": {
    "consumers": [{
      "queue": "my-queue"  // Must match exactly
    }]
  }
}
```

---

## Error #6: Entire Batch Retried When One Message Fails

**Error**: Single message failure causes all messages in batch to retry

**Source**: Implicit acknowledgement behavior

**Why It Happens**: Using implicit ack with non-idempotent operations

**Solution**: Use explicit acknowledgement

```typescript
// ❌ Bad: Implicit ack with non-idempotent operations
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // DB write - non-idempotent!
      await env.DB.prepare(
        'INSERT INTO orders (id, amount) VALUES (?, ?)'
      ).bind(message.body.id, message.body.amount).run();
    }
    // If any message fails, ALL retry!
  },
};

// ✅ Good: Explicit ack per message
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await env.DB.prepare(
          'INSERT INTO orders (id, amount) VALUES (?, ?)'
        ).bind(message.body.id, message.body.amount).run();

        message.ack(); // Only ack on success
      } catch (error) {
        console.error(`Failed: ${message.id}`, error);
        // Don't ack - will retry independently
      }
    }
  },
};
```

---

## Error #7: Messages Deleted Without Processing

**Error**: Messages disappear after max retries without going to DLQ

**Source**: Missing DLQ configuration

**Why It Happens**: No Dead Letter Queue configured, messages deleted after max_retries

**Solution**: Configure DLQ

```bash
# 1. Create DLQ
npx wrangler queues create my-dlq

# 2. Add to consumer config
```

**wrangler.jsonc:**

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_retries": 3,
      "dead_letter_queue": "my-dlq"  // CRITICAL: Add this!
    }]
  }
}
```

**Create DLQ consumer:**

```typescript
// src/dlq-consumer.ts
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Log failed message
      console.error('PERMANENTLY FAILED:', {
        id: message.id,
        attempts: message.attempts,
        body: message.body,
      });

      // Store for manual review
      await env.DB.prepare(
        'INSERT INTO failed_messages (id, body, failed_at) VALUES (?, ?, ?)'
      ).bind(
        message.id,
        JSON.stringify(message.body),
        new Date().toISOString()
      ).run();

      message.ack();
    }
  },
};
```

---

## Error #8: Consumer Not Auto-Scaling

**Error**: Consumer stays at low concurrency despite growing backlog

**Source**: Consumer configuration

**Why It Happens**: max_concurrency set too low, consumer errors, or no backlog

**Solution**: Remove max_concurrency limit

```jsonc
// ❌ Bad: Limits scaling
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_concurrency": 1  // Won't scale!
    }]
  }
}

// ✅ Good: Auto-scale
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      // Don't set max_concurrency - let it scale automatically
      "max_batch_size": 50  // Increase batch size instead
    }]
  }
}
```

**When to set max_concurrency:**
- Rate-limited external APIs
- Database connection limits
- Resource contention issues

Otherwise: **let it auto-scale** (don't set it).

---

## Error #9: Queue Name Already Exists

**Error**: `Error: Queue name already in use`

**Source**: `wrangler queues create`

**Why It Happens**: Attempting to create queue with existing name

**Solution**: Use different name or check existing queues

```bash
# Check existing queues
npx wrangler queues list

# Delete queue if no longer needed
npx wrangler queues delete old-queue

# Or use different name
npx wrangler queues create my-queue-v2
```

---

## Error #10: Message Lost / Not Retried

**Error**: Message fails but doesn't retry

**Source**: Explicit ack() called even on failure

**Why It Happens**: Accidentally calling ack() in catch block

**Solution**: Only ack() on success

```typescript
// ❌ Bad: Ack on failure (message lost!)
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await process(message.body);
      } catch (error) {
        console.error('Failed:', error);
      }

      message.ack(); // ❌ Called even on error!
    }
  },
};

// ✅ Good: Only ack on success
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await process(message.body);
        message.ack(); // ✅ Only called on success
      } catch (error) {
        console.error('Failed:', error);
        // Don't ack - will retry
      }
    }
  },
};
```

---

## Troubleshooting Guide

### Problem: High DLQ message count

**Solution**:
1. Check DLQ consumer logs for error patterns
2. Review business logic - are messages valid?
3. Check external dependencies (APIs, databases)
4. Consider increasing max_retries if transient failures

```bash
# Check DLQ size
npx wrangler queues info my-dlq

# Monitor DLQ consumer
npx wrangler tail my-dlq-consumer
```

### Problem: Messages processed multiple times (duplicates)

**Solution**:
1. Make operations idempotent (use upsert, not insert)
2. Use explicit ack() for non-idempotent operations
3. Track processed message IDs in database

```typescript
// Idempotent operation
await env.DB.prepare(
  'INSERT INTO orders (id, amount) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET amount = ?'
).bind(messageId, amount, amount).run();
```

### Problem: Consumer running but not processing messages

**Solution**:
1. Check consumer logs for errors
2. Verify consumer function signature (must be `queue()` export)
3. Check bindings are correctly configured

```typescript
// ❌ Wrong: Missing export
const queue = async (batch: MessageBatch) => { /* ... */ };

// ✅ Correct: Proper export
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Process messages
  },
};
```

---

## Prevention Checklist

Use this to avoid all 10 errors:

- [ ] Message size validated before sending (<128 KB)
- [ ] Using sendBatch() for multiple messages (not individual sends)
- [ ] CPU limit increased if processing >30 seconds
- [ ] max_batch_size optimized for workload
- [ ] max_concurrency NOT set (let it auto-scale) unless specific reason
- [ ] Dead Letter Queue created and configured
- [ ] DLQ consumer deployed and monitored
- [ ] Explicit ack() used for non-idempotent operations
- [ ] Only ack() called on success (not in error handler)
- [ ] Queue names match exactly between producer and consumer configs
- [ ] Consumer deployed before sending messages
- [ ] Operations made idempotent where possible
- [ ] External dependencies have retry logic with backoff

---

**Official Resources**:
- Cloudflare Queues Docs: https://developers.cloudflare.com/queues/
- Limits & Quotas: https://developers.cloudflare.com/queues/platform/limits/
- Troubleshooting: https://developers.cloudflare.com/queues/observability/troubleshooting/
