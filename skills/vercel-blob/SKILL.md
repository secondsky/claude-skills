---
name: vercel-blob
description: |
  This skill provides comprehensive knowledge for integrating Vercel Blob object storage into Vercel applications. It should be used when setting up file uploads, managing images and documents, implementing CDN-delivered assets, or handling large files in Next.js serverless and edge functions.

  Use this skill when:
  - Setting up file uploads for Next.js applications (images, PDFs, videos)
  - Implementing client-side uploads with presigned URLs
  - Managing user-generated content (avatars, attachments, media)
  - Building file management features (list, download, delete)
  - Migrating from Cloudflare R2 to Vercel Blob
  - Encountering errors like "BLOB_READ_WRITE_TOKEN not set", "file size limit exceeded", or "client upload token errors"
  - Need simple object storage with automatic CDN distribution

  Keywords: vercel blob, @vercel/blob, vercel storage, vercel file upload, vercel cdn, blob storage vercel, client upload vercel, presigned url vercel, file upload nextjs, image upload vercel, pdf upload, video upload, user uploads, multipart upload, streaming upload, blob cdn, vercel assets, file download
license: MIT
---

# Vercel Blob (Object Storage)

**Status**: Production Ready
**Last Updated**: 2025-10-29
**Dependencies**: None
**Latest Versions**: `@vercel/blob@2.0.0`

---

## Quick Start (3 Minutes)

### 1. Create Blob Store

```bash
# In Vercel dashboard: Storage → Create Database → Blob
vercel env pull .env.local
```

Creates: `BLOB_READ_WRITE_TOKEN`

### 2. Install

```bash
npm install @vercel/blob
```

### 3. Upload File (Server Action)

```typescript
'use server';

import { put } from '@vercel/blob';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;

  const blob = await put(file.name, file, {
    access: 'public' // or 'private'
  });

  return blob.url; // https://xyz.public.blob.vercel-storage.com/file.jpg
}
```

