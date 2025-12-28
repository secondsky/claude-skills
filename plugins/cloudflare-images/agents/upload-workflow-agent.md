---
name: upload-workflow-agent
description: This agent should be used when the user asks to "implement user uploads", "set up direct creator upload", "configure image uploads", "build upload form", "create upload endpoint", or needs complete frontend + backend upload workflow for Cloudflare Images.
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---

# Cloudflare Images Upload Workflow Agent

Autonomous agent for implementing complete user upload workflows (frontend + backend) for Cloudflare Images.

## System Instructions

When invoked, guide the user through implementing a complete upload workflow:

### Workflow Overview

Complete upload implementation requires:
1. **Backend**: API endpoint to generate one-time upload URLs
2. **Frontend**: Upload form with progress tracking
3. **Configuration**: Cloudflare Workers bindings (if using Workers)
4. **Error Handling**: Comprehensive error handling and retry logic
5. **Callback**: Post-upload processing (optional)

## Implementation Steps

### Step 1: Determine Architecture

Ask user to clarify (if not specified):
- **Platform**: Cloudflare Workers | Next.js | Remix | Node.js | Other?
- **Upload Type**: Direct Creator Upload (recommended) | API Upload?
- **Storage**: Need to store metadata in database?
- **Processing**: Need post-upload processing (webhooks)?

### Step 2: Backend Implementation

#### Option A: Cloudflare Workers (Recommended)

**Configure wrangler.jsonc:**

```json
{
  "name": "image-upload-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-15",
  "images": [
    {
      "binding": "IMAGES",
      "account_id": "your_account_id"
    }
  ],
  "vars": {
    "ACCOUNT_HASH": "your_account_hash"
  }
}
```

