# Vercel Blob Known Issues

This reference documents 10 common issues with Vercel Blob and their solutions.

---

## Issue #1: Missing Environment Variable

**Error**: `Error: BLOB_READ_WRITE_TOKEN is not defined`

**Source**: https://vercel.com/docs/storage/vercel-blob

**Why It Happens**: Token not set in environment.

**Prevention**:
```bash
vercel env pull .env.local
```

Ensure `.env.local` is in `.gitignore`. For production, environment variables are automatically available.

---

## Issue #2: Client Upload Token Exposed

**Error**: Security vulnerability, unauthorized uploads.

**Source**: https://vercel.com/docs/storage/vercel-blob/client-upload

**Why It Happens**: Using `BLOB_READ_WRITE_TOKEN` directly in client code.

**Prevention**: Use `handleUpload()` to generate client-specific tokens:

```typescript
'use server';

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function getUploadToken(body: HandleUploadBody) {
  return await handleUpload({
    body,
    request: new Request('https://dummy'),
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: ['image/jpeg', 'image/png'],
      maximumSizeInBytes: 5 * 1024 * 1024 // 5MB
    }),
    onUploadCompleted: async ({ blob }) => {
      console.log('Upload completed:', blob.url);
    }
  });
}
```

---

## Issue #3: File Size Limit Exceeded

**Error**: `Error: File size exceeds limit` (500MB)

**Source**: https://vercel.com/docs/storage/vercel-blob/limits

**Why It Happens**: Uploading file >500MB without multipart upload.

**Prevention**:
1. Validate file size before upload
2. Use multipart upload for large files:

```typescript
import { createMultipartUpload, uploadPart, completeMultipartUpload } from '@vercel/blob';

// For files >500MB
const upload = await createMultipartUpload('large-video.mp4', { access: 'public' });

const parts = [];
for (let i = 0; i < totalChunks; i++) {
  const part = await uploadPart(chunks[i], {
    uploadId: upload.uploadId,
    partNumber: i + 1
  });
  parts.push(part);
}

const blob = await completeMultipartUpload({ uploadId: upload.uploadId, parts });
```

---

## Issue #4: Wrong Content-Type

**Error**: Browser downloads file instead of displaying (e.g., PDF opens as text).

**Source**: Production debugging.

**Why It Happens**: Not setting `contentType` option, Blob guesses incorrectly.

**Prevention**: Always set content type explicitly:

```typescript
const blob = await put('document.pdf', file, {
  access: 'public',
  contentType: 'application/pdf' // or file.type
});
```

---

## Issue #5: Public File Not Cached

**Error**: Slow file delivery, high egress costs.

**Source**: Vercel Blob best practices.

**Why It Happens**: Using `access: 'private'` for files that should be public.

**Prevention**: Use `access: 'public'` for CDN caching:

```typescript
// ✅ CDN cached, fast delivery
await put('image.jpg', file, { access: 'public' });

// ❌ No CDN caching
await put('image.jpg', file, { access: 'private' });
```

---

## Issue #6: List Pagination Not Handled

**Error**: Only first 1000 files returned, missing files.

**Source**: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#list

**Why It Happens**: Not iterating with cursor for large file lists.

**Prevention**: Use cursor-based pagination:

```typescript
import { list } from '@vercel/blob';

let cursor: string | undefined;
const allBlobs = [];

do {
  const { blobs, cursor: nextCursor } = await list({
    prefix: 'uploads/',
    cursor
  });
  allBlobs.push(...blobs);
  cursor = nextCursor;
} while (cursor);
```

---

## Issue #7: Delete Fails Silently

**Error**: Files not deleted, storage quota fills up.

**Source**: https://github.com/vercel/storage/issues/150

**Why It Happens**: Using wrong URL format, blob not found.

**Prevention**: Use full blob URL from `put()` response:

```typescript
import { put, del } from '@vercel/blob';

// Save the URL from put()
const blob = await put('file.jpg', file, { access: 'public' });
const url = blob.url; // Store this!

// Use exact URL for deletion
await del(url);

// Delete multiple
await del([url1, url2, url3]);
```

---

## Issue #8: Upload Timeout (Large Files)

**Error**: `Error: Request timeout` for files >100MB.

**Source**: Vercel function timeout limits.

**Why It Happens**: Serverless function timeout (10s free tier, 60s pro).

**Prevention**: Use client-side upload for large files:

```typescript
'use client';

import { upload } from '@vercel/blob/client';

// Client upload bypasses serverless function timeout
const blob = await upload(file.name, file, {
  access: 'public',
  handleUploadUrl: '/api/upload-token'
});
```

---

## Issue #9: Filename Collisions

**Error**: Files overwritten, data loss.

**Source**: Production debugging.

**Why It Happens**: Using same filename for multiple uploads.

**Prevention**: Add timestamp/UUID or use `addRandomSuffix`:

```typescript
// Option 1: Manual timestamp
await put(`uploads/${Date.now()}-${file.name}`, file, { access: 'public' });

// Option 2: Auto suffix
await put(file.name, file, {
  access: 'public',
  addRandomSuffix: true // Adds random suffix automatically
});
```

---

## Issue #10: Missing Upload Callback

**Error**: Upload completes but app state not updated.

**Source**: https://vercel.com/docs/storage/vercel-blob/client-upload#callback-after-upload

**Why It Happens**: Not implementing `onUploadCompleted` callback.

**Prevention**: Use callback to update database:

```typescript
const response = await handleUpload({
  body,
  request,
  onBeforeGenerateToken: async () => ({ /* config */ }),
  onUploadCompleted: async ({ blob, tokenPayload }) => {
    // Update database with new file
    await db.insert(files).values({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size
    });
  }
});
```

---

## Quick Reference Table

| Issue | Error | Quick Fix |
|-------|-------|-----------|
| #1 Missing token | `BLOB_READ_WRITE_TOKEN not defined` | Run `vercel env pull .env.local` |
| #2 Token exposed | Security vulnerability | Use `handleUpload()` for client uploads |
| #3 Size exceeded | `File size exceeds limit` | Use multipart upload for >500MB |
| #4 Wrong content-type | File downloads instead of displays | Set `contentType: file.type` |
| #5 No CDN caching | Slow delivery | Use `access: 'public'` |
| #6 Missing files | List incomplete | Use cursor pagination |
| #7 Delete fails | Storage fills up | Use exact URL from `put()` |
| #8 Upload timeout | Request timeout | Use client-side upload |
| #9 Overwritten files | Data loss | Add timestamp or `addRandomSuffix` |
| #10 State not updated | Callback missing | Use `onUploadCompleted` |

---

## See Also

- **Official Docs**: https://vercel.com/docs/storage/vercel-blob
- **Client Upload**: https://vercel.com/docs/storage/vercel-blob/client-upload
- **SDK Reference**: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
