# R2 Event Notifications Integration with Queues

**Official Feature**: Trigger queue messages automatically when R2 objects are created, updated, or deleted.

**When to Use**: Load this reference when the user asks to "trigger queue on file upload", "process R2 events", "react to R2 changes", "implement event-driven R2 workflow", or needs to automate actions based on R2 bucket events.

---

## Overview

R2 Event Notifications automatically send messages to Cloudflare Queues when objects in an R2 bucket are created, updated, or deleted. This enables event-driven architectures for:
- **Image processing**: Resize/optimize images on upload
- **Document workflows**: Extract metadata, generate previews
- **Data pipelines**: Trigger ETL jobs when data files arrive
- **Backup systems**: Replicate files across buckets
- **Audit logging**: Track all bucket modifications

**Key Benefits**:
- **Zero polling**: No need to continuously check bucket for changes
- **Near real-time**: Events delivered within seconds
- **Scalable**: Handles millions of events automatically
- **Reliable**: Guaranteed delivery with retries and DLQ support

---

## Architecture Pattern

```
┌─────────────┐
│ File Upload │
│   to R2     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌───────────────┐
│   R2 Bucket     │─────▶│ Queue Message │
│  (e.g., uploads)│      │ (PutObject)   │
└─────────────────┘      └───────┬───────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │ Queue Consumer  │
                         │    (Worker)     │
                         └────────┬────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
           ┌─────────┐     ┌─────────┐    ┌─────────┐
           │  Resize │     │ Extract │    │ Update  │
           │  Image  │     │Metadata │    │Database │
           └─────────┘     └─────────┘    └─────────┘
```

**Flow**:
1. User uploads file to R2 bucket
2. R2 generates event notification
3. Event automatically published to queue
4. Queue consumer (Worker) processes event
5. Consumer performs actions (resize image, update DB, etc.)

---

## Use Cases

### 1. Automated Image Processing
Resize and optimize images on upload:

```typescript
// wrangler.jsonc - R2 bucket config
{
  "name": "image-processor",
  "r2_buckets": [
    {
      "binding": "UPLOADS",
      "bucket_name": "user-uploads",
      "event_notifications": {
        "queue": "image-processing-queue",
        "rules": [
          {
            "actions": ["PutObject"],
            "prefix": "images/",
            "suffix": [".jpg", ".png", ".webp"]
          }
        ]
      }
    }
  ],
  "queues": {
    "consumers": [
      {
        "queue": "image-processing-queue",
        "max_batch_size": 10
      }
    ]
  }
}

// Worker consumer - Process uploaded images
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    for (const message of batch.messages) {
      const event = message.body;

      if (event.action === 'PutObject') {
        const objectKey = event.object.key; // e.g., "images/photo.jpg"

        // Download original image
        const object = await env.UPLOADS.get(objectKey);
        const imageData = await object.arrayBuffer();

        // Resize to thumbnails
        const thumbnail = await resizeImage(imageData, 200, 200);
        const medium = await resizeImage(imageData, 800, 800);

        // Upload resized versions
        await env.UPLOADS.put(`${objectKey}-thumb.jpg`, thumbnail);
        await env.UPLOADS.put(`${objectKey}-medium.jpg`, medium);

        // Update database
        await env.DB.prepare(
          'INSERT INTO images (original, thumbnail, medium) VALUES (?, ?, ?)'
        ).bind(objectKey, `${objectKey}-thumb.jpg`, `${objectKey}-medium.jpg`).run();
      }
    }
  }
}
```

### 2. Document Metadata Extraction
Extract metadata from uploaded PDFs/documents:

