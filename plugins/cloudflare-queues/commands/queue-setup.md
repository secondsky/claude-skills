---
name: cloudflare-queues:setup
description: Interactive wizard to set up Cloudflare Queues with queue creation, producer/consumer binding configuration, and Dead Letter Queue setup. Use when user wants to create first queue or add queues to existing Worker.
---

# Queue Setup Wizard

## Overview

Interactive wizard for complete Cloudflare Queues setup: create queue, configure producer/consumer bindings, set up DLQ, and provide example code.

## Prerequisites

Check before starting:
- Cloudflare account with wrangler authenticated (`wrangler whoami`)
- Existing Worker project or willingness to create one
- Write access to wrangler.jsonc/wrangler.toml

## Steps

### Step 1: Gather Requirements

Use AskUserQuestion to collect setup preferences.

**Question 1: Queue Name**
- Header: "Queue Name"
- Question: "What should the queue be named?"
- multiSelect: false
- Options:
  - Label: "Descriptive name (e.g., order-processing)"
    Description: "Describes what the queue processes"
  - Label: "Environment-specific (e.g., prod-notifications)"
    Description: "Includes environment in the name"
- Store user response as: `queueName`
- If user provides custom text, validate: alphanumeric + hyphens only

**Question 2: Queue Purpose**
- Header: "Purpose"
- Question: "What will this queue be used for?"
- multiSelect: false
- Options:
  - Label: "Producer only (send messages from Worker)"
    Description: "Worker will send messages to queue, consumed elsewhere"
  - Label: "Consumer only (process messages in Worker)"
    Description: "Worker will process messages from queue"
  - Label: "Both producer and consumer (Recommended)"
    Description: "Worker will both send and process messages"
- Store as: `queuePurpose`

**Question 3: Consumer Settings** (if purpose includes consumer)
- Header: "Consumer"
- Question: "Which consumer settings?"
- multiSelect: false
- Options:
  - Label: "Standard (batch: 10, retries: 3, concurrency: 1) (Recommended)"
    Description: "Balanced settings for most use cases"
  - Label: "High throughput (batch: 50, retries: 1, concurrency: 5)"
    Description: "Fast processing for high-volume queues"
  - Label: "Low latency (batch: 1, retries: 3, concurrency: 1)"
    Description: "Minimal delay for time-sensitive messages"
  - Label: "Custom (I'll specify)"
    Description: "Provide your own batch size, retries, concurrency"
- Store as: `consumerSettings`
- If "Custom" selected, ask follow-up for batch_size, max_retries, max_concurrency

**Question 4: Dead Letter Queue**
- Header: "DLQ"
- Question: "Enable Dead Letter Queue for failed messages?"
- multiSelect: false
- Options:
  - Label: "Yes - Recommended for production"
    Description: "Captures failed messages after max retries"
  - Label: "No - Skip for now"
    Description: "Can add later if needed"
- Store as: `enableDLQ`

---

### Step 2: Create Queue

Execute wrangler command based on user inputs:

```bash
# Create main queue
wrangler queues create <queueName>
```

**Capture output**: Extract queue creation confirmation

**Error Handling**:
- If "not authenticated" → Run `wrangler login` first, then retry
- If "queue already exists" → Ask user:
  - Use existing queue?
  - Choose different name?
- If "limit reached" → Check free tier limit (10 queues), suggest:
  - Upgrade to Workers Paid ($5/month) → unlimited queues
  - Delete unused queues: `wrangler queues list` then `wrangler queues delete <name>`
  - Consolidate into fewer queues

**Verify creation**:
```bash
wrangler queues list
```

---

### Step 3: Create Dead Letter Queue (if enabled)

If `enableDLQ` is true:

```bash
# Create DLQ
wrangler queues create <queueName>-dlq
```

**Verify**:
```bash
wrangler queues list
```

---

### Step 4: Configure Producer Binding (if needed)

If `queuePurpose` includes "Producer":

Check if wrangler.jsonc or wrangler.toml exists:
```bash
if [ -f "wrangler.jsonc" ]; then
  CONFIG_FILE="wrangler.jsonc"
elif [ -f "wrangler.toml" ]; then
  CONFIG_FILE="wrangler.toml"
else
  # Ask user which format to create
  CONFIG_FILE="wrangler.jsonc"  # Default to JSON
fi
```

**Add Producer Configuration**:

**If wrangler.jsonc**:
Use Edit tool to add to `queues.producers` array (or create array if doesn't exist):

```jsonc
{
  "queues": {
    "producers": [
      {
        "binding": "<QUEUE_BINDING>",  // e.g., "ORDER_QUEUE"
        "queue": "<queueName>"          // e.g., "order-processing"
      }
    ]
  }
}
```

**Binding name suggestion**: Convert queue name to SCREAMING_SNAKE_CASE
- Example: "order-processing" → "ORDER_QUEUE"
- Example: "notifications" → "NOTIFICATIONS"

**If wrangler.toml**:
```toml
[[queues.producers]]
binding = "<QUEUE_BINDING>"
queue = "<queueName>"
```

**Verify**:
```bash
# Show configuration to user
cat wrangler.jsonc | grep -A 10 "queues"
```

---

### Step 5: Configure Consumer Binding (if needed)

If `queuePurpose` includes "Consumer":

**Add Consumer Configuration** based on `consumerSettings`:

**Standard settings** (batch: 10, retries: 3, concurrency: 1):
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "<queueName>",
        "max_batch_size": 10,
        "max_retries": 3,
        "max_concurrency": 1,
        "dead_letter_queue": "<queueName>-dlq"  // If DLQ enabled
      }
    ]
  }
}
```

**High throughput settings** (batch: 50, retries: 1, concurrency: 5):
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "<queueName>",
        "max_batch_size": 50,
        "max_retries": 1,
        "max_concurrency": 5,
        "dead_letter_queue": "<queueName>-dlq"  // If DLQ enabled
      }
    ]
  }
}
```

**Low latency settings** (batch: 1, retries: 3, concurrency: 1):
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "<queueName>",
        "max_batch_size": 1,
        "max_retries": 3,
        "max_concurrency": 1,
        "dead_letter_queue": "<queueName>-dlq"  // If DLQ enabled
      }
    ]
  }
}
```

**Custom settings**: Use user-provided values

**Omit DLQ field** if `enableDLQ` is false.

**Verify**:
```bash
cat wrangler.jsonc | grep -A 15 "consumers"
```

---

### Step 6: Generate TypeScript Types

Create src/types.ts (or add to existing) with Queue binding types:

**If Producer only**:
```typescript
// src/types.ts
export interface Bindings {
  <QUEUE_BINDING>: Queue;
  // Example: ORDER_QUEUE: Queue;
}
```

**If Consumer only**:
```typescript
// src/types.ts
import { MessageBatch } from '@cloudflare/workers-types';

export interface Bindings {
  // Add other bindings here (DB, KV, etc.)
}

export interface QueueMessage {
  // Define your message structure
  type: string;
  // Add other fields based on your use case
}
```

**If Both**:
```typescript
// src/types.ts
import { MessageBatch } from '@cloudflare/workers-types';

export interface Bindings {
  <QUEUE_BINDING>: Queue;
}

export interface QueueMessage {
  type: string;
  // Add fields based on your use case
}
```

**Check if file exists**:
```bash
if [ -f "src/types.ts" ]; then
  # Append to existing file
else
  # Create new file
fi
```

---

### Step 7: Provide Example Code

**If Producer only**:

Show example of sending messages:

```typescript
// src/index.ts - Producer example
import { Hono } from 'hono';

type Bindings = {
  <QUEUE_BINDING>: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// Send single message
app.post('/send', async (c) => {
  const body = await c.req.json();

  await c.env.<QUEUE_BINDING>.send({
    type: 'order-created',
    orderId: body.orderId,
    userId: body.userId,
    timestamp: Date.now()
  });

  return c.json({ status: 'queued' });
});

// Send batch of messages
app.post('/send-batch', async (c) => {
  const items = await c.req.json<Array<any>>();

  await c.env.<QUEUE_BINDING>.sendBatch(
    items.map(item => ({
      body: {
        type: 'batch-process',
        itemId: item.id,
        data: item.data
      }
    }))
  );

  return c.json({ status: 'queued', count: items.length });
});

export default app;
```

**If Consumer only**:

Show example of processing messages:

```typescript
// src/index.ts - Consumer example
import { MessageBatch } from '@cloudflare/workers-types';

interface Bindings {
  // Add your bindings (DB, KV, etc.)
}

export default {
  async queue(batch: MessageBatch, env: Bindings, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Process message
        const data = message.body;
        console.log('Processing:', data);

        // Your processing logic here
        await processMessage(data, env);

        // Explicitly ack (optional - auto-acks if no error)
        message.ack();
      } catch (error) {
        console.error('Failed to process message:', error);
        // Message will retry up to max_retries, then go to DLQ
        message.retry();
      }
    }
  }
};

async function processMessage(data: any, env: Bindings) {
  // Your processing logic
  console.log('Processing message:', data);
}
```

**If Both (Producer + Consumer)**:

Show combined example:

```typescript
// src/index.ts - Producer + Consumer
import { Hono } from 'hono';
import { MessageBatch } from '@cloudflare/workers-types';

