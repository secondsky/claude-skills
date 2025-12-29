---
name: cloudflare-r2:presigned-url
description: Generate presigned URLs for secure client-side uploads or downloads
---

# R2 Presigned URL Generator

Generate time-limited, signed URLs for secure client-side uploads or downloads without exposing R2 credentials.

## Required Information

1. **Operation type**: `{{operation}}` (upload or download)
2. **Object key** (file path in bucket): `{{key}}`
3. **Expiry** (seconds, max 604800 = 7 days): `{{expiry}}`
4. **Custom headers** (optional, e.g., Content-Type): `{{headers}}`

## What This Command Does

1. **Generates AWS v4 signed URL** using aws4fetch library
2. **Sets expiration time** (1 hour to 7 days)
3. **Provides curl test command** for verification
4. **Explains security considerations**
5. **Shows client-side usage example**

## Implementation

```typescript
import { AwsClient } from 'aws4fetch';

// Configure AWS client for R2
const r2Client = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
});

// Generate presigned URL for upload
async function generateUploadURL(
  bucket: string,
  key: string,
  expirySeconds: number
) {
  const url = new URL(
    `https://${bucket}.${env.ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  );

  url.searchParams.set('X-Amz-Expires', expirySeconds.toString());

  const signed = await r2Client.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  return signed.url;
}

// Generate presigned URL for download
async function generateDownloadURL(
  bucket: string,
  key: string,
  expirySeconds: number
) {
  const url = new URL(
    `https://${bucket}.${env.ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  );

  url.searchParams.set('X-Amz-Expires', expirySeconds.toString());

  const signed = await r2Client.sign(
    new Request(url, { method: 'GET' }),
    { aws: { signQuery: true } }
  );

  return signed.url;
}
```

## Example Usage

```typescript
// Generate upload URL (valid for 1 hour)
const uploadURL = await generateUploadURL('my-bucket', 'user/file.pdf', 3600);

// Client-side upload
fetch(uploadURL, {
  method: 'PUT',
  body: fileData,
  headers: {
    'Content-Type': 'application/pdf',
  },
});

// Generate download URL (valid for 24 hours)
const downloadURL = await generateDownloadURL('my-bucket', 'user/file.pdf', 86400);

// Provide URL to user
return c.json({ downloadURL });
```

## Testing with curl

```bash
# Test upload URL
curl -X PUT "{{presigned_url}}" \
  -H "Content-Type: text/plain" \
  --data "Test content"

# Test download URL
curl "{{presigned_url}}" --output downloaded-file.txt
```

## Security Considerations

1. **Always set expiry** - Never create URLs without expiration
2. **Shortest practical TTL** - 1-24 hours for most use cases
3. **Never log URLs** - They contain credentials in query params
4. **HTTPS only** - Presigned URLs should always use HTTPS
5. **Validate before signing** - Check file size/type limits
6. **User-specific keys** - Consider per-user key prefixes
7. **Rotate credentials** - Change R2 access keys periodically

## Common Expiry Times

- **Instant upload**: 300 seconds (5 minutes)
- **User upload**: 3600 seconds (1 hour)
- **Email link**: 86400 seconds (24 hours)
- **Share link**: 604800 seconds (7 days, maximum)
