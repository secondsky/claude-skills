# Vercel Blob Skill

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-29
**Package Version**: `@vercel/blob@2.0.0`

---

## Auto-Trigger Keywords

### Primary
- `@vercel/blob`, `vercel blob`, `vercel storage`, `vercel file upload`

### Use Cases
- file upload, image upload, PDF upload, avatar upload, client upload, presigned URL, multipart upload

### Errors
- "BLOB_READ_WRITE_TOKEN not set", "file size limit exceeded", "client upload token error"

---

## What This Skill Does

Object storage for Vercel applications with automatic CDN distribution. Perfect for user uploads, images, documents, and media files.

✅ Simple upload API (put/list/del)
✅ Client-side uploads (presigned URLs)
✅ Automatic CDN distribution
✅ 10 errors prevented (token security, file limits, etc.)
✅ ~60% token savings

---

## Quick Start

```bash
# 1. Create Blob store in Vercel dashboard
vercel env pull .env.local

# 2. Install
bun add @vercel/blob  # preferred
# or: npm install @vercel/blob

# 3. Upload (server)
import { put } from '@vercel/blob';
const blob = await put('file.jpg', file, { access: 'public' });

# 4. Client upload (secure)
import { handleUpload } from '@vercel/blob/client';
const token = await handleUpload({ ... });
```

**Full details**: [SKILL.md](SKILL.md)

---

## Production Templates

Ready-to-use React components for common file upload patterns:

### UI Components
- **`templates/drag-drop-upload.tsx`** - Complete drag & drop upload with progress tracking, file preview, error handling, and batch upload support
- **`templates/avatar-upload-flow.tsx`** - Full avatar upload flow with image preview, validation, delete old avatar, and server action variant
- **`templates/file-list-manager.tsx`** - Display uploaded files with view/download/delete actions, pagination, and file type icons

### Configuration
- **`templates/package.json`** - Dependencies and versions for Vercel Blob + Next.js

All templates include:
- ✅ File validation (type, size)
- ✅ Progress tracking
- ✅ Error handling
- ✅ TypeScript types
- ✅ Server action examples
- ✅ Client upload tokens (secure)

---

## Errors Prevented (10 Total)

1. Missing environment variable
2. Client upload token exposed (security)
3. File size limit exceeded (>500MB)
4. Wrong content-type
5. Public file not cached
6. List pagination not handled
7. Delete fails silently
8. Upload timeout (large files)
9. Filename collisions
10. Missing upload callback

---

## Related Skills

- **cloudflare-r2**: Cloudflare's S3-compatible object storage
- **vercel-kv**: For small key-value data (not files)
- **neon-vercel-postgres**: For structured data (not files)

---

## Official Docs

- https://vercel.com/docs/storage/vercel-blob
- https://vercel.com/docs/storage/vercel-blob/client-upload
