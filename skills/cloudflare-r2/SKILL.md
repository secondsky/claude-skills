---
name: cloudflare-r2
description: |
  Complete knowledge domain for Cloudflare R2 - S3-compatible object storage on Cloudflare's edge network.

  Use when: creating R2 buckets, uploading files to R2, downloading objects, configuring R2 bindings,
  setting up CORS, generating presigned URLs, multipart uploads, storing images/assets, managing object
  metadata, or encountering "R2_ERROR", CORS errors, presigned URL failures, multipart upload issues,
  or storage quota errors.

  Keywords: r2, r2 storage, cloudflare r2, r2 bucket, r2 upload, r2 download, r2 binding, object storage,
  s3 compatible, r2 cors, presigned urls, multipart upload, r2 api, r2 workers, file upload, asset storage,
  R2_ERROR, R2Bucket, r2 metadata, custom metadata, http metadata, content-type, cache-control,
  aws4fetch, s3 client, bulk delete, r2 list, storage class
license: MIT
metadata:
  version: "2.0.0"
  last_verified: "2025-11-18"
  production_tested: true
  token_savings: "~60%"
  errors_prevented: 6
  templates_included: 5
  references_included: 4
---

# Cloudflare R2 Object Storage

**Status**: Production Ready ✅ | **Last Verified**: 2025-11-18

---

## Quick Start (5 Minutes)

### 1. Create R2 Bucket

```bash
npx wrangler r2 bucket create my-bucket
```

**Bucket naming:** 3-63 chars, lowercase, numbers, hyphens only

### 2. Configure Binding

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",          // env.MY_BUCKET
      "bucket_name": "my-bucket",      // Actual bucket
      "preview_bucket_name": "my-bucket-preview"  // Optional: dev bucket
    }
  ]
}
```

**CRITICAL:** `binding` = code access name, `bucket_name` = actual R2 bucket

### 3. Basic Upload/Download

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload
app.put('/upload/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();

  const object = await c.env.MY_BUCKET.put(filename, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
  });

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
  });
});

// Download
app.get('/download/:filename', async (c) => {
  const object = await c.env.MY_BUCKET.get(c.req.param('filename'));

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'ETag': object.httpEtag,
    },
  });
});

export default app;
```

**Load `references/setup-guide.md` for complete setup walkthrough.**

---

## Core R2 Workers API

### put() - Upload Objects

**Basic upload:**

```typescript
await env.MY_BUCKET.put('file.txt', data);
```

**With metadata:**

```typescript
await env.MY_BUCKET.put('document.pdf', fileData, {
  httpMetadata: {
    contentType: 'application/pdf',
    cacheControl: 'public, max-age=86400',
    contentDisposition: 'attachment; filename="report.pdf"',
  },
  customMetadata: {
    userId: '12345',
    uploadDate: new Date().toISOString(),
  },
});
```

**Prevent overwrites:**

```typescript
const object = await env.MY_BUCKET.put('file.txt', data, {
  onlyIf: {
    uploadedBefore: new Date('2020-01-01'),  // Upload only if doesn't exist
  },
});

if (!object) {
  return c.json({ error: 'File already exists' }, 409);
}
```

---

### get() - Download Objects

**Basic download:**

```typescript
const object = await env.MY_BUCKET.get('file.txt');

if (!object) {
  return c.json({ error: 'Not found' }, 404);
}

return new Response(object.body);
```

**Read as different formats:**

```typescript
const object = await env.MY_BUCKET.get('data.json');

if (object) {
  const text = await object.text();           // String
  const json = await object.json();           // JSON
  const buffer = await object.arrayBuffer();  // ArrayBuffer
  const blob = await object.blob();           // Blob
}
```

**Range requests (partial downloads):**

```typescript
// Get first 1MB
const object = await env.MY_BUCKET.get('large-file.mp4', {
  range: { offset: 0, length: 1024 * 1024 },
});

// Get bytes 100-200
const object = await env.MY_BUCKET.get('file.bin', {
  range: { offset: 100, length: 100 },
});
```

---

### head() - Get Metadata Only

```typescript
const object = await env.MY_BUCKET.head('file.txt');

if (object) {
  console.log({
    key: object.key,
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded,
    contentType: object.httpMetadata?.contentType,
    customMetadata: object.customMetadata,
  });
}
```

**Use cases:**
- Check if file exists
- Get file size before downloading
- Validate etag for caching

---

### delete() - Delete Objects

**Single delete:**

```typescript
await env.MY_BUCKET.delete('file.txt');  // Idempotent
```

**Bulk delete (up to 1000 keys):**

