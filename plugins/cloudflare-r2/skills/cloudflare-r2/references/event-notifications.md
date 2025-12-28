# R2 Event Notifications

**Last Updated**: 2025-12-27

Configure Workers to automatically respond to R2 object changes (uploads, deletions) using event notifications and Cloudflare Queues integration.

---

## Overview

R2 event notifications enable event-driven workflows by automatically triggering Workers when objects are created, updated, or deleted in R2 buckets. Events are delivered through Cloudflare Queues for reliable, asynchronous processing.

**Common Use Cases**:
- Resize images on upload
- Generate thumbnails automatically
- Update database indexes when files are added
- Backup files to secondary storage on upload
- Clean up related resources when files are deleted
- Trigger webhooks for external systems
- Analytics and audit logging

---

## Event Subscription Setup

### 1. Create Queue for Events

```bash
# Create queue to receive R2 events
bunx wrangler queues create r2-events
```

### 2. Configure Event Notifications

**Option A: Wrangler Configuration**

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "r2-event-handler",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",

  // R2 bucket binding
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket",
      // Configure event notifications
      "event_notification_rules": [
        {
          "queue": "r2-events",
          "rules": [
            {
              "prefix": "images/",     // Only images folder
              "suffix": ".jpg"          // Only JPG files
            }
          ]
        }
      ]
    }
  ],

  // Queue consumer binding
  "queues": {
    "consumers": [
      {
        "queue": "r2-events",
        "max_batch_size": 10,
        "max_batch_timeout": 5,
        "max_retries": 3,
        "dead_letter_queue": "r2-events-dlq"
      }
    ]
  }
}
```

**Option B: Dashboard Configuration**

1. Navigate to R2 → Select bucket
2. Click "Settings" tab
3. Scroll to "Event Notifications"
4. Click "Create notification rule"
5. Configure:
   - **Queue name**: Select your queue
   - **Event types**: object-create, object-delete
   - **Prefix filter**: Optional path prefix (e.g., "uploads/")
   - **Suffix filter**: Optional file extension (e.g., ".png")

---

## Event Payload Structure

### Object Created Event

```typescript
interface R2ObjectCreatedEvent {
  account: string;           // Cloudflare account ID
  action: 'PutObject';       // Event type
  bucket: string;            // Bucket name
  object: {
    key: string;             // Object key
    size: number;            // File size in bytes
    eTag: string;            // Object ETag
  };
  eventTime: string;         // ISO 8601 timestamp
}
```

### Object Deleted Event

```typescript
interface R2ObjectDeletedEvent {
  account: string;
  action: 'DeleteObject';
  bucket: string;
  object: {
    key: string;             // Deleted object key
  };
  eventTime: string;
}
```

---

## Event Handler Worker

### Basic Event Handler

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

interface Env extends Bindings {
  // Queue will be automatically available
}

export default {
  async queue(batch: MessageBatch<R2Event>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;

      try {
        await handleR2Event(event, env);
        message.ack(); // Acknowledge successful processing
      } catch (error) {
        console.error('Failed to process event:', error);
        message.retry(); // Retry on failure
      }
    }
  }
};

async function handleR2Event(event: R2Event, env: Env) {
  console.log(`Event: ${event.action} on ${event.object.key}`);

  if (event.action === 'PutObject') {
    await handleObjectCreated(event, env);
  } else if (event.action === 'DeleteObject') {
    await handleObjectDeleted(event, env);
  }
}

async function handleObjectCreated(event: R2ObjectCreatedEvent, env: Env) {
  const key = event.object.key;

  // Example: Process only images
  if (key.startsWith('images/') && key.match(/\.(jpg|png|webp)$/)) {
    console.log(`New image uploaded: ${key} (${event.object.size} bytes)`);

    // Trigger image processing (resize, thumbnail generation, etc.)
    await processImage(key, env);
  }
}

async function handleObjectDeleted(event: R2ObjectDeletedEvent, env: Env) {
  const key = event.object.key;
  console.log(`Object deleted: ${key}`);

  // Clean up related resources
  await cleanupRelatedResources(key, env);
}

type R2Event = R2ObjectCreatedEvent | R2ObjectDeletedEvent;
```

---

## Common Patterns

### Pattern 1: Image Resize on Upload

```typescript
async function processImage(key: string, env: Env) {
  // Get original image
  const original = await env.MY_BUCKET.get(key);

  if (!original) {
    console.error(`Object not found: ${key}`);
    return;
  }

  const imageData = await original.arrayBuffer();

  // Resize image (using Cloudflare Images or external service)
  const resized = await resizeImage(imageData, { width: 800, height: 600 });

  // Store resized version
  const resizedKey = key.replace('images/', 'images/resized/');
  await env.MY_BUCKET.put(resizedKey, resized, {
    httpMetadata: {
      contentType: original.httpMetadata?.contentType || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      originalKey: key,
      processedAt: new Date().toISOString(),
    },
  });

  console.log(`Resized image stored: ${resizedKey}`);
}

async function resizeImage(data: ArrayBuffer, options: { width: number; height: number }): Promise<ArrayBuffer> {
  // Use Cloudflare Images API, sharp, or external image service
  // Placeholder implementation
  return data;
}
```