```typescript
// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "DOCUMENTS",
      "bucket_name": "company-documents",
      "event_notifications": {
        "queue": "document-processing-queue",
        "rules": [
          {
            "actions": ["PutObject"],
            "prefix": "uploads/",
            "suffix": [".pdf", ".docx"]
          }
        ]
      }
    }
  ]
}

// Worker consumer
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    for (const message of batch.messages) {
      const event = message.body;
      const objectKey = event.object.key;

      // Download document
      const object = await env.DOCUMENTS.get(objectKey);
      const documentData = await object.arrayBuffer();

      // Extract metadata (using AI Workers or external service)
      const metadata = await extractMetadata(documentData);

      // Store metadata in D1
      await env.DB.prepare(`
        INSERT INTO documents (key, filename, size, mime_type, upload_date, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        objectKey,
        metadata.filename,
        event.object.size,
        metadata.mimeType,
        event.object.uploaded,
        JSON.stringify(metadata.extracted)
      ).run();

      // Index for search
      await env.VECTORIZE.insert([{
        id: objectKey,
        values: metadata.embedding,
        metadata: { filename: metadata.filename }
      }]);
    }
  }
}
```

### 3. Data Pipeline Trigger
Start ETL job when data files arrive:

```typescript
// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "DATA_LAKE",
      "bucket_name": "analytics-data",
      "event_notifications": {
        "queue": "etl-jobs-queue",
        "rules": [
          {
            "actions": ["PutObject"],
            "prefix": "raw-data/",
            "suffix": ".csv"
          }
        ]
      }
    }
  ]
}

// Worker consumer
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    for (const message of batch.messages) {
      const event = message.body;

      if (event.action === 'PutObject') {
        const objectKey = event.object.key; // e.g., "raw-data/sales-2025-12-27.csv"

        // Download CSV
        const object = await env.DATA_LAKE.get(objectKey);
        const csvData = await object.text();

        // Parse and transform
        const records = parseCSV(csvData);
        const transformed = transformRecords(records);

        // Load into database
        await batchInsert(env.DB, transformed);

        // Move to processed folder
        await env.DATA_LAKE.put(
          objectKey.replace('raw-data/', 'processed/'),
          csvData
        );

        // Delete original
        await env.DATA_LAKE.delete(objectKey);

        // Notify completion
        await env.NOTIFICATIONS.send({
          type: 'etl-complete',
          file: objectKey,
          recordCount: records.length
        });
      }
    }
  }
}
```

### 4. Cross-Region Replication
Replicate files to backup bucket on upload:

```typescript
// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "PRIMARY",
      "bucket_name": "primary-storage",
      "event_notifications": {
        "queue": "replication-queue",
        "rules": [
          {
            "actions": ["PutObject", "DeleteObject"],
            "prefix": "critical/"
          }
        ]
      }
    },
    {
      "binding": "BACKUP",
      "bucket_name": "backup-storage"
    }
  ]
}

// Worker consumer
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    for (const message of batch.messages) {
      const event = message.body;
      const objectKey = event.object.key;

      if (event.action === 'PutObject') {
        // Copy to backup bucket
        const object = await env.PRIMARY.get(objectKey);
        await env.BACKUP.put(objectKey, object.body, {
          customMetadata: {
            ...object.customMetadata,
            replicated_at: new Date().toISOString(),
            source: 'primary-storage'
          }
        });
      } else if (event.action === 'DeleteObject') {
        // Delete from backup bucket
        await env.BACKUP.delete(objectKey);
      }
    }
  }
}
```

---

## R2 Event Notification Configuration

### Enable Event Notifications

**Via wrangler.jsonc**:
```jsonc
{
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket",
      "event_notifications": {
        "queue": "my-events-queue",    // Required: Queue name
        "rules": [                      // Optional: Filter rules
          {
            "actions": ["PutObject"],   // Event types to trigger
            "prefix": "uploads/",       // Optional: Object key prefix
            "suffix": [".jpg", ".png"]  // Optional: Object key suffix(es)
          }
        ]
      }
    }
  ]
}
```

**Via wrangler CLI**:
```bash
# Enable event notifications for bucket
wrangler r2 bucket event-notifications create my-bucket \
  --queue my-events-queue \
  --event-type PutObject

# Add filter rule
wrangler r2 bucket event-notifications create my-bucket \
  --queue my-events-queue \
  --event-type PutObject,DeleteObject \
  --prefix uploads/ \
  --suffix .jpg,.png