```typescript
const keysToDelete = [
  'old-file-1.txt',
  'old-file-2.txt',
  'temp/cache-data.json',
];

await env.MY_BUCKET.delete(keysToDelete);  // Much faster than loop
```

---

### list() - List Objects

**Basic listing:**

```typescript
const listed = await env.MY_BUCKET.list();

console.log({
  objects: listed.objects,      // Array of R2Object
  truncated: listed.truncated,  // true if more results
  cursor: listed.cursor,        // For pagination
});
```

**Pagination:**

```typescript
app.get('/api/files', async (c) => {
  const cursor = c.req.query('cursor');

  const listed = await c.env.MY_BUCKET.list({
    limit: 100,
    cursor: cursor || undefined,
  });

  return c.json({
    files: listed.objects.map(obj => ({
      name: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    hasMore: listed.truncated,
    nextCursor: listed.cursor,
  });
});
```

**Prefix filtering (folder-like):**

```typescript
// List all files in 'images/' folder
const images = await env.MY_BUCKET.list({
  prefix: 'images/',
});

// List by user
const userFiles = await env.MY_BUCKET.list({
  prefix: `users/${userId}/`,
});
```

**Delimiter (folder structure):**

```typescript
const listed = await env.MY_BUCKET.list({
  prefix: 'uploads/',
  delimiter: '/',
});

console.log('Files:', listed.objects);          // Files in uploads/
console.log('Folders:', listed.delimitedPrefixes); // Sub-folders
```

**Load `references/workers-api.md` for complete API reference.**

---

## Critical Rules

### Always Do ✅

1. **Set contentType on uploads** - Files will download as binary otherwise
2. **Use batch delete** for multiple objects (up to 1000 keys)
3. **Set cache headers** for static assets (`cacheControl`)
4. **Use presigned URLs** for large client uploads
5. **Use multipart upload** for files >100MB
6. **Set CORS policy** before browser uploads
7. **Set expiry times** on presigned URLs (1-24 hours)
8. **Handle errors** with try/catch
9. **Use head()** when you only need metadata (not get())
10. **Use conditional operations** to prevent overwrites

### Never Do ❌

1. **Never expose R2 access keys** in client-side code
2. **Never skip contentType** (files will download as binary)
3. **Never delete in loops** (use batch delete)
4. **Never upload without error handling**
5. **Never skip CORS** for browser uploads
6. **Never use multipart for small files** (<5MB overhead)
7. **Never delete >1000 keys** in single call (will fail)
8. **Never assume uploads succeed** (always check response)
9. **Never skip presigned URL expiry** (security risk)
10. **Never hardcode bucket names** (use bindings)

---

## Top 5 Use Cases

### Use Case 1: Image/Asset Storage

```typescript
app.put('/api/upload/image', async (c) => {
  const file = await c.req.parseBody();
  const image = file['image'] as File;

  await c.env.MY_BUCKET.put(`images/${image.name}`, image.stream(), {
    httpMetadata: {
      contentType: image.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return c.json({ success: true });
});
```

### Use Case 2: Multipart Upload (Large Files >100MB)

```typescript
// Create multipart upload
const multipart = await env.MY_BUCKET.createMultipartUpload('large-file.zip', {
  httpMetadata: { contentType: 'application/zip' },
});

// Upload parts (client can upload in parallel)
const part1 = await multipart.uploadPart(1, chunk1);
const part2 = await multipart.uploadPart(2, chunk2);

// Complete upload
await multipart.complete([part1, part2]);
```

**Load `references/common-patterns.md` for complete multipart workflow.**

### Use Case 3: Presigned URLs (Direct Client Upload)

```typescript
import { AwsClient } from 'aws4fetch';

app.post('/api/presigned-upload', async (c) => {
  const { filename } = await c.req.json();

  const r2Client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  });

  const url = new URL(
    `https://my-bucket.${c.env.ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`
  );

  url.searchParams.set('X-Amz-Expires', '3600');  // 1 hour expiry

  const signed = await r2Client.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  return c.json({ uploadUrl: signed.url });
});
```

**Load `templates/r2-presigned-urls.ts` for complete example.**

### Use Case 4: Bulk Operations

```typescript
// Bulk delete old files
const oldFiles = await env.MY_BUCKET.list({
  prefix: 'temp/',
});

const keysToDelete = oldFiles.objects.map(obj => obj.key);

