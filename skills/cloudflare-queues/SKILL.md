---
name: cloudflare-queues
description: |
  Complete knowledge domain for Cloudflare Queues - flexible message queue for asynchronous processing
  and background tasks on Cloudflare Workers.

  Use when: creating message queues, async processing, background jobs, batch processing, handling retries,
  configuring dead letter queues, implementing consumer concurrency, or encountering "queue timeout",
  "batch retry", "message lost", "throughput exceeded", "consumer not scaling" errors.

  Keywords: cloudflare queues, queues workers, message queue, queue bindings, async processing,
  background jobs, queue consumer, queue producer, batch processing, dead letter queue, dlq,
  message retry, queue ack, consumer concurrency, queue backlog, wrangler queues
license: MIT
metadata:
  version: "2.0.0"
  wrangler_version: "4.43.0"
  workers_types_version: "4.20251014.0"
  last_verified: "2025-10-21"
  errors_prevented: 10
  templates_included: 6
  references_included: 6
---

# Cloudflare Queues

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0

---

## Quick Start (10 Minutes)

### 1. Create Queue

```bash
npx wrangler queues create my-queue
npx wrangler queues list
```

### 2. Producer (Send Messages)

**wrangler.jsonc:**

```jsonc
{
  "name": "my-producer",
  "main": "src/index.ts",
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",
        "queue": "my-queue"
      }
    ]
  }
}
```

**src/index.ts:**

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/send', async (c) => {
  await c.env.MY_QUEUE.send({
    userId: '123',
    action: 'process-order',
    timestamp: Date.now(),
  });

  return c.json({ status: 'queued' });
});

export default app;
```

### 3. Consumer (Process Messages)

**wrangler.jsonc:**

```jsonc
{
  "name": "my-consumer",
  "main": "src/consumer.ts",
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"
      }
    ]
  }
}
```

**src/consumer.ts:**

```typescript
import type { MessageBatch } from '@cloudflare/workers-types';

export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      console.log('Processing:', message.body);
      // Your logic here
    }
    // Implicit ack: returning successfully acknowledges all messages
  },
};
```

**Deploy:**

```bash
npx wrangler deploy
```

**Load**: `references/setup-guide.md` for complete 6-step setup with DLQ configuration

---

## Critical Rules

### Always Do ✅

1. **Configure Dead Letter Queue** for production queues
2. **Use explicit ack()** for non-idempotent operations (DB writes, API calls)
3. **Validate message size** before sending (<128 KB)
4. **Use sendBatch()** for multiple messages (more efficient)
5. **Implement exponential backoff** for retries
6. **Set appropriate batch settings** based on workload
7. **Monitor queue backlog** and consumer errors
8. **Use ctx.waitUntil()** for async cleanup in consumers
9. **Handle errors gracefully** - log, alert, retry
10. **Let concurrency auto-scale** (don't set max_concurrency unless needed)

### Never Do ❌

1. **Never assume message ordering** - not guaranteed FIFO
2. **Never rely on implicit ack for non-idempotent ops** - use explicit ack()
3. **Never send messages >128 KB** - will fail
4. **Never delete queues with active messages** - data loss
5. **Never skip DLQ configuration** in production
6. **Never exceed 5000 msg/s per queue** - rate limit error
7. **Never process messages synchronously in loop** - use Promise.all()
8. **Never ignore message.attempts** - use for backoff logic
9. **Never set max_concurrency=1** unless you have a very specific reason
10. **Never forget to ack()** in explicit acknowledgement patterns

---

## Top 5 Errors (See references/error-catalog.md for all 10)

### Error #1: Message Too Large

**Problem**: Message exceeds 128 KB limit

**Solution**: Store large data in R2, send reference

```typescript
// ❌ Wrong
await env.MY_QUEUE.send({ data: largeArray }); // >128 KB fails

// ✅ Correct
const message = { data: largeArray };
const size = new TextEncoder().encode(JSON.stringify(message)).length;

if (size > 128000) {
  const key = `messages/${crypto.randomUUID()}.json`;
  await env.MY_BUCKET.put(key, JSON.stringify(message));
  await env.MY_QUEUE.send({ type: 'large-message', r2Key: key });
} else {
  await env.MY_QUEUE.send(message);
}
```

### Error #2: Throughput Exceeded

**Problem**: Exceeding 5000 messages/second per queue

**Solution**: Use sendBatch() and rate limiting

```typescript
// ❌ Wrong
for (let i = 0; i < 10000; i++) {
  await env.MY_QUEUE.send({ id: i }); // Too fast!
}

// ✅ Correct
const messages = Array.from({ length: 10000 }, (_, i) => ({
  body: { id: i },
}));

