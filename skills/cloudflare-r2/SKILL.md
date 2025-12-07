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
  last_verified: "2025-11-26"
  production_tested: true
  token_savings: "~60%"
  errors_prevented: 6
  templates_included: 5
  references_included: 5
  wrangler_version: "4.50.0"
  workers_types_version: "4.20251126.0"
  aws4fetch_version: "1.0.20"
---

# Cloudflare R2 Object Storage

**Status**: Production Ready ✅ | **Last Verified**: 2025-11-26

**Contents**: [Quick Start](#quick-start-5-minutes) • [Core R2 API](#core-r2-workers-api-quick-reference) • [Critical Rules](#critical-rules) • [Top Use Cases](#top-use-cases) • [Error Handling](#error-handling) • [Known Issues](#known-issues-prevented) • [References](#when-to-load-references)

---

## Quick Start (5 Minutes)

### 1. Create R2 Bucket

```bash
bunx wrangler r2 bucket create my-bucket
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

## Core R2 Workers API - Quick Reference

### put() - Upload Objects
```typescript
await env.MY_BUCKET.put(key, data, options?)
```
Upload with metadata, prevent overwrites with `onlyIf`. **Load `references/workers-api.md`** for complete R2PutOptions.

### get() - Download Objects
```typescript
const object = await env.MY_BUCKET.get(key, options?)
```
Returns `R2ObjectBody | null`. Supports range requests, conditional operations. **Load `references/workers-api.md`** for read methods (text(), json(), arrayBuffer(), blob()).

### head() - Get Metadata Only
```typescript
const object = await env.MY_BUCKET.head(key)
```
Check existence, get size, etag, metadata without downloading body. Useful for validation and caching.

### delete() - Delete Objects
```typescript
await env.MY_BUCKET.delete(key | keys[])  // Single or bulk (max 1000)
```
Bulk delete up to 1000 keys in single call. Always succeeds (idempotent).

### list() - List Objects
```typescript
const listed = await env.MY_BUCKET.list(options?)
```
Pagination with cursor, prefix filtering, delimiter for folders. **Load `references/workers-api.md`** for R2ListOptions.

### createMultipartUpload() - Large Files (>100MB)
```typescript
const multipart = await env.MY_BUCKET.createMultipartUpload(key, options?)
```
For files >100MB. **Load `references/common-patterns.md`** for complete multipart workflow with part upload and completion.

**Load `references/workers-api.md` when**: Need complete API reference, interface definitions (R2Object, R2ObjectBody, R2PutOptions, R2GetOptions), conditional operations, checksums, or advanced options.

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

## Top Use Cases

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

### Use Case 2: Direct Client Upload (Presigned URLs)

Generate secure upload URLs for client-side uploads. See `templates/r2-presigned-urls.ts` for complete implementation using aws4fetch.

### Additional Patterns in References

**Load `references/common-patterns.md` for**:
- Multipart upload (files >100MB) - Complete workflow with part management
- Bulk operations - Batch delete, cleanup patterns with pagination
- Custom metadata tracking - User files, versions, approval workflows
- Versioned file storage - Version history with latest pointer pattern
- Backup & archive patterns - Automated backups with retention policies
- Thumbnail generation & caching - On-demand image processing
- Static site hosting - SPA fallback and cache strategies
- CDN with origin fallback - R2 as cache layer

**Load `templates/r2-multipart-upload.ts`** for complete multipart example.

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

### Load `references/cors-configuration.md` when:
- Setting up browser access to R2
- CORS errors or CORS policy debugging
- Presigned URL CORS configuration
- Security policy setup and best practices
- Testing CORS with curl or browser tools

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete setup walkthrough (bucket creation → deployment)
- **workers-api.md** - Complete Workers API reference (all methods + options)
- **common-patterns.md** - Advanced patterns (multipart, retry, batch, performance)
- **s3-compatibility.md** - S3 compatibility guide (migration, aws4fetch, S3 clients)
- **cors-configuration.md** - CORS setup guide (Dashboard, scenarios, troubleshooting, security)

### Templates (templates/)

- **r2-simple-upload.ts** - Basic upload/download Worker
- **r2-multipart-upload.ts** - Complete multipart upload implementation
- **r2-presigned-urls.ts** - Presigned URL generation (upload + download)
- **r2-cors-config.json** - CORS configuration examples
- **wrangler-r2-config.jsonc** - Complete wrangler.jsonc with R2 binding

---

## CORS Configuration

Configure CORS for browser uploads/downloads. **Load `references/cors-configuration.md`** for complete guide including Dashboard setup, common scenarios, troubleshooting, and security best practices.

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
    // Conditional operation failed (onlyIf)
  }

  console.error('R2 Error:', message);
  return c.json({ error: 'Storage operation failed' }, 500);
}
```

**Load `references/common-patterns.md`** for retry logic with exponential backoff, circuit breaker patterns, and advanced error recovery.

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
