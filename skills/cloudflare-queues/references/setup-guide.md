# Cloudflare Queues Complete Setup Guide

Complete 6-step setup process from creating queues to deploying producers and consumers.

---

## Step 1: Create Queue

```bash
# Create a new queue
npx wrangler queues create my-queue

# Output:
# ✅ Successfully created queue my-queue

# List all queues
npx wrangler queues list

# Get queue info
npx wrangler queues info my-queue
```

**Queue naming:**
- Lowercase letters, numbers, hyphens
- Must start with letter
- Max 63 characters

---

## Step 2: Set Up Producer (Send Messages)

Producers send messages to queues.

**wrangler.jsonc:**

```jsonc
{
  "name": "my-producer",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",           // Available as env.MY_QUEUE
        "queue": "my-queue"               // Queue name from step 1
      }
    ]
  }
}
```

**src/index.ts (Producer):**

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// Send single message
app.post('/send', async (c) => {
  const body = await c.req.json();

  await c.env.MY_QUEUE.send({
    userId: body.userId,
    action: 'process-order',
    timestamp: Date.now(),
  });

  return c.json({ status: 'queued' });
});

// Send batch of messages
app.post('/send-batch', async (c) => {
  const items = await c.req.json();

  await c.env.MY_QUEUE.sendBatch(
    items.map((item) => ({
      body: { userId: item.userId, action: item.action },
    }))
  );

  return c.json({ status: 'queued', count: items.length });
});

export default app;
```

**Deploy producer:**

```bash
npx wrangler deploy
```

---

## Step 3: Set Up Consumer (Process Messages)

Consumers receive and process messages from queues.

**wrangler.jsonc:**

```jsonc
{
  "name": "my-consumer",
  "main": "src/consumer.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",              // Queue to consume from
        "max_batch_size": 10,             // Process up to 10 messages per batch
        "max_batch_timeout": 30,          // Wait max 30 seconds to fill batch
        "max_retries": 3,                 // Retry failed messages 3 times
        "max_concurrency": null           // Auto-scale (recommended)
      }
    ]
  }
}
```

**src/consumer.ts:**

```typescript
import type { MessageBatch } from '@cloudflare/workers-types';

export interface Env {
  // Add your bindings here (D1, KV, R2, etc.)
}

export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      console.log(`Processing message ${message.id}:`, message.body);

      // Your processing logic here
      await processMessage(message.body);
    }

    // Implicit acknowledgement: returning successfully acks all messages
  },
};

async function processMessage(data: any) {
  // Process the message
  console.log('Processed:', data);
}
```

**Deploy consumer:**

```bash
npx wrangler deploy
```

---

## Step 4: Configure Dead Letter Queue (Production)

DLQ captures messages that fail after max retries.

**Create DLQ:**

```bash
npx wrangler queues create my-dlq
```

**Update wrangler.jsonc (consumer):**

```jsonc
{
  "name": "my-consumer",
  "main": "src/consumer.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"      // Add DLQ
      }
    ]
  }
}
```

**Create DLQ consumer (src/dlq-consumer.ts):**

```typescript
import type { MessageBatch } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
}

export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Log failed message
      console.error('PERMANENTLY FAILED MESSAGE:', {
        id: message.id,
        attempts: message.attempts,
        body: message.body,
        timestamp: message.timestamp,
      });

      // Store in database for manual review
      await env.DB.prepare(
        'INSERT INTO failed_messages (id, body, attempts, failed_at) VALUES (?, ?, ?, ?)'
      ).bind(
        message.id,
        JSON.stringify(message.body),
        message.attempts,
        new Date().toISOString()
      ).run();

      // Acknowledge to remove from DLQ
      message.ack();
    }
  },
};
```

**Create DLQ consumer wrangler.jsonc:**

```jsonc
{
  "name": "my-dlq-consumer",
  "main": "src/dlq-consumer.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "consumers": [
      {
        "queue": "my-dlq",
        "max_batch_size": 10
      }
    ]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "your-db-id"
    }
  ]
}
```

**Deploy DLQ consumer:**

```bash
npx wrangler deploy
```

---

## Step 5: Test End-to-End

**Send test message:**

```bash
curl -X POST https://your-producer.workers.dev/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "action": "test"}'
```

**Check queue status:**

```bash
npx wrangler queues info my-queue
```

**Monitor consumer logs:**

```bash
npx wrangler tail my-consumer
```

---

## Step 6: Production Configuration

### Optimize batch settings

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 100,           // Larger batches for efficiency
        "max_batch_timeout": 5,          // Lower timeout for faster processing
        "max_retries": 3,
        "dead_letter_queue": "my-dlq",
        "max_concurrency": null          // Let it auto-scale
      }
    ]
  },
  "limits": {
    "cpu_ms": 30000                      // 30 seconds (default)
  }
}
```