// Send in batches of 100
for (let i = 0; i < messages.length; i += 100) {
  await env.MY_QUEUE.sendBatch(messages.slice(i, i + 100));
}
```

### Error #3: Entire Batch Retried When One Message Fails

**Problem**: Single message failure causes all messages to retry

**Solution**: Use explicit acknowledgement

```typescript
// ❌ Wrong - implicit ack
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await env.DB.prepare('INSERT INTO orders VALUES (?, ?)').bind(
        message.body.id,
        message.body.amount
      ).run();
    }
    // If any fails, ALL retry!
  },
};

// ✅ Correct - explicit ack
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await env.DB.prepare('INSERT INTO orders VALUES (?, ?)').bind(
          message.body.id,
          message.body.amount
        ).run();

        message.ack(); // Only ack on success
      } catch (error) {
        console.error(`Failed: ${message.id}`, error);
        // Don't ack - will retry independently
      }
    }
  },
};
```

### Error #4: Messages Deleted Without Processing

**Problem**: Messages disappear after max retries

**Solution**: Configure Dead Letter Queue

```bash
# Create DLQ
npx wrangler queues create my-dlq
```

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_retries": 3,
      "dead_letter_queue": "my-dlq"  // Add this!
    }]
  }
}
```

### Error #5: Consumer Not Auto-Scaling

**Problem**: Consumer stays at low concurrency despite backlog

**Solution**: Remove max_concurrency limit

```jsonc
// ❌ Wrong
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_concurrency": 1  // Won't scale!
    }]
  }
}

// ✅ Correct
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      // Don't set max_concurrency - auto-scale
      "max_batch_size": 50  // Increase batch size instead
    }]
  }
}
```

**Load `references/error-catalog.md` for all 10 errors with detailed solutions.**

---

## Common Use Cases

### Use Case 1: Basic Message Queue

**When**: Simple async job processing (emails, notifications)

**Quick Pattern**:

```typescript
// Producer
await env.MY_QUEUE.send({ type: 'email', to: 'user@example.com' });

// Consumer (implicit ack - for idempotent operations)
export default {
  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      await sendEmail(message.body.to, message.body.content);
    }
  },
};
```

**Load**: `templates/queues-producer.ts` + `templates/queues-consumer-basic.ts`

### Use Case 2: Database Writes (Non-Idempotent)

**When**: Writing to database, must avoid duplicates

**Load**: `templates/queues-consumer-explicit-ack.ts` + `references/consumer-api.md`

### Use Case 3: Retry with Exponential Backoff

**When**: Calling rate-limited APIs, temporary failures