```

**Via Dashboard**:
1. Go to R2 bucket settings
2. Navigate to "Event Notifications"
3. Click "Add notification"
4. Select queue and configure rules

---

## Event Notification Rules

### Available Event Types

| Event Type | Triggers When |
|-----------|---------------|
| `PutObject` | Object is created or updated |
| `DeleteObject` | Object is deleted |
| `CopyObject` | Object is copied (future) |

**Currently supported**: `PutObject` and `DeleteObject`

### Filter Rules

**Prefix filter** - Match objects by key prefix:
```jsonc
{
  "prefix": "images/"  // Only trigger for keys starting with "images/"
}
```

**Suffix filter** - Match objects by key suffix:
```jsonc
{
  "suffix": [".jpg", ".png", ".webp"]  // Only trigger for image files
}
```

**Combined filters** - Both prefix AND suffix must match:
```jsonc
{
  "prefix": "uploads/",
  "suffix": [".pdf", ".docx"]  // Only "uploads/*.{pdf,docx}"
}
```

**Multiple rules** - OR logic across rules:
```jsonc
{
  "rules": [
    {
      "actions": ["PutObject"],
      "prefix": "images/",
      "suffix": [".jpg", ".png"]
    },
    {
      "actions": ["PutObject"],
      "prefix": "documents/",
      "suffix": [".pdf"]
    }
  ]
}
```

---

## Event Message Format

### PutObject Event
```json
{
  "account": "abc123def456",
  "bucket": "my-bucket",
  "action": "PutObject",
  "object": {
    "key": "uploads/image.jpg",
    "size": 1048576,
    "eTag": "686897696a7c876b7e",
    "uploaded": "2025-12-27T10:30:00.000Z"
  },
  "eventTime": "2025-12-27T10:30:01.234Z"
}
```

**Fields**:
- `account`: Cloudflare account ID
- `bucket`: R2 bucket name
- `action`: Event type (`PutObject`, `DeleteObject`)
- `object.key`: Full object key path
- `object.size`: Object size in bytes
- `object.eTag`: Object ETag (hash)
- `object.uploaded`: When object was uploaded
- `eventTime`: When event was generated

### DeleteObject Event
```json
{
  "account": "abc123def456",
  "bucket": "my-bucket",
  "action": "DeleteObject",
  "object": {
    "key": "uploads/old-image.jpg"
  },
  "eventTime": "2025-12-27T10:35:00.123Z"
}
```

**Note**: DeleteObject events only include `key` (no size, eTag, uploaded)

---

## Processing Event Messages

### TypeScript Types
```typescript
// R2 event notification types
interface R2Event {
  account: string;
  bucket: string;
  action: 'PutObject' | 'DeleteObject';
  object: R2EventObject;
  eventTime: string;
}

interface R2EventObject {
  key: string;
  size?: number;        // Only for PutObject
  eTag?: string;        // Only for PutObject
  uploaded?: string;    // Only for PutObject
}

// Worker consumer
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;

      switch (event.action) {
        case 'PutObject':
          await handlePutObject(event, env);
          break;
        case 'DeleteObject':
          await handleDeleteObject(event, env);
          break;
      }
    }
  }
}

async function handlePutObject(event: R2Event, env: Env) {
  const { key, size, eTag } = event.object;

  console.log(`New object: ${key} (${size} bytes, eTag: ${eTag})`);

  // Download object
  const object = await env.MY_BUCKET.get(key);
  if (!object) {
    console.error(`Object ${key} not found`);
    return;
  }

  // Process object
  await processObject(object);
}

async function handleDeleteObject(event: R2Event, env: Env) {
  const { key } = event.object;

  console.log(`Deleted object: ${key}`);

  // Clean up related data
  await env.DB.prepare('DELETE FROM objects WHERE key = ?').bind(key).run();
}
```

### Accessing Object Content
```typescript
async function processUploadedObject(event: R2Event, env: Env) {
  // Get object from bucket
  const object = await env.MY_BUCKET.get(event.object.key);

  if (!object) {
    console.error(`Object ${event.object.key} not found`);
    return;
  }

  // Read content in different formats
  const arrayBuffer = await object.arrayBuffer(); // Binary data
  const text = await object.text();                // Text content
  const stream = object.body;                       // Stream

  // Access metadata
  const metadata = {
    httpMetadata: object.httpMetadata,      // Content-Type, Cache-Control, etc.
    customMetadata: object.customMetadata,   // User-defined metadata
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded
  };

  console.log(`Processing ${event.object.key}:`, metadata);
}
```

---

## Best Practices

### 1. Filter Events at Source
Use prefix/suffix filters to reduce unnecessary queue messages:

```jsonc
// ❌ Bad: Process all events, filter in consumer
{
  "event_notifications": {
    "queue": "all-events-queue",
    "rules": [{ "actions": ["PutObject"] }]  // No filtering
  }
}

// Consumer must filter:
if (event.object.key.endsWith('.jpg')) {
  await processImage(event);
}