### Pattern 2: Thumbnail Generation

```typescript
async function generateThumbnails(key: string, env: Env) {
  const original = await env.MY_BUCKET.get(key);

  if (!original) return;

  const imageData = await original.arrayBuffer();

  // Generate multiple thumbnail sizes
  const sizes = [
    { name: 'small', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
  ];

  for (const size of sizes) {
    const thumbnail = await resizeImage(imageData, size);
    const thumbnailKey = `thumbnails/${size.name}/${key}`;

    await env.MY_BUCKET.put(thumbnailKey, thumbnail, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        size: size.name,
        originalKey: key,
      },
    });
  }

  console.log(`Thumbnails generated for: ${key}`);
}
```

### Pattern 3: Database Index Update

```typescript
async function updateDatabaseIndex(event: R2ObjectCreatedEvent, env: Env) {
  // Update database with new file metadata
  await env.DB.prepare(
    `INSERT INTO files (key, size, uploaded_at, etag)
     VALUES (?, ?, ?, ?)`
  )
    .bind(
      event.object.key,
      event.object.size,
      event.eventTime,
      event.object.eTag
    )
    .run();

  console.log(`Database updated for: ${event.object.key}`);
}

async function cleanupDatabaseIndex(event: R2ObjectDeletedEvent, env: Env) {
  // Remove file from database
  await env.DB.prepare(`DELETE FROM files WHERE key = ?`)
    .bind(event.object.key)
    .run();

  console.log(`Database cleaned up for: ${event.object.key}`);
}
```

### Pattern 4: Backup to Secondary Storage

```typescript
async function backupToSecondary(key: string, env: Env) {
  const object = await env.MY_BUCKET.get(key);

  if (!object) return;

  const data = await object.arrayBuffer();

  // Store in backup bucket
  await env.BACKUP_BUCKET.put(key, data, {
    httpMetadata: object.httpMetadata,
    customMetadata: {
      ...object.customMetadata,
      backedUpAt: new Date().toISOString(),
      originalBucket: env.MY_BUCKET.name,
    },
  });

  console.log(`Backed up to secondary: ${key}`);
}
```

### Pattern 5: Webhook Notification

```typescript
async function sendWebhook(event: R2Event, env: Env) {
  const webhookUrl = env.WEBHOOK_URL;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Event-Type': event.action,
    },
    body: JSON.stringify({
      action: event.action,
      bucket: event.bucket,
      object: event.object,
      timestamp: event.eventTime,
    }),
  });

  console.log(`Webhook sent for: ${event.object.key}`);
}
```

---

## Error Handling and Retries

### Retry Logic with Exponential Backoff

```typescript
async function handleEventWithRetry(event: R2Event, env: Env, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await handleR2Event(event, env);
      return; // Success
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error; // Will go to dead letter queue
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }
}
```

### Dead Letter Queue Handling

```typescript
// Separate worker for processing failed events
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;

      // Log failed event for manual investigation
      console.error('Event processing failed multiple times:', {
        action: event.action,
        key: event.object.key,
        timestamp: event.eventTime,
        retries: message.attempts,
      });

      // Store in persistent storage for later retry
      await env.FAILED_EVENTS.put(
        `failed/${Date.now()}-${event.object.key}`,
        JSON.stringify(event)
      );

      message.ack(); // Acknowledge to prevent further retries
    }
  }
};
```

---

## Event Filtering

### Prefix and Suffix Filters

Filter events by object path:

```jsonc
{
  "event_notification_rules": [
    {
      "queue": "image-processing",
      "rules": [
        {
          "prefix": "uploads/images/",
          "suffix": ".jpg"
        },
        {
          "prefix": "uploads/images/",
          "suffix": ".png"
        }
      ]
    },
    {
      "queue": "video-processing",
      "rules": [
        {
          "prefix": "uploads/videos/",
          "suffix": ".mp4"
        }
      ]
    }
  ]
}
```

### Application-Level Filtering

Filter events in Worker code:

```typescript
async function handleR2Event(event: R2Event, env: Env) {
  const key = event.object.key;

  // Filter by file type
  if (key.match(/\.(jpg|png|webp)$/)) {
    await processImage(key, env);
  } else if (key.match(/\.(mp4|mov|avi)$/)) {
    await processVideo(key, env);
  } else if (key.match(/\.(pdf|doc|docx)$/)) {
    await processDocument(key, env);
  } else {
    console.log(`Ignoring file: ${key}`);
  }
}
```