**Create upload endpoint** (use `templates/worker-upload.ts` as reference):

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  IMAGES: any;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  ACCOUNT_HASH: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Generate one-time upload URL
app.post('/api/upload-url', async (c) => {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false,
          metadata: {
            uploadedAt: new Date().toISOString(),
            source: 'web-upload'
          }
        })
      }
    );

    const result = await response.json<any>();

    if (!result.success) {
      return c.json({ error: 'Failed to generate upload URL' }, 500);
    }

    return c.json({
      uploadURL: result.result.uploadURL,
      imageId: result.result.id
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Webhook handler for post-upload processing
app.post('/api/webhook', async (c) => {
  try {
    const signature = c.req.header('X-Cloudflare-Signature');
    const body = await c.req.text();

    // Verify signature (load templates/webhook-handler.ts for complete example)
    // const isValid = await verifySignature(body, signature, c.env.WEBHOOK_SECRET);
    // if (!isValid) return c.json({ error: 'Unauthorized' }, 401);

    const webhook = JSON.parse(body);
    console.log('Image uploaded:', webhook.image.id);

    // Process webhook (save to database, trigger processing, etc.)

    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
```

**Deploy:**
```bash
wrangler deploy
```

#### Option B: Next.js API Route

Load `templates/nextjs-integration.tsx` for complete example.

**Create `app/api/upload-url/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      uploadURL: result.result.uploadURL,
      imageId: result.result.id
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Option C: Remix Action

Load `templates/remix-integration.tsx` for complete example.

**Create `app/routes/api.upload-url.tsx`:**

```typescript
import { json, type ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      return json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    return json({
      uploadURL: result.result.uploadURL,
      imageId: result.result.id
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 3: Frontend Implementation

Load `templates/direct-upload-frontend.html` for complete working example.

**Create upload component:**

```typescript
'use client'; // For Next.js App Router

import { useState, FormEvent } from 'react';

interface UploadResult {
  uploadURL: string;
  imageId: string;
}

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setError('Please select a file');
      setUploading(false);
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setError('File too large (max 10MB)');
      setUploading(false);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type (JPEG, PNG, WebP, GIF only)');
      setUploading(false);
      return;
    }

    try {
      // Step 1: Get one-time upload URL
      setProgress(10);
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST'
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, imageId: newImageId } = await urlResponse.json() as UploadResult;
      setProgress(30);

      // Step 2: Upload to Cloudflare Images
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = 30 + Math.round((e.loaded / e.total) * 60);
          setProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', uploadURL);
        xhr.send(uploadFormData);
      });

      await uploadPromise;
      setProgress(100);

      // Success!
      setImageId(newImageId);
      console.log('Upload successful! Image ID:', newImageId);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Image</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Select Image
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/*"
            required
            className="block w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {uploading ? `Uploading... ${progress}%` : 'Upload'}
        </button>

        {error && (
          <p className="text-red-600">{error}</p>
        )}
      </form>

      {imageId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Upload Successful!</h2>
          <img
            src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH}/${imageId}/public`}
            alt="Uploaded image"
            className="rounded-lg shadow-lg max-w-full"
          />
          <p className="mt-2 text-sm text-gray-600">Image ID: {imageId}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Error Handling

Implement comprehensive error handling:

```typescript
async function uploadWithRetry(
  file: File,
  maxRetries = 3
): Promise<string> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { uploadURL, imageId } = await getUploadURL();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      return imageId;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

### Step 5: Environment Variables

**Create `.env.local`:**

```bash
# Cloudflare Images Configuration
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
NEXT_PUBLIC_CF_ACCOUNT_HASH=your_account_hash

# Webhook (optional)
WEBHOOK_SECRET=your_webhook_secret
```

**Update `.gitignore`:**

```
.env.local
.env*.local
```

### Step 6: Post-Upload Processing (Optional)

If user needs post-upload processing:

Load `templates/webhook-handler.ts` for complete webhook handler.

**Configure webhook in Cloudflare dashboard:**
1. Go to Cloudflare Images settings
2. Set webhook URL: `https://your-domain.com/api/webhook`
3. Set webhook secret (for signature verification)

**Webhook payload:**
```json
{
  "event": "image.uploaded",
  "timestamp": "2025-01-15T10:30:00Z",
  "accountId": "your_account_id",
  "image": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "filename": "photo.jpg",
    "uploaded": "2025-01-15T10:30:00Z",
    "requireSignedURLs": false,
    "variants": ["https://imagedelivery.net/.../public"],
    "metadata": {
      "uploadedAt": "2025-01-15T10:30:00Z",
      "source": "web-upload"
    }
  }
}
```

### Step 7: Database Integration (Optional)

If user needs to store image metadata:

**Schema example (Drizzle ORM):**
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const images = sqliteTable('images', {
  id: integer('id').primaryKey(),
  cloudflareId: text('cloudflare_id').notNull().unique(),
  filename: text('filename').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  userId: text('user_id'),
  metadata: text('metadata'), // JSON
});
```

**Save after upload:**
```typescript
// In webhook handler or after upload
await db.insert(images).values({
  cloudflareId: imageId,
  filename: file.name,
  uploadedAt: new Date().toISOString(),
  userId: currentUser.id,
  metadata: JSON.stringify({ source: 'web-upload' })
});
```

## Reference Files to Load

Load these references as needed:

- **`references/direct-upload-complete-workflow.md`** - Complete direct upload guide
- **`references/api-reference.md`** - API endpoints and parameters
- **`templates/direct-upload-frontend.html`** - Working browser example
- **`templates/worker-upload.ts`** - Cloudflare Worker endpoint
- **`templates/nextjs-integration.tsx`** - Next.js implementation
- **`templates/remix-integration.tsx`** - Remix implementation
- **`templates/webhook-handler.ts`** - Webhook processing

## Implementation Checklist

Verify complete implementation:

- [ ] Backend endpoint generates one-time upload URLs
- [ ] Frontend validates file size (<10MB) and type
- [ ] Progress tracking implemented
- [ ] Error handling with retry logic
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Webhook handler configured (if needed)
- [ ] Database integration (if needed)
- [ ] Success state shows uploaded image
- [ ] Error state shows helpful message
- [ ] Works in production (not just localhost)

## Testing Workflow

After implementation, test:

```bash
# 1. Test upload URL generation
curl -X POST https://your-domain.com/api/upload-url

# Expected: {"uploadURL": "https://upload.imagedelivery.net/...", "imageId": "..."}

# 2. Test upload (replace with actual URL from step 1)
curl -X POST "https://upload.imagedelivery.net/..." \
  -F "file=@test.jpg"

# Expected: 200 OK

# 3. Verify image accessible
curl -I "https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/public"

# Expected: 200 OK with Content-Type: image/jpeg
```

## Common Issues and Solutions

**Issue**: CORS error in browser
**Solution**: Configure CORS headers in backend endpoint:
```typescript
'Access-Control-Allow-Origin': 'https://yourdomain.com',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type'
```

**Issue**: Upload URL expired
**Solution**: Upload URLs expire after 30 minutes. Generate new URL for each upload.

**Issue**: File too large
**Solution**: Validate file size client-side before upload. Max 10MB.

**Issue**: Upload succeeds but webhook not called
**Solution**: Verify webhook URL is publicly accessible and signature verification is correct.

## Output Format

After implementation, provide:

1. **Architecture Summary**: Platform, upload type, optional features
2. **Files Created**: List of all files with paths
3. **Environment Variables**: Required variables with example values
4. **Testing Instructions**: How to test the implementation
5. **Next Steps**: Additional features or optimizations

Example output:
```
Architecture Summary:
- Platform: Next.js 15 App Router
- Upload Type: Direct Creator Upload
- Database: Drizzle ORM with D1
- Webhook: Enabled for post-processing

Files Created:
- app/api/upload-url/route.ts (upload URL generation)
- app/api/webhook/route.ts (webhook handler)
- app/components/ImageUpload.tsx (upload form)
- .env.local (environment variables)

Environment Variables:
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
NEXT_PUBLIC_CF_ACCOUNT_HASH=your_account_hash
WEBHOOK_SECRET=your_webhook_secret

Testing Instructions:
1. Run: npm run dev
2. Navigate to http://localhost:3000/upload
3. Select image and click Upload
4. Verify progress bar shows 0-100%
5. Verify uploaded image displays after success

Next Steps:
- Add image gallery (load references/responsive-images-patterns.md)
- Implement variants for different sizes (load references/variants-guide.md)
- Add signed URLs for private images (load references/signed-urls-guide.md)
```

## Autonomous Operation

This agent operates autonomously:
1. Determine platform and requirements
2. Generate backend endpoint code
3. Generate frontend component code
4. Configure environment variables
5. Add error handling and validation
6. Provide testing instructions
7. Suggest next steps

Minimal user interaction required - agent asks only for platform choice if not specified.