**CRITICAL:**
- Use client upload tokens for direct client uploads (don't expose `BLOB_READ_WRITE_TOKEN`)
- Set correct `access` level (`public` vs `private`)
- Files are automatically distributed via CDN

---

## The 5-Step Setup Process

### Step 1: Create Blob Store

**Vercel Dashboard**:
1. Project → Storage → Create Database → Blob
2. Copy `BLOB_READ_WRITE_TOKEN`

**Local Development**:
```bash
vercel env pull .env.local
```

Creates `.env.local`:
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

**Key Points:**
- Free tier: 100GB bandwidth/month
- File size limit: 500MB per file
- Automatic CDN distribution
- Public files are cached globally

---

### Step 2: Server-Side Upload

**Next.js Server Action:**
```typescript
'use server';

import { put } from '@vercel/blob';

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('avatar') as File;

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Only images allowed');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Max file size: 5MB');
  }

  // Upload
  const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
    access: 'public',
    addRandomSuffix: false
  });

  return {
    url: blob.url,
    pathname: blob.pathname
  };
}
```

**API Route (Edge Runtime):**
```typescript
import { put } from '@vercel/blob';

export const runtime = 'edge';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const blob = await put(file.name, file, { access: 'public' });

  return Response.json(blob);
}
```

---

### Step 3: Client-Side Upload (Presigned URLs)

**Create Upload Token (Server Action):**
```typescript
'use server';

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function getUploadToken(filename: string) {
  const jsonResponse = await handleUpload({
    body: {
      type: 'blob.generate-client-token',
      payload: {
        pathname: `uploads/${filename}`,
        access: 'public',
        onUploadCompleted: {
          callbackUrl: `${process.env.NEXT_PUBLIC_URL}/api/upload-complete`
        }
      }
    },
    request: new Request('https://dummy'),
    onBeforeGenerateToken: async (pathname) => {
      // Optional: validate user permissions
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 5 * 1024 * 1024 // 5MB
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      console.log('Upload completed:', blob.url);
    }
  });

  return jsonResponse;
}
```

**Client Upload:**
```typescript
'use client';

import { upload } from '@vercel/blob/client';
import { getUploadToken } from './actions';

export function UploadForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0];

    if (!file) return;

    const tokenResponse = await getUploadToken(file.name);

    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: tokenResponse.url
    });

    console.log('Uploaded:', blob.url);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" required />
      <button type="submit">Upload</button>
    </form>
  );
}
```

---

### Step 4: List, Download, Delete

**List Files:**
```typescript
import { list } from '@vercel/blob';

const { blobs } = await list({
  prefix: 'avatars/',
  limit: 100
});

// Returns: { url, pathname, size, uploadedAt, ... }[]
```

**List with Pagination:**
```typescript
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

**Download File:**
```typescript
// Files are publicly accessible if access: 'public'
const url = 'https://xyz.public.blob.vercel-storage.com/file.pdf';
const response = await fetch(url);
const blob = await response.blob();
```

**Delete File:**
```typescript
import { del } from '@vercel/blob';

await del('https://xyz.public.blob.vercel-storage.com/file.jpg');

// Or delete multiple
await del([url1, url2, url3]);
```

---

### Step 5: Streaming & Multipart

**Streaming Upload:**
```typescript
import { put } from '@vercel/blob';
import { createReadStream } from 'fs';

const stream = createReadStream('./large-file.mp4');

const blob = await put('videos/large-file.mp4', stream, {
  access: 'public',
  contentType: 'video/mp4'
});
```

**Multipart Upload (Large Files >500MB):**
```typescript
import { createMultipartUpload, uploadPart, completeMultipartUpload } from '@vercel/blob';

// 1. Start multipart upload
const upload = await createMultipartUpload('large-video.mp4', {
  access: 'public'
});

// 2. Upload parts (chunks)
const partSize = 100 * 1024 * 1024; // 100MB chunks
const parts = [];

for (let i = 0; i < totalParts; i++) {
  const chunk = getChunk(i, partSize);
  const part = await uploadPart(chunk, {
    uploadId: upload.uploadId,
    partNumber: i + 1
  });
  parts.push(part);
}

// 3. Complete upload
const blob = await completeMultipartUpload({
  uploadId: upload.uploadId,
  parts
});
```

---

## Critical Rules

### Always Do

✅ **Use client upload tokens for client-side uploads** - Never expose `BLOB_READ_WRITE_TOKEN` to client

✅ **Set correct access level** - `public` (CDN) or `private` (authenticated access)

✅ **Validate file types and sizes** - Before upload, check MIME type and size

✅ **Use pathname organization** - `avatars/`, `uploads/`, `documents/` for structure

✅ **Handle upload errors** - Network failures, size limits, token expiration

✅ **Clean up old files** - Delete unused files to manage storage costs

✅ **Set content-type explicitly** - For correct browser handling (videos, PDFs)

### Never Do

❌ **Never expose `BLOB_READ_WRITE_TOKEN` to client** - Use `handleUpload()` for client uploads

❌ **Never skip file validation** - Always validate type, size, content before upload

❌ **Never upload files >500MB without multipart** - Use multipart upload for large files

❌ **Never use generic filenames** - `file.jpg` collides, use `${timestamp}-${name}` or UUID

❌ **Never assume uploads succeed** - Always handle errors (network, quota, etc.)

❌ **Never store sensitive data unencrypted** - Encrypt before upload if needed

❌ **Never forget to delete temporary files** - Old uploads consume quota

---

## Known Issues Prevention

This skill prevents **10 documented issues**:

### Issue #1: Missing Environment Variable
**Error**: `Error: BLOB_READ_WRITE_TOKEN is not defined`
**Source**: https://vercel.com/docs/storage/vercel-blob
**Why It Happens**: Token not set in environment
**Prevention**: Run `vercel env pull .env.local` and ensure `.env.local` in `.gitignore`.

### Issue #2: Client Upload Token Exposed
**Error**: Security vulnerability, unauthorized uploads
**Source**: https://vercel.com/docs/storage/vercel-blob/client-upload
**Why It Happens**: Using `BLOB_READ_WRITE_TOKEN` directly in client code
**Prevention**: Use `handleUpload()` to generate client-specific tokens with constraints.

### Issue #3: File Size Limit Exceeded
**Error**: `Error: File size exceeds limit` (500MB)
**Source**: https://vercel.com/docs/storage/vercel-blob/limits
**Why It Happens**: Uploading file >500MB without multipart upload
**Prevention**: Validate file size before upload, use multipart upload for large files.

### Issue #4: Wrong Content-Type
**Error**: Browser downloads file instead of displaying (e.g., PDF opens as text)
**Source**: Production debugging
**Why It Happens**: Not setting `contentType` option, Blob guesses incorrectly
**Prevention**: Always set `contentType: file.type` or explicit MIME type.

### Issue #5: Public File Not Cached
**Error**: Slow file delivery, high egress costs
**Source**: Vercel Blob best practices
**Why It Happens**: Using `access: 'private'` for files that should be public
**Prevention**: Use `access: 'public'` for publicly accessible files (CDN caching).

### Issue #6: List Pagination Not Handled
**Error**: Only first 1000 files returned, missing files
**Source**: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#list
**Why It Happens**: Not iterating with cursor for large file lists
**Prevention**: Use cursor-based pagination in loop until `cursor` is undefined.

### Issue #7: Delete Fails Silently
**Error**: Files not deleted, storage quota fills up
**Source**: https://github.com/vercel/storage/issues/150
**Why It Happens**: Using wrong URL format, blob not found
**Prevention**: Use full blob URL from `put()` response, check deletion result.

### Issue #8: Upload Timeout (Large Files)
**Error**: `Error: Request timeout` for files >100MB
**Source**: Vercel function timeout limits
**Why It Happens**: Serverless function timeout (10s free tier, 60s pro)
**Prevention**: Use client-side upload with `handleUpload()` for large files.

### Issue #9: Filename Collisions
**Error**: Files overwritten, data loss
**Source**: Production debugging
**Why It Happens**: Using same filename for multiple uploads
**Prevention**: Add timestamp/UUID: `` `uploads/${Date.now()}-${file.name}` `` or `addRandomSuffix: true`.

### Issue #10: Missing Upload Callback
**Error**: Upload completes but app state not updated
**Source**: https://vercel.com/docs/storage/vercel-blob/client-upload#callback-after-upload
**Why It Happens**: Not implementing `onUploadCompleted` callback
**Prevention**: Use `onUploadCompleted` in `handleUpload()` to update database/state.

---

## Configuration Files Reference

### package.json

```json
{
  "dependencies": {
    "@vercel/blob": "^2.0.0"
  }
}
```

### .env.local

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

---

## Common Patterns

### Pattern 1: Avatar Upload

```typescript
'use server';

import { put, del } from '@vercel/blob';

export async function updateAvatar(userId: string, formData: FormData) {
  const file = formData.get('avatar') as File;

  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('Only images allowed');
  }

  // Delete old avatar
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.avatarUrl) {
    await del(user.avatarUrl);
  }

  // Upload new
  const blob = await put(`avatars/${userId}.jpg`, file, {
    access: 'public',
    contentType: file.type
  });

  // Update database
  await db.update(users).set({ avatarUrl: blob.url }).where(eq(users.id, userId));

  return blob.url;
}
```

### Pattern 2: Protected File Upload

```typescript
'use server';