// Delete up to 1000 at once
await env.MY_BUCKET.delete(keysToDelete);
```

### Use Case 5: Custom Metadata Tracking

```typescript
await env.MY_BUCKET.put('document.pdf', pdfData, {
  httpMetadata: {
    contentType: 'application/pdf',
  },
  customMetadata: {
    userId: '12345',
    department: 'engineering',
    uploadDate: new Date().toISOString(),
    version: '1.0',
    approved: 'true',
  },
});

// Later: retrieve metadata
const object = await env.MY_BUCKET.head('document.pdf');
console.log(object.customMetadata);  // All custom metadata
```

**Limit:** 2KB total for all custom metadata

---

## When to Load References

### Load `references/setup-guide.md` when:
- First-time R2 setup
- Need step-by-step setup walkthrough
- Configuring CORS for first time
- Setting up presigned URLs
- Troubleshooting binding issues

### Load `references/workers-api.md` when:
- Need complete API reference
- Working with advanced options
- Conditional operations (onlyIf)
- Checksums and data integrity
- Error handling patterns

### Load `references/common-patterns.md` when:
- Implementing multipart upload
- Need retry logic
- Batch operations
- Performance optimization
- Cache header strategies

### Load `references/s3-compatibility.md` when:
- Migrating from AWS S3
- Using S3 client libraries
- Need S3 API compatibility info
- Using aws4fetch for signing

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete setup walkthrough (bucket creation → deployment)
- **workers-api.md** - Complete Workers API reference (all methods + options)
- **common-patterns.md** - Advanced patterns (multipart, retry, batch, performance)
- **s3-compatibility.md** - S3 compatibility guide (migration, aws4fetch, S3 clients)

### Templates (templates/)

- **r2-simple-upload.ts** - Basic upload/download Worker
- **r2-multipart-upload.ts** - Complete multipart upload implementation
- **r2-presigned-urls.ts** - Presigned URL generation (upload + download)
- **r2-cors-config.json** - CORS configuration examples
- **wrangler-r2-config.jsonc** - Complete wrangler.jsonc with R2 binding

---

## CORS Configuration

Configure CORS for browser access:

**Dashboard:**
1. Cloudflare Dashboard → R2 → Your bucket
2. Settings tab → CORS Policy → Add CORS policy

**Public assets:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["Range"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Upload/download:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-MD5"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Load `templates/r2-cors-config.json` for complete examples.**

---

## Error Handling

```typescript
try {
  await env.MY_BUCKET.put(key, data);
} catch (error: any) {
  const message = error.message;

  if (message.includes('R2_ERROR')) {
    // Generic R2 error
  } else if (message.includes('exceeded')) {
    // Quota exceeded
  } else if (message.includes('precondition')) {
    // Conditional operation failed
  }

  console.error('R2 Error:', message);
  return c.json({ error: 'Storage operation failed' }, 500);
}
```

**Retry logic:**

```typescript
async function r2WithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRetryable =
        error.message.includes('network') ||
        error.message.includes('timeout');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
      );
    }
  }
  throw new Error('Retry failed');
}
```

---

## Known Issues Prevented

| Issue | Description | Solution |
|-------|-------------|----------|
| **CORS errors** | Browser can't upload/download | Configure CORS in bucket settings |
| **Files download as binary** | Missing content-type | Always set `httpMetadata.contentType` |
| **Presigned URL security** | URLs never expire | Always set `X-Amz-Expires` (1-24 hours) |
| **Multipart limits** | Parts >100MB or >10,000 parts | Keep parts 5MB-100MB, max 10,000 |
| **Bulk delete limits** | >1000 keys fails | Chunk deletes into batches of 1000 |
| **Metadata overflow** | >2KB custom metadata | Keep total under 2KB |

---

## Wrangler Commands

```bash
# Bucket management
wrangler r2 bucket create <BUCKET_NAME>
wrangler r2 bucket list
wrangler r2 bucket delete <BUCKET_NAME>

# Object management
wrangler r2 object put <BUCKET>/<KEY> --file=<PATH>
wrangler r2 object get <BUCKET>/<KEY> --file=<OUTPUT>
wrangler r2 object delete <BUCKET>/<KEY>

# List objects
wrangler r2 object list <BUCKET>
wrangler r2 object list <BUCKET> --prefix="folder/"
```

---

## Official Documentation

- **R2 Overview**: https://developers.cloudflare.com/r2/
- **Workers API**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- **Multipart Upload**: https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/
- **Presigned URLs**: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- **CORS Configuration**: https://developers.cloudflare.com/r2/buckets/cors/

---

**Questions? Issues?**

1. Check `references/setup-guide.md` for setup walkthrough
2. Review `references/workers-api.md` for API reference
3. See `references/common-patterns.md` for advanced patterns
4. Load `templates/` for working code examples
