# Vercel Blob Common Patterns

This reference provides production-tested patterns for Vercel Blob.

---

## Pattern 1: Avatar Upload with Replacement

Upload new avatar and delete old one automatically.

```typescript
'use server';

import { put, del } from '@vercel/blob';

export async function updateAvatar(userId: string, formData: FormData) {
  const file = formData.get('avatar') as File;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only images allowed');
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)');
  }

  // Get current avatar URL from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  // Delete old avatar if exists
  if (user?.avatarUrl) {
    await del(user.avatarUrl);
  }

  // Upload new avatar
  const blob = await put(`avatars/${userId}.${file.type.split('/')[1]}`, file, {
    access: 'public',
    contentType: file.type
  });

  // Update database
  await db.update(users)
    .set({ avatarUrl: blob.url })
    .where(eq(users.id, userId));

  return blob.url;
}
```

---

## Pattern 2: Protected Document Upload

Upload files that require authentication to access.

```typescript
'use server';

import { put } from '@vercel/blob';
import { auth } from '@/lib/auth';

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const file = formData.get('document') as File;

  // Validate allowed types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Upload as private (requires signed URLs to access)
  const blob = await put(
    `documents/${session.user.id}/${Date.now()}-${file.name}`,
    file,
    {
      access: 'private',
      contentType: file.type
    }
  );

  // Store reference in database
  await db.insert(documents).values({
    userId: session.user.id,
    url: blob.url,
    filename: file.name,
    size: file.size,
    contentType: file.type
  });

  return blob;
}
```

---

## Pattern 3: Image Gallery with Pagination

List images with pagination and display.

```typescript
import { list } from '@vercel/blob';

interface GalleryResponse {
  images: {
    url: string;
    uploadedAt: Date;
    size: number;
  }[];
  nextCursor?: string;
  hasMore: boolean;
}

export async function getGalleryImages(
  cursor?: string,
  limit: number = 20
): Promise<GalleryResponse> {
  const { blobs, cursor: nextCursor } = await list({
    prefix: 'gallery/',
    limit,
    cursor
  });

  const images = blobs.map(blob => ({
    url: blob.url,
    uploadedAt: blob.uploadedAt,
    size: blob.size
  }));

  return {
    images,
    nextCursor,
    hasMore: !!nextCursor
  };
}

// Usage in component
export async function GalleryPage({ searchParams }: { searchParams: { cursor?: string } }) {
  const { images, nextCursor, hasMore } = await getGalleryImages(searchParams.cursor);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, i) => (
          <img key={i} src={img.url} alt="" className="w-full h-auto" />
        ))}
      </div>
      {hasMore && (
        <a href={`?cursor=${nextCursor}`}>Load More</a>
      )}
    </div>
  );
}
```

---

## Pattern 4: Client-Side Upload with Progress

Direct client upload with progress tracking.

**Server Action (Token Generation):**
```typescript
'use server';

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function generateUploadToken(body: HandleUploadBody) {
  return await handleUpload({
    body,
    request: new Request('https://dummy'),
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maximumSizeInBytes: 10 * 1024 * 1024 // 10MB
    }),
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      // Save to database
      await db.insert(uploads).values({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size
      });
    }
  });
}
```

**Client Component:**
```typescript
'use client';

import { upload } from '@vercel/blob/client';
import { useState } from 'react';
import { generateUploadToken } from './actions';

export function UploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Generate token
      const tokenResponse = await generateUploadToken({
        type: 'blob.generate-client-token',
        payload: {
          pathname: `uploads/${file.name}`,
          access: 'public'
        }
      });

      // Upload with progress
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: tokenResponse.url,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percent);
        }
      });

      console.log('Upload complete:', blob.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Pattern 5: Multipart Upload for Large Files

Upload files >500MB using multipart upload.

```typescript
import {
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload
} from '@vercel/blob';

const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks

export async function uploadLargeFile(
  file: File,
  onProgress?: (percent: number) => void
) {
  // 1. Initialize multipart upload
  const upload = await createMultipartUpload(file.name, {
    access: 'public',
    contentType: file.type
  });

  // 2. Calculate chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const parts = [];

  // 3. Upload each chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const part = await uploadPart(chunk, {
      uploadId: upload.uploadId,
      partNumber: i + 1
    });

    parts.push(part);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  // 4. Complete upload
  const blob = await completeMultipartUpload({
    uploadId: upload.uploadId,
    parts
  });

  return blob;
}

// Usage
const blob = await uploadLargeFile(largeVideoFile, (percent) => {
  console.log(`Upload progress: ${percent}%`);
});
```

---

## Pattern 6: Batch File Operations

Upload or delete multiple files efficiently.

```typescript
import { put, del, list } from '@vercel/blob';

// Batch upload
export async function uploadMultipleFiles(files: File[]) {
  const uploads = await Promise.all(
    files.map(file =>
      put(`uploads/${Date.now()}-${file.name}`, file, {
        access: 'public',
        contentType: file.type
      })
    )
  );

  return uploads;
}

// Batch delete
export async function deleteMultipleFiles(urls: string[]) {
  await del(urls);
}

// Delete all files in folder
export async function clearFolder(prefix: string) {
  const { blobs } = await list({ prefix });
  const urls = blobs.map(b => b.url);

  if (urls.length > 0) {
    await del(urls);
  }

  return urls.length;
}
```

---

## Pattern 7: Image Processing Before Upload

Resize and optimize images before uploading.

```typescript
'use server';

import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function uploadOptimizedImage(formData: FormData) {
  const file = formData.get('image') as File;
  const buffer = await file.arrayBuffer();

  // Resize and convert to WebP
  const optimized = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Upload optimized image
  const blob = await put(
    `images/${Date.now()}.webp`,
    optimized,
    {
      access: 'public',
      contentType: 'image/webp'
    }
  );

  return blob.url;
}
```

---

## Quick Reference

| Pattern | Use Case | Key API |
|---------|----------|---------|
| Avatar Upload | User profile images | `put`, `del` |
| Protected Upload | Private documents | `put` with `access: 'private'` |
| Image Gallery | List & paginate | `list` with cursor |
| Client Upload | Large files, progress | `upload`, `handleUpload` |
| Multipart Upload | Files >500MB | `createMultipartUpload`, `uploadPart` |
| Batch Operations | Multiple files | `Promise.all`, `del([...])` |
| Image Processing | Optimize before upload | `sharp` + `put` |

---

## See Also

- **Official Docs**: https://vercel.com/docs/storage/vercel-blob
- **Client Upload**: https://vercel.com/docs/storage/vercel-blob/client-upload
- **SDK Reference**: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
