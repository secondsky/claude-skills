---
name: cloudflare-r2:multipart-init
description: Set up multipart upload for large files (>100MB)
---

# R2 Multipart Upload Setup

Initialize and implement multipart upload workflow for handling large files (>100MB) with chunking, error recovery, and progress tracking.

## Required Information

1. **File size** (in MB): `{{file_size}}`
2. **Object key** (destination path): `{{key}}`
3. **Part size** (5-100 MB, recommended 10MB): `{{part_size}}`
4. **Content type**: `{{content_type}}`

## What This Command Does

1. **Calculates optimal part size** based on file size
2. **Shows createMultipartUpload code** for initialization
3. **Generates part upload loop** with retry logic
4. **Provides completion/abort handlers**
5. **Adds progress tracking** for user feedback

## Multipart Upload Constraints

- **Minimum part size**: 5 MB (except last part)
- **Maximum part size**: 100 MB
- **Maximum parts**: 10,000 parts per upload
- **Part numbers**: 1 to 10,000 (1-based indexing)

## Part Size Calculator

```typescript
function calculatePartSize(fileSizeMB: number): number {
  const MIN_PART_SIZE = 5 * 1024 * 1024;  // 5MB
  const MAX_PART_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_PARTS = 10000;

  const fileSize = fileSizeMB * 1024 * 1024;
  const recommendedSize = Math.ceil(fileSize / MAX_PARTS);

  if (recommendedSize < MIN_PART_SIZE) {
    return MIN_PART_SIZE;
  } else if (recommendedSize > MAX_PART_SIZE) {
    return MAX_PART_SIZE;
  } else {
    return recommendedSize;
  }
}

// Example: 500MB file = 10MB parts (50 parts)
// Example: 50GB file = 10MB parts (5000 parts)
```

## Complete Implementation

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Step 1: Initialize multipart upload
app.post('/multipart/create', async (c) => {
  const { key, contentType } = await c.req.json();

  const multipart = await c.env.MY_BUCKET.createMultipartUpload(key, {
    httpMetadata: {
      contentType: contentType || 'application/octet-stream',
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  return c.json({
    uploadId: multipart.uploadId,
    key: multipart.key,
  });
});

// Step 2: Upload individual parts
app.put('/multipart/upload-part', async (c) => {
  const { uploadId, key, partNumber } = await c.req.json();
  const data = await c.req.arrayBuffer();

  // Validate part number (1-10000)
  if (partNumber < 1 || partNumber > 10000) {
    return c.json({ error: 'Invalid part number' }, 400);
  }

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
  const uploadedPart = await multipart.uploadPart(partNumber, data);

  return c.json({
    partNumber,
    etag: uploadedPart.etag,
  });
});

// Step 3: Complete multipart upload
app.post('/multipart/complete', async (c) => {
  const { uploadId, key, parts } = await c.req.json();

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);

  // parts = [{ partNumber: 1, etag: 'abc' }, { partNumber: 2, etag: 'def' }, ...]
  const object = await multipart.complete(parts);

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
    etag: object.httpEtag,
  });
});

// Step 4: Abort multipart upload (cleanup)
app.delete('/multipart/abort', async (c) => {
  const { uploadId, key } = await c.req.json();

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
  await multipart.abort();

  return c.json({ success: true, message: 'Upload aborted' });
});

export default app;
```

## Client-Side Upload Flow

```typescript
async function uploadLargeFile(file: File, onProgress: (percent: number) => void) {
  const partSize = 10 * 1024 * 1024; // 10MB
  const totalParts = Math.ceil(file.size / partSize);

  // Step 1: Create multipart upload
  const { uploadId, key } = await fetch('/multipart/create', {
    method: 'POST',
    body: JSON.stringify({
      key: `uploads/${file.name}`,
      contentType: file.type,
    }),
  }).then(r => r.json());

  // Step 2: Upload parts
  const uploadedParts = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    const { etag } = await fetch('/multipart/upload-part', {
      method: 'PUT',
      body: JSON.stringify({
        uploadId,
        key,
        partNumber,
      }),
      headers: { 'Content-Type': 'application/octet-stream' },
    }).then(r => r.json());

    uploadedParts.push({ partNumber, etag });

    const progress = (partNumber / totalParts) * 100;
    onProgress(progress);
  }

  // Step 3: Complete upload
  await fetch('/multipart/complete', {
    method: 'POST',
    body: JSON.stringify({
      uploadId,
      key,
      parts: uploadedParts,
    }),
  });

  console.log('Upload complete!');
}
```

## Error Handling with Retry

```typescript
async function uploadPartWithRetry(
  uploadId: string,
  key: string,
  partNumber: number,
  data: ArrayBuffer,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/multipart/upload-part', {
        method: 'PUT',
        body: JSON.stringify({ uploadId, key, partNumber }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Progress Tracking

```typescript
function createProgressTracker(totalParts: number) {
  let completedParts = 0;

  return {
    increment() {
      completedParts++;
      const percent = (completedParts / totalParts) * 100;
      console.log(`Upload progress: ${percent.toFixed(1)}%`);
      return percent;
    },
    isComplete() {
      return completedParts === totalParts;
    },
  };
}
```

## Best Practices

1. **Calculate part size based on file size** - Ensure total parts < 10,000
2. **Implement retry logic** - Network can fail, retry with exponential backoff
3. **Track progress** - Show user upload progress for better UX
4. **Abort on critical errors** - Clean up failed uploads to avoid charges
5. **Store upload IDs** - Enable resume after browser refresh
6. **Set timeouts** - Don't wait forever for part uploads
7. **Validate ETags** - Ensure parts uploaded correctly

## Cleanup Abandoned Uploads

```typescript
// Run periodically to clean up uploads older than 24 hours
async function cleanupAbandonedUploads(env: Bindings) {
  // Note: R2 API doesn't expose listMultipartUploads yet
  // Store upload IDs in KV/D1 with timestamps for cleanup
  const oldUploads = await env.UPLOADS_DB.prepare(
    `SELECT upload_id, key FROM multipart_uploads
     WHERE created_at < datetime('now', '-24 hours')`
  ).all();

  for (const upload of oldUploads.results) {
    const multipart = env.MY_BUCKET.resumeMultipartUpload(
      upload.key,
      upload.upload_id
    );
    await multipart.abort();
  }
}
```

## Next Steps

1. Test with small file first (50MB)
2. Implement progress UI for user feedback
3. Add retry logic for production reliability
4. Set up cleanup for abandoned uploads
5. Monitor upload success/failure rates
