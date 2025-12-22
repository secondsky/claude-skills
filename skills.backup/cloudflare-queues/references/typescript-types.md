# Cloudflare Queues TypeScript Types Reference

**Last Updated**: 2025-11-26
**Package**: `@cloudflare/workers-types@4.20251126.0`

---

## Complete Type Definitions

### Queue Interface (Producer)

```typescript
import type { Queue } from '@cloudflare/workers-types';

interface Queue {
  /**
   * Send a single message to the queue
   * @param body - Message payload (any JSON-serializable value)
   * @param options - Optional send configuration
   * @returns Promise<void>
   */
  send(body: any, options?: QueueSendOptions): Promise<void>;

  /**
   * Send multiple messages in a batch
   * @param messages - Array of messages or message bodies
   * @returns Promise<void>
   */
  sendBatch(messages: Array<MessageSendRequest>): Promise<void>;
}
```

### QueueSendOptions

```typescript
interface QueueSendOptions {
  /**
   * Delay delivery by specified seconds (0-43200, max 12 hours)
   */
  delaySeconds?: number;

  /**
   * Additional metadata for message tracking
   * Not part of message body, available in consumer
   */
  contentType?: string;
}
```

### MessageSendRequest

```typescript
interface MessageSendRequest {
  /**
   * Message payload (any JSON-serializable value)
   */
  body: any;

  /**
   * Optional delay for this specific message
   */
  delaySeconds?: number;

  /**
   * Optional content type for message
   */
  contentType?: string;
}
```

---

## Consumer Types

### MessageBatch Interface

```typescript
import type { MessageBatch } from '@cloudflare/workers-types';

interface MessageBatch<Body = unknown> {
  /**
   * Name of the queue this batch is from
   */
  queue: string;

  /**
   * Array of messages in this batch
   */
  messages: Message<Body>[];

  /**
   * Acknowledge all messages in batch
   * Call AFTER successfully processing all messages
   */
  ackAll(): void;

  /**
   * Retry all messages in batch with optional delay
   * Call when batch processing fails
   */
  retryAll(options?: { delaySeconds?: number }): void;
}
```

### Message Interface

```typescript
interface Message<Body = unknown> {
  /**
   * Unique message ID (UUID format)
   */
  id: string;

  /**
   * Timestamp when message was sent
   */
  timestamp: Date;

  /**
   * Message payload (parsed from JSON)
   */
  body: Body;

  /**
   * Number of delivery attempts (starts at 1)
   * Increments after each retry
   */
  attempts: number;

  /**
   * Acknowledge this specific message
   * Call AFTER successfully processing
   * REQUIRED for non-idempotent operations
   */
  ack(): void;

  /**
   * Retry this specific message with optional delay
   * Message will be redelivered after delay
   * @param options.delaySeconds - Delay before retry (0-43200 seconds)
   */
  retry(options?: { delaySeconds?: number }): void;
}
```

---

## Consumer Handler Type

```typescript
// Complete consumer handler interface
export default {
  async queue(
    batch: MessageBatch<YourMessageType>,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Process messages
    for (const message of batch.messages) {
      try {
        // Your processing logic
        await processMessage(message.body);

        // Explicit ack (required for non-idempotent operations)
        message.ack();
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);

        // Retry with exponential backoff
        const delay = Math.min(Math.pow(2, message.attempts) * 60, 3600);
        message.retry({ delaySeconds: delay });
      }
    }
  },
};
```

---

## Common Type Patterns

### Typed Message Body

```typescript
// Define your message structure
interface OrderMessage {
  orderId: string;
  userId: string;
  amount: number;
  items: Array<{ sku: string; quantity: number }>;
}

// Use in consumer
export default {
  async queue(
    batch: MessageBatch<OrderMessage>,
    env: Env
  ): Promise<void> {
    for (const message of batch.messages) {
      // message.body is now typed as OrderMessage
      const { orderId, userId, amount, items } = message.body;

      // Process with type safety
      await processOrder(orderId, userId, amount, items);
      message.ack();
    }
  },
};
```

### Type-Safe Producer Bindings

```typescript
// Define environment bindings
interface Env {
  ORDERS_QUEUE: Queue;
  NOTIFICATIONS_QUEUE: Queue;
  DATABASE: D1Database;
}

// Use in Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const order: OrderMessage = await request.json();

    // Type-safe queue access
    await env.ORDERS_QUEUE.send(order);

    return new Response('Order queued', { status: 202 });
  },
};
```

### Batch Send with Types

```typescript
interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

async function sendBulkEmails(
  emails: EmailMessage[],
  queue: Queue
): Promise<void> {
  // Convert to MessageSendRequest format
  const messages: MessageSendRequest[] = emails.map(email => ({
    body: email,
    contentType: 'application/json',
  }));

  // Send batch (max 100 messages per batch)
  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    await queue.sendBatch(chunk);
  }
}
```

---

## ExecutionContext Type

```typescript
interface ExecutionContext {
  /**
   * Extend Worker lifetime for async operations
   * Use when processing needs to continue after response sent
   */
  waitUntil(promise: Promise<any>): void;

  /**
   * Pass through to underlying execution context
   */
  passThroughOnException(): void;
}

// Usage in consumer
export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Process messages synchronously
    for (const message of batch.messages) {
      await processMessage(message.body);
      message.ack();
    }

    // Optional: Background cleanup (doesn't block ack)
    ctx.waitUntil(cleanupResources());
  },
};
```

---

## Generic Type Utilities

### Type Guard for Message Validation

```typescript
function isValidOrderMessage(body: unknown): body is OrderMessage {
  return (
    typeof body === 'object' &&
    body !== null &&
    'orderId' in body &&
    'userId' in body &&
    'amount' in body
  );
}

// Usage in consumer
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      if (!isValidOrderMessage(message.body)) {
        console.error('Invalid message format:', message.body);
        message.ack(); // Don't retry invalid messages
        continue;
      }

      // message.body is now type-safe OrderMessage
      await processOrder(message.body);
      message.ack();
    }
  },
};
```

---

## Official Documentation

- **Workers Types Package**: https://www.npmjs.com/package/@cloudflare/workers-types
- **Queue API Reference**: https://developers.cloudflare.com/queues/configuration/javascript-apis/
- **TypeScript Configuration**: https://developers.cloudflare.com/workers/languages/typescript/

---

**Note**: Always use the latest version of `@cloudflare/workers-types` for accurate type definitions. Run `npm view @cloudflare/workers-types` to check for updates.