---

## Performance Considerations

### Batch Processing

Process events in batches for efficiency:

```typescript
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env): Promise<void> {
    // Group events by type
    const createEvents: R2ObjectCreatedEvent[] = [];
    const deleteEvents: R2ObjectDeletedEvent[] = [];

    for (const message of batch.messages) {
      if (message.body.action === 'PutObject') {
        createEvents.push(message.body as R2ObjectCreatedEvent);
      } else {
        deleteEvents.push(message.body as R2ObjectDeletedEvent);
      }
    }

    // Process batches
    if (createEvents.length > 0) {
      await processBatchCreated(createEvents, env);
    }

    if (deleteEvents.length > 0) {
      await processBatchDeleted(deleteEvents, env);
    }

    // Acknowledge all messages
    batch.messages.forEach(m => m.ack());
  }
};

async function processBatchCreated(events: R2ObjectCreatedEvent[], env: Env) {
  // Process multiple events in parallel
  await Promise.all(
    events.map(event => handleObjectCreated(event, env))
  );
}
```

### Async Processing

Use Durable Objects for long-running tasks:

```typescript
async function handleLargeFileUpload(event: R2ObjectCreatedEvent, env: Env) {
  // For large files, use Durable Object for processing
  const id = env.FILE_PROCESSOR.idFromName(event.object.key);
  const processor = env.FILE_PROCESSOR.get(id);

  await processor.fetch(new Request('https://dummy/process', {
    method: 'POST',
    body: JSON.stringify(event),
  }));

  console.log(`Async processing started for: ${event.object.key}`);
}
```

---

## Monitoring and Debugging

### Logging Best Practices

```typescript
async function handleR2Event(event: R2Event, env: Env) {
  const startTime = Date.now();

  console.log('Event received:', {
    action: event.action,
    key: event.object.key,
    size: event.object.size,
    timestamp: event.eventTime,
  });

  try {
    await processEvent(event, env);

    const duration = Date.now() - startTime;
    console.log('Event processed successfully:', {
      key: event.object.key,
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error('Event processing failed:', {
      key: event.object.key,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

### Testing Events Locally

Trigger test events manually:

```typescript
// Development endpoint to simulate events
app.post('/test/event', async (c) => {
  const testEvent: R2ObjectCreatedEvent = {
    account: 'test-account',
    action: 'PutObject',
    bucket: 'test-bucket',
    object: {
      key: 'test/image.jpg',
      size: 1024,
      eTag: 'test-etag',
    },
    eventTime: new Date().toISOString(),
  };

  await handleR2Event(testEvent, c.env);

  return c.json({ success: true, message: 'Test event processed' });
});
```

---

## Security Best Practices

1. **Validate event payloads** - Verify event structure before processing
2. **Use dead letter queues** - Catch failed events for investigation
3. **Implement idempotency** - Handle duplicate events safely
4. **Set reasonable timeouts** - Prevent infinite processing loops
5. **Monitor queue depth** - Alert on backlog buildup
6. **Use environment variables** - Keep sensitive config out of code
7. **Limit batch sizes** - Prevent memory exhaustion
8. **Add authentication** - Secure webhook endpoints

---

## Troubleshooting

### Events Not Triggering

**Check**:
- Event notification rule configured correctly in wrangler.jsonc or Dashboard
- Queue exists and is bound to Worker
- Prefix/suffix filters match your objects
- Worker is deployed and queue consumer is active

**Test**:
```bash
# Check queue status
bunx wrangler queues list

# View queue consumer
bunx wrangler queues consumer list r2-events
```

### Events Stuck in Queue

**Check**:
- Worker queue handler is processing messages
- No infinite retry loops (check logs)
- Dead letter queue configured for failed messages
- Batch size and timeout settings appropriate

**Monitor**:
```bash
# View queue metrics in Dashboard
# R2 → Queues → [your-queue] → Metrics
```

### Duplicate Event Processing

**Solution**: Implement idempotency using event.object.eTag:

```typescript
// Track processed ETags to prevent duplicates
const processedEvents = new Set<string>();

async function handleR2Event(event: R2Event, env: Env) {
  const eventId = `${event.object.key}-${event.object.eTag}`;

  if (processedEvents.has(eventId)) {
    console.log(`Duplicate event ignored: ${eventId}`);
    return;
  }

  processedEvents.add(eventId);
  await processEvent(event, env);
}
```

---

## Official Documentation

- **Event Notifications**: https://developers.cloudflare.com/r2/buckets/event-notifications/
- **Queues**: https://developers.cloudflare.com/queues/
- **Queue Consumers**: https://developers.cloudflare.com/queues/configuration/consumer-concurrency/
- **Dead Letter Queues**: https://developers.cloudflare.com/queues/configuration/dead-letter-queues/

---

**Ready to automate R2 workflows with event-driven architecture!**