### Adjust for workload

**High throughput (fast messages):**
- `max_batch_size`: 100
- `max_batch_timeout`: 5
- `max_concurrency`: null (auto-scale)

**CPU-intensive (slow processing):**
- `max_batch_size`: 10
- `max_batch_timeout`: 30
- Increase `limits.cpu_ms` if needed (max 300000 = 5 min)

**Bursty traffic:**
- Don't set `max_concurrency` (let it auto-scale)
- Use DLQ for reliability
- Monitor backlog size

### Set up monitoring

**Check queue health:**

```bash
npx wrangler queues info my-queue
```

**Monitor consumer:**

```bash
npx wrangler tail my-consumer --format json
```

**Key metrics to watch:**
- Queue backlog size (messages waiting)
- Consumer error rate
- Message processing time
- DLQ message count

---

## Complete Example: Order Processing System

**Producer (orders-api):**

```typescript
import { Hono } from 'hono';

type Bindings = {
  ORDERS_QUEUE: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/orders', async (c) => {
  const order = await c.req.json();

  // Send to queue for async processing
  await c.env.ORDERS_QUEUE.send({
    orderId: order.id,
    userId: order.userId,
    amount: order.amount,
    items: order.items,
    timestamp: Date.now(),
  });

  return c.json({
    orderId: order.id,
    status: 'processing'
  });
});

export default app;
```

**Consumer (orders-processor):**

```typescript
import type { MessageBatch } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  PAYMENT_API_KEY: string;
}

export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const order = message.body;

        // Process payment
        const payment = await fetch('https://payment-api.example.com/charge', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.PAYMENT_API_KEY}` },
          body: JSON.stringify({
            amount: order.amount,
            userId: order.userId,
          }),
        });

        if (!payment.ok) {
          throw new Error(`Payment failed: ${payment.statusText}`);
        }

        // Update database
        await env.DB.prepare(
          'INSERT INTO orders (id, user_id, amount, status) VALUES (?, ?, ?, ?)'
        ).bind(order.orderId, order.userId, order.amount, 'completed').run();

        // Explicit ack on success
        message.ack();

        console.log(`Order ${order.orderId} processed successfully`);
      } catch (error) {
        console.error(`Failed to process order ${message.body.orderId}:`, error);

        // Retry with exponential backoff
        const delaySeconds = Math.min(
          60 * Math.pow(2, message.attempts - 1),
          3600 // Max 1 hour
        );

        message.retry({ delaySeconds });
      }
    }
  },
};
```

**wrangler.jsonc (producer):**

```jsonc
{
  "name": "orders-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "producers": [
      {
        "binding": "ORDERS_QUEUE",
        "queue": "orders"
      }
    ]
  }
}
```

**wrangler.jsonc (consumer):**

```jsonc
{
  "name": "orders-processor",
  "main": "src/consumer.ts",
  "compatibility_date": "2025-10-11",
  "queues": {
    "consumers": [
      {
        "queue": "orders",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "orders-dlq"
      }
    ]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "orders-db",
      "database_id": "your-db-id"
    }
  ]
}
```

---

**Official Documentation:**
- Cloudflare Queues: https://developers.cloudflare.com/queues/
- Wrangler Queues Commands: https://developers.cloudflare.com/workers/wrangler/commands/#queues
- Configuration: https://developers.cloudflare.com/queues/configuration/