// ✅ Good: Filter at R2 level
{
  "event_notifications": {
    "queue": "image-events-queue",
    "rules": [
      {
        "actions": ["PutObject"],
        "suffix": [".jpg", ".png", ".webp"]  // Filter at source
      }
    ]
  }
}

// Consumer processes only relevant events
await processImage(event);
```

### 2. Handle Missing Objects
Objects may be deleted between event and processing:

```typescript
async function processEvent(event: R2Event, env: Env) {
  const object = await env.MY_BUCKET.get(event.object.key);

  if (!object) {
    // Object was deleted - skip processing
    console.log(`Object ${event.object.key} already deleted, skipping`);
    return;
  }

  await processObject(object);
}
```

### 3. Idempotent Processing
Ensure processing can safely run multiple times:

```typescript
async function processImageIdempotent(event: R2Event, env: Env) {
  const key = event.object.key;
  const thumbnailKey = `${key}-thumb.jpg`;

  // Check if already processed
  const existing = await env.MY_BUCKET.head(thumbnailKey);
  if (existing) {
    console.log(`Thumbnail ${thumbnailKey} already exists, skipping`);
    return;
  }

  // Process image
  const object = await env.MY_BUCKET.get(key);
  const thumbnail = await resizeImage(await object.arrayBuffer(), 200, 200);
  await env.MY_BUCKET.put(thumbnailKey, thumbnail);
}
```

### 4. Batch Operations
Process multiple events efficiently:

```typescript
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    const putEvents = batch.messages
      .map(m => m.body)
      .filter(e => e.action === 'PutObject');

    // Batch download objects
    const objects = await Promise.all(
      putEvents.map(e => env.MY_BUCKET.get(e.object.key))
    );

    // Batch process
    const processed = await Promise.all(
      objects.map(obj => processObject(obj))
    );

    // Batch upload results
    await Promise.all(
      processed.map((data, i) =>
        env.MY_BUCKET.put(`processed/${putEvents[i].object.key}`, data)
      )
    );
  }
}
```

### 5. Error Handling with DLQ
Configure Dead Letter Queue for failed processing:

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "image-processing-queue",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "image-processing-dlq"
      }
    ]
  }
}
```

```typescript
async function processWithErrorHandling(event: R2Event, env: Env) {
  try {
    const object = await env.MY_BUCKET.get(event.object.key);

    if (!object) {
      // Object deleted - not an error, skip
      return;
    }

    await processObject(object);
  } catch (error) {
    console.error(`Failed to process ${event.object.key}:`, error);

    // Log to analytics
    await env.ANALYTICS.put(`errors/${event.object.key}`, {
      error: error.message,
      event,
      timestamp: new Date().toISOString()
    });

    // Re-throw to trigger retry/DLQ
    throw error;
  }
}
```

---

## Advanced Patterns

### Pattern 1: Multi-Stage Processing Pipeline
```typescript
// Stage 1: Initial upload triggers image queue
// R2 event → image-processing-queue → Resize & Upload thumbnails

// Stage 2: Thumbnail upload triggers metadata queue
// R2 event → metadata-extraction-queue → Extract metadata

// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "user-images",
      "event_notifications": {
        "queue": "image-processing-queue",
        "rules": [
          {
            "actions": ["PutObject"],
            "prefix": "originals/",
            "suffix": [".jpg", ".png"]
          }
        ]
      }
    },
    {
      "binding": "THUMBNAILS",
      "bucket_name": "user-images",
      "event_notifications": {
        "queue": "metadata-extraction-queue",
        "rules": [
          {
            "actions": ["PutObject"],
            "prefix": "thumbnails/"
          }
        ]
      }
    }
  ]
}
```

### Pattern 2: Conditional Processing Based on Metadata
```typescript
async function processConditionally(event: R2Event, env: Env) {
  const object = await env.MY_BUCKET.get(event.object.key);

  // Check custom metadata
  const processType = object.customMetadata?.processType;

  switch (processType) {
    case 'image':
      await processImage(object);
      break;
    case 'video':
      await processVideo(object);
      break;
    case 'document':
      await processDocument(object);
      break;
    default:
      console.log(`Unknown process type: ${processType}`);
  }
}
```

