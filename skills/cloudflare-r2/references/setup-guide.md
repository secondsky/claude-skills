# Cloudflare R2 Setup Guide

Complete setup guide for Cloudflare R2 object storage with Workers.

---

## Step 1: Create R2 Bucket

### Via Wrangler CLI (Recommended)

```bash
npx wrangler r2 bucket create my-bucket
```

### Via Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Click "Create bucket"
4. Enter bucket name (3-63 chars, lowercase, numbers, hyphens only)

**Bucket naming rules:**
- 3-63 characters
- Lowercase letters, numbers, hyphens only
- Must start/end with letter or number
- Globally unique within your account

---

## Step 2: Configure R2 Binding

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",          // Available as env.MY_BUCKET
      "bucket_name": "my-bucket",      // Actual bucket name
      "preview_bucket_name": "my-bucket-preview"  // Optional: dev bucket
    }
  ]
}
```

**CRITICAL:**
- `binding` = How you access bucket in code (`env.MY_BUCKET`)
- `bucket_name` = Actual R2 bucket name from Step 1
- `preview_bucket_name` = Optional separate bucket for dev/prod isolation

---

## Step 3: Setup TypeScript Types

Add to `env.d.ts` or `worker-configuration.d.ts`:

```typescript
interface Env {
  MY_BUCKET: R2Bucket;
  // ... other bindings
}
```

For Hono:

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();
```

---

## Step 4: Implement Basic Upload/Download

### Basic Upload Handler

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.put('/upload/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();

  try {
    const object = await c.env.MY_BUCKET.put(filename, body, {
      httpMetadata: {
        contentType: c.req.header('content-type') || 'application/octet-stream',
      },
    });

    return c.json({
      success: true,
      key: object.key,
      size: object.size,
      etag: object.etag,
    });
  } catch (error: any) {
    console.error('R2 Upload Error:', error.message);
    return c.json({ error: 'Upload failed' }, 500);
  }
});
```

### Basic Download Handler

```typescript
app.get('/download/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    const object = await c.env.MY_BUCKET.get(filename);

    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'ETag': object.httpEtag,
        'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('R2 Download Error:', error.message);
    return c.json({ error: 'Download failed' }, 500);
  }
});

export default app;
```

---

## Step 5: Deploy and Test

### Deploy Worker

```bash
npx wrangler deploy
```

### Test Upload

```bash
curl -X PUT https://my-worker.workers.dev/upload/test.txt \
  -H "Content-Type: text/plain" \
  -d "Hello, R2!"
```

Expected response:
```json
{
  "success": true,
  "key": "test.txt",
  "size": 10,
  "etag": "abc123..."
}
```

### Test Download

```bash
curl https://my-worker.workers.dev/download/test.txt
```

Expected output:
```
Hello, R2!
```

---

## Step 6: Advanced Features

### Configure CORS (If Browser Access Needed)

1. Go to Cloudflare Dashboard → R2 → Your bucket
2. Navigate to Settings tab
3. Under CORS Policy → Add CORS policy
4. Add configuration:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-MD5"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### Setup Presigned URLs (Optional)

For direct client uploads/downloads:

```bash
npm install aws4fetch
```

```typescript
import { AwsClient } from 'aws4fetch';

interface Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  ACCOUNT_ID: string;
  MY_BUCKET: R2Bucket;
}

app.post('/api/presigned-upload', async (c) => {
  const { filename } = await c.req.json();

  const r2Client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  });

  const bucketName = 'my-bucket';
  const accountId = c.env.ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
  );

  // Set expiry (1 hour)
  url.searchParams.set('X-Amz-Expires', '3600');

  // Sign the URL for PUT
  const signed = await r2Client.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  return c.json({
    uploadUrl: signed.url,
    expiresIn: 3600,
  });
});
```

### Setup Multipart Upload (For Files >100MB)

```typescript
// 1. Create multipart upload
app.post('/api/upload/start', async (c) => {
  const { filename } = await c.req.json();

  const multipart = await c.env.MY_BUCKET.createMultipartUpload(filename, {
    httpMetadata: {
      contentType: 'application/octet-stream',
    },
  });

  return c.json({
    key: multipart.key,
    uploadId: multipart.uploadId,
  });
});

// 2. Upload parts
app.put('/api/upload/part', async (c) => {
  const { key, uploadId, partNumber } = await c.req.json();
  const body = await c.req.arrayBuffer();

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
  const uploadedPart = await multipart.uploadPart(partNumber, body);

  return c.json({
    partNumber: uploadedPart.partNumber,
    etag: uploadedPart.etag,
  });
});

// 3. Complete upload
app.post('/api/upload/complete', async (c) => {
  const { key, uploadId, parts } = await c.req.json();

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
  const object = await multipart.complete(parts);

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
    etag: object.etag,
  });
});
```

---

## Production Checklist

Before deploying to production:

- [ ] R2 bucket created
- [ ] R2 binding configured in wrangler.jsonc
- [ ] Separate preview bucket for dev
- [ ] TypeScript types defined
- [ ] Content-Type set on all uploads
- [ ] Error handling implemented
- [ ] CORS configured (if browser access needed)
- [ ] Presigned URLs have expiry times set
- [ ] Multipart upload for large files (>100MB)
- [ ] Cache headers set appropriately
- [ ] Custom metadata under 2KB
- [ ] Batch delete for multiple objects
- [ ] Access keys stored in secrets (not environment variables)

---

## Quick Reference

### Wrangler Commands

```bash
# Bucket management
wrangler r2 bucket create <BUCKET_NAME>
wrangler r2 bucket list
wrangler r2 bucket delete <BUCKET_NAME>

# Object management
wrangler r2 object put <BUCKET_NAME>/<KEY> --file=<FILE_PATH>
wrangler r2 object get <BUCKET_NAME>/<KEY> --file=<OUTPUT_PATH>
wrangler r2 object delete <BUCKET_NAME>/<KEY>

# List objects
wrangler r2 object list <BUCKET_NAME>
wrangler r2 object list <BUCKET_NAME> --prefix="folder/"
```

### R2 Workers API Methods

```typescript
// Upload
await env.MY_BUCKET.put(key, body, options);

// Download
const object = await env.MY_BUCKET.get(key, options);

// Metadata only
const object = await env.MY_BUCKET.head(key);

// Delete
await env.MY_BUCKET.delete(key);  // Single
await env.MY_BUCKET.delete([key1, key2, ...]);  // Bulk

// List
const listed = await env.MY_BUCKET.list(options);
```

---

## Troubleshooting

### Issue: "R2 binding not found"

**Solution**: Check wrangler.jsonc has correct binding configuration

```jsonc
{
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket"
    }
  ]
}
```

### Issue: Files download as binary

**Solution**: Always set contentType on upload

```typescript
await env.MY_BUCKET.put(key, data, {
  httpMetadata: {
    contentType: 'text/plain',  // Set correct type
  },
});
```

### Issue: CORS errors in browser

**Solution**: Configure CORS in bucket settings

1. Dashboard → R2 → Bucket → Settings → CORS Policy
2. Add allowed origins and methods

### Issue: Presigned URLs never expire

**Solution**: Always set X-Amz-Expires parameter

```typescript
url.searchParams.set('X-Amz-Expires', '3600');  // 1 hour
```

---

**See `references/workers-api.md` for complete API reference.**
**See `references/common-patterns.md` for advanced patterns.**
**See `templates/` for working code examples.**