**Load**: `templates/queues-retry-with-delay.ts` + `references/error-catalog.md` (Error #2, #3)

### Use Case 4: Dead Letter Queue Pattern

**When**: Production systems, need to capture permanently failed messages

**Load**: `templates/queues-dlq-pattern.ts` + `references/setup-guide.md` (Step 4)

### Use Case 5: High Throughput Processing

**When**: Processing thousands of messages per second

**Quick Pattern**:

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 100,        // Large batches
      "max_batch_timeout": 5,       // Fast processing
      "max_concurrency": null       // Auto-scale
    }]
  }
}
```

**Load**: `references/best-practices.md` → Optimizing Throughput

---

## When to Load References

**Load `references/setup-guide.md` when**:
- User needs complete setup walkthrough (queue → producer → consumer → DLQ)
- First time setting up Cloudflare Queues
- Need production configuration examples
- Want complete end-to-end example

**Load `references/error-catalog.md` when**:
- Encountering any of the 10 documented errors
- Troubleshooting queue issues
- Messages not being delivered/processed
- Need prevention checklist

**Load `references/producer-api.md` when**:
- Need complete producer API reference
- Using send() or sendBatch() methods
- Need message format specifications
- Handling large messages or batches

**Load `references/consumer-api.md` when**:
- Need complete consumer API reference
- Using explicit ack(), retry(), or retryAll()
- Need batch processing patterns
- Implementing complex consumer logic

**Load `references/best-practices.md` when**:
- Optimizing queue performance
- Production deployment guidance
- Monitoring and observability setup
- Security and reliability patterns

**Load `references/wrangler-commands.md` when**:
- Need CLI commands reference
- Managing queues (create, delete, list)
- Controlling delivery (pause, resume)
- Debugging queue issues

---

## Limits & Quotas

**Critical limits:**

- **Message size**: 128 KB max per message
- **Throughput**: 5,000 messages/second per queue
- **Batch size**: 100 messages max per sendBatch()
- **Consumer CPU time**: 30 seconds (default), 300 seconds (max with config)
- **Max retries**: Configurable (default 3)
- **Queue name**: Max 63 characters, lowercase/numbers/hyphens

**Load `references/best-practices.md` for handling limits and optimization strategies.**

---

## Configuration Reference

### Minimal Producer

```jsonc
{
  "queues": {
    "producers": [{
      "binding": "MY_QUEUE",
      "queue": "my-queue"
    }]
  }
}
```

### Production Consumer

```jsonc
{
  "queues": {
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 100,          // Process more per invocation
      "max_batch_timeout": 5,         // Wait max 5 seconds to fill batch
      "max_retries": 3,               // Retry failed messages 3 times
      "dead_letter_queue": "my-dlq",  // Capture permanently failed messages
      "max_concurrency": null         // Auto-scale (recommended)
    }]
  },
  "limits": {
    "cpu_ms": 30000                   // 30 seconds (increase if needed)
  }
}
```

**Load `references/setup-guide.md` → Step 6 for complete production configuration.**

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete 6-step setup (queue → producer → consumer → DLQ → deploy → production config)
- **error-catalog.md** - All 10 errors with solutions + prevention checklist
- **producer-api.md** - Complete producer API (send, sendBatch, message format)
- **consumer-api.md** - Complete consumer API (ack, retry, batch processing)
- **best-practices.md** - Performance, monitoring, security, reliability patterns
- **wrangler-commands.md** - CLI reference (create, delete, list, pause, resume)

### Templates (templates/)

- **queues-producer.ts** - Basic producer with single and batch sending
- **queues-consumer-basic.ts** - Implicit ack consumer (idempotent operations)
- **queues-consumer-explicit-ack.ts** - Explicit ack consumer (non-idempotent)
- **queues-retry-with-delay.ts** - Exponential backoff retry pattern
- **queues-dlq-pattern.ts** - Dead letter queue setup and consumer
- **wrangler-queues-config.jsonc** - Complete production configuration

---

## TypeScript Types

```typescript
import type { MessageBatch, Message } from '@cloudflare/workers-types';

// Producer binding
type Bindings = {
  MY_QUEUE: Queue;
};

// Consumer handler
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    // Process messages
  },
};

// Message structure
interface Message {
  id: string;
  timestamp: Date;
  body: any;
  attempts: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

// Batch structure
interface MessageBatch {
  queue: string;
  messages: Message[];
  ackAll(): void;
  retryAll(options?: { delaySeconds?: number }): void;
}
```

---

## Monitoring & Debugging

```bash
# Check queue status
npx wrangler queues info my-queue

# Monitor consumer logs
npx wrangler tail my-consumer

# Check DLQ
npx wrangler queues info my-dlq

# Pause/resume delivery
npx wrangler queues pause-delivery my-queue
npx wrangler queues resume-delivery my-queue
```

**Load `references/wrangler-commands.md` for complete CLI reference.**

---

## Production Checklist

Before deploying to production:

- [ ] Dead Letter Queue created and configured
- [ ] DLQ consumer deployed and monitoring set up
- [ ] Explicit ack() for non-idempotent operations
- [ ] Message size validation (<128 KB)
- [ ] Batch size optimized for workload
- [ ] max_concurrency NOT set (let it auto-scale) unless specific reason
- [ ] CPU limit increased if processing >30 seconds
- [ ] Error handling with retry logic implemented
- [ ] Monitoring and alerting configured
- [ ] Rate limiting for external APIs
- [ ] Idempotent operations where possible
- [ ] Load testing completed

**Load `references/best-practices.md` → Production Deployment section.**

---

## Related Skills

- **cloudflare-worker-base** - Worker setup and configuration
- **cloudflare-d1** - Database integration for queue consumers
- **cloudflare-r2** - Store large message payloads
- **cloudflare-workflows** - More complex orchestration needs

---

## Official Documentation

- **Cloudflare Queues**: https://developers.cloudflare.com/queues/
- **Configuration**: https://developers.cloudflare.com/queues/configuration/
- **Wrangler Commands**: https://developers.cloudflare.com/workers/wrangler/commands/#queues
- **Limits**: https://developers.cloudflare.com/queues/platform/limits/
- **Troubleshooting**: https://developers.cloudflare.com/queues/observability/troubleshooting/
- **Best Practices**: https://developers.cloudflare.com/queues/configuration/best-practices/

---

**Questions? Issues?**

1. Check `references/error-catalog.md` for all 10 errors and solutions
2. Review `references/setup-guide.md` for complete setup walkthrough
3. See `references/best-practices.md` for production patterns
4. Check official docs: https://developers.cloudflare.com/queues/