type Bindings = {
  <QUEUE_BINDING>: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

// Producer endpoint
app.post('/orders', async (c) => {
  const order = await c.req.json();

  await c.env.<QUEUE_BINDING>.send({
    type: 'order-created',
    orderId: order.id,
    userId: order.userId,
    timestamp: Date.now()
  });

  return c.json({ status: 'queued', orderId: order.id });
});

export default {
  // HTTP handler
  fetch: app.fetch,

  // Queue consumer
  async queue(batch: MessageBatch, env: Bindings): Promise<void> {
    for (const message of batch.messages) {
      try {
        const data = message.body;

        if (data.type === 'order-created') {
          // Process order
          console.log('Processing order:', data.orderId);
          // Add your logic here
        }

        message.ack();
      } catch (error) {
        console.error('Failed:', error);
        message.retry();
      }
    }
  }
};
```

---

### Step 8: Provide Next Steps

**Success Message**:
```
✅ Cloudflare Queues Setup Complete!

Queue Configuration:
- Queue: <queueName>
- Producer: env.<QUEUE_BINDING> (if applicable)
- Consumer: Active with <settings> (if applicable)
- DLQ: <queueName>-dlq (if enabled)

Files Modified:
- wrangler.jsonc (queue bindings added)
- src/types.ts (TypeScript types added)

Next Steps:

1. Review the example code above and integrate into your Worker

2. Deploy your Worker:
   ```bash
   wrangler deploy
   ```

3. Test message publishing (if producer):
   ```bash
   curl -X POST https://your-worker.workers.dev/send \
     -H "Content-Type: application/json" \
     -d '{"orderId": "12345", "userId": "user_789"}'
   ```

4. Monitor queue status:
   ```bash
   wrangler queues info <queueName>
   ```

5. View consumer logs:
   ```bash
   wrangler tail
   ```

6. Check DLQ for failures (if enabled):
   ```bash
   wrangler queues info <queueName>-dlq
   ```

📚 Helpful Resources:
- Complete examples: Load `templates/queues-producer.ts` and `templates/queues-consumer-basic.ts`
- Error handling: Load `references/error-catalog.md`
- Best practices: Load `references/best-practices.md`
- Limits & quotas: Load `references/limits-quotas.md`

💡 Tips:
- Always use explicit message.ack() for critical processing
- Configure DLQ to catch all failures
- Monitor backlog with `wrangler queues info <queue-name>`
- Use sendBatch() for multiple messages (reduces API calls)
```

---

## Error Handling

### Wrangler Not Authenticated
```
❌ Error: Not authenticated

Solution:
1. Run: wrangler login
2. Follow authentication flow
3. Re-run setup command
```

### Queue Already Exists
```
❌ Error: Queue '<queueName>' already exists

Solution:
1. Use existing queue: Continue with setup
2. Choose different name: Start over with new name
3. Delete existing: wrangler queues delete <queueName> (if unused)
```

### Invalid Configuration
```
❌ Error: Invalid wrangler.jsonc syntax

Solution:
1. Check JSON syntax (missing commas, brackets)
2. Validate with: jq . wrangler.jsonc
3. Fix syntax errors
4. Re-run setup
```

### Queue Limit Reached
```
❌ Error: Account queue limit reached (10 queues on free plan)

Solutions:
1. Upgrade to Workers Paid ($5/month) → unlimited queues
2. Delete unused queues:
   wrangler queues list
   wrangler queues delete <unused-queue>
3. Consolidate into fewer queues
```

---

## Example Full Workflow

**User Input**:
- Queue name: "order-processing"
- Purpose: Both producer and consumer
- Consumer settings: Standard
- DLQ: Yes

**Executed Commands**:
```bash
# 1. Create main queue
wrangler queues create order-processing
# Output: ✅ Created queue 'order-processing'

# 2. Create DLQ
wrangler queues create order-processing-dlq
# Output: ✅ Created queue 'order-processing-dlq'

# 3. Verify
wrangler queues list
# Output:
#   order-processing
#   order-processing-dlq
```

**wrangler.jsonc (after setup)**:
```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-15",

  "queues": {
    "producers": [
      {
        "binding": "ORDER_QUEUE",
        "queue": "order-processing"
      }
    ],
    "consumers": [
      {
        "queue": "order-processing",
        "max_batch_size": 10,
        "max_retries": 3,
        "max_concurrency": 1,
        "dead_letter_queue": "order-processing-dlq"
      }
    ]
  }
}
```

**Result**:
```
✅ Setup complete!
- Queue: order-processing
- Producer: env.ORDER_QUEUE
- Consumer: batch_size=10, retries=3, concurrency=1
- DLQ: order-processing-dlq

Deploy with: wrangler deploy
```

---

## Summary

This command provides **interactive Cloudflare Queues setup** through 8 guided steps:
1. Gather requirements (via AskUserQuestion)
2. Create main queue (wrangler queues create)
3. Create DLQ (if enabled)
4. Configure producer binding (wrangler.jsonc)
5. Configure consumer binding (wrangler.jsonc)
6. Generate TypeScript types
7. Provide example code (producer/consumer/both)
8. Provide next steps and resources

**Output**: Fully configured queue ready for use, with helpful code examples and next steps.

**When to Use**: First-time queue setup or adding queues to existing Worker project.