### Pattern 3: Fan-Out to Multiple Queues
```typescript
// Single R2 event triggers multiple processing pipelines

// wrangler.jsonc - Multiple event notification configs
{
  "r2_buckets": [
    {
      "binding": "UPLOADS",
      "bucket_name": "user-uploads",
      "event_notifications": [
        {
          "queue": "thumbnail-queue",
          "rules": [{ "actions": ["PutObject"], "prefix": "images/" }]
        },
        {
          "queue": "metadata-queue",
          "rules": [{ "actions": ["PutObject"], "prefix": "images/" }]
        },
        {
          "queue": "backup-queue",
          "rules": [{ "actions": ["PutObject"], "prefix": "images/" }]
        }
      ]
    }
  ]
}

// Each queue has dedicated consumer:
// - thumbnail-queue → Resize images
// - metadata-queue → Extract EXIF data
// - backup-queue → Replicate to backup bucket
```

---

## Monitoring & Debugging

### Log Event Details
```typescript
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    console.log(`Processing ${batch.messages.length} R2 events`);

    for (const message of batch.messages) {
      const event = message.body;

      console.log({
        action: event.action,
        bucket: event.bucket,
        key: event.object.key,
        size: event.object.size,
        eventTime: event.eventTime
      });

      await processEvent(event, env);
    }
  }
}
```

### Track Processing Metrics
```typescript
import { Analytics } from '@cloudflare/workers-types';

async function trackMetrics(event: R2Event, env: Env) {
  await env.ANALYTICS.writeDataPoint({
    indexes: [event.bucket, event.action],
    doubles: [event.object.size || 0],
    blobs: [event.object.key]
  });
}
```

### Check Queue Backlog
```bash
# Monitor queue status
wrangler queues info image-processing-queue

# Output:
# Queue: image-processing-queue
# Messages: 125 (backlog)
# Consumers: 1
```

---

## Limits & Quotas

| Feature | Limit |
|---------|-------|
| Event notifications per bucket | Unlimited |
| Queues per bucket | Unlimited |
| Filter rules per notification | 1000 |
| Event delivery latency | ~1-5 seconds (typical) |
| Event retention | Same as queue (4 days default) |

**Note**: Event notifications count toward queue message limits (50 messages/invocation on free tier, 1000 on paid).

---

## Troubleshooting

**Problem**: Events not appearing in queue
- **Check**: Verify event notification configuration in wrangler.jsonc
- **Check**: Ensure queue exists: `wrangler queues list`
- **Check**: Upload object matching prefix/suffix filters
- **Solution**: Test with simple rule (no filters) first

**Problem**: Duplicate event processing
- **Check**: Multiple consumers on same queue
- **Check**: Consumer not acking messages
- **Solution**: Implement idempotent processing (check if already processed)

**Problem**: Queue backlog growing
- **Check**: Consumer processing too slow
- **Check**: Increase `max_batch_size` or `max_concurrency`
- **Solution**: Optimize processing logic, add more consumers

**Problem**: Object not found when processing event
- **Check**: Object deleted between event and processing
- **Solution**: Handle gracefully (check if object exists before processing)

---

## Migration Guide

### From Polling to Event Notifications

**Before (Polling)**:
```typescript
// Worker polls R2 bucket every minute
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // List new objects
    const listed = await env.MY_BUCKET.list({ prefix: 'uploads/' });

    for (const object of listed.objects) {
      // Check if already processed
      const processed = await env.DB.prepare(
        'SELECT 1 FROM processed WHERE key = ?'
      ).bind(object.key).first();

      if (!processed) {
        await processObject(object.key, env);
        await env.DB.prepare(
          'INSERT INTO processed (key) VALUES (?)'
        ).bind(object.key).run();
      }
    }
  }
}
```

**After (Event Notifications)**:
```typescript
// Automatic event-driven processing
export default {
  async queue(batch: MessageBatch<R2Event>, env: Env) {
    for (const message of batch.messages) {
      const event = message.body;

      if (event.action === 'PutObject') {
        await processObject(event.object.key, env);
      }
    }
  }
}
```

**Benefits of migration**:
- ✅ No polling overhead
- ✅ Near real-time processing
- ✅ Automatic scaling
- ✅ Lower costs (no scheduled invocations)

---

## Additional Resources

- **Official Docs**: https://developers.cloudflare.com/r2/buckets/event-notifications/
- **Queue Configuration**: https://developers.cloudflare.com/queues/configuration/
- **R2 API**: https://developers.cloudflare.com/r2/api/workers/workers-api/
- **Examples**: https://developers.cloudflare.com/r2/examples/