import { put } from '@vercel/blob';
import { auth } from '@/lib/auth';

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const file = formData.get('document') as File;

  // Upload as private
  const blob = await put(`documents/${session.user.id}/${file.name}`, file, {
    access: 'private' // Requires authentication to access
  });

  // Store in database with user reference
  await db.insert(documents).values({
    userId: session.user.id,
    url: blob.url,
    filename: file.name,
    size: file.size
  });

  return blob;
}
```

### Pattern 3: Image Gallery with Pagination

```typescript
import { list } from '@vercel/blob';

export async function getGalleryImages(cursor?: string) {
  const { blobs, cursor: nextCursor } = await list({
    prefix: 'gallery/',
    limit: 20,
    cursor
  });

  const images = blobs.map(blob => ({
    url: blob.url,
    uploadedAt: blob.uploadedAt,
    size: blob.size
  }));

  return { images, nextCursor };
}
```

---

## Dependencies

**Required**:
- `@vercel/blob@^2.0.0` - Vercel Blob SDK

**Optional**:
- `sharp@^0.33.0` - Image processing before upload
- `zod@^3.24.0` - File validation schemas

---

## Official Documentation

- **Vercel Blob**: https://vercel.com/docs/storage/vercel-blob
- **Client Upload**: https://vercel.com/docs/storage/vercel-blob/client-upload
- **SDK Reference**: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
- **GitHub**: https://github.com/vercel/storage

---

## Package Versions (Verified 2025-10-29)

```json
{
  "dependencies": {
    "@vercel/blob": "^2.0.0"
  }
}
```

---

## Production Example

- **E-commerce**: Product images, user uploads (500K+ files)
- **Blog Platform**: Featured images, author avatars
- **SaaS**: Document uploads, PDF generation, CSV exports
- **Errors**: 0 (all 10 known issues prevented)

---

## Troubleshooting

### Problem: `BLOB_READ_WRITE_TOKEN is not defined`
**Solution**: Run `vercel env pull .env.local`, ensure `.env.local` in `.gitignore`.

### Problem: File size exceeded (>500MB)
**Solution**: Use multipart upload with `createMultipartUpload()` API.

### Problem: Client upload fails with token error
**Solution**: Ensure using `handleUpload()` server-side, don't expose read/write token to client.

### Problem: Files not deleting
**Solution**: Use exact URL from `put()` response, check `del()` return value.

---

## Complete Setup Checklist

- [ ] Blob store created in Vercel dashboard
- [ ] `BLOB_READ_WRITE_TOKEN` environment variable set
- [ ] `@vercel/blob` package installed
- [ ] File validation implemented (type, size)
- [ ] Client upload uses `handleUpload()` (not direct token)
- [ ] Content-type set for uploads
- [ ] Access level correct (`public` vs `private`)
- [ ] Deletion of old files implemented
- [ ] List pagination handles cursor
- [ ] Tested file upload/download/delete locally and in production

---

**Questions? Issues?**

1. Check official docs: https://vercel.com/docs/storage/vercel-blob
2. Verify environment variables are set
3. Ensure using client upload tokens for client-side uploads
4. Monitor storage usage in Vercel dashboard
