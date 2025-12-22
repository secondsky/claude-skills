# Direct Creator Upload - Complete Workflow

Complete architecture and implementation guide for user-uploaded images.

---

## Architecture Overview

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Browser │                    │ Backend │                    │Cloudflare│
│ (User)  │                    │  API    │                    │  Images  │
└────┬────┘                    └────┬────┘                    └─────┬────┘
     │                              │                               │
     │ 1. Request upload URL        │                               │
     ├─────────────────────────────>│                               │
     │ POST /api/upload-url          │                               │
     │ { userId: "123" }             │                               │
     │                              │                               │
     │                              │ 2. Generate upload URL        │
     │                              ├──────────────────────────────>│
     │                              │ POST /direct_upload           │
     │                              │ { requireSignedURLs, metadata }│
     │                              │                               │
     │                              │ 3. Return uploadURL + ID      │
     │                              │<──────────────────────────────┤
     │                              │ { uploadURL, id }             │
     │                              │                               │
     │ 4. Return uploadURL          │                               │
     │<─────────────────────────────┤                               │
     │ { uploadURL, imageId }       │                               │
     │                              │                               │
     │ 5. Upload file directly      │                               │
     ├──────────────────────────────────────────────────────────────>│
     │ POST uploadURL                │                               │
     │ FormData: { file }            │                               │
     │                              │                               │
     │ 6. Success response          │                               │
     │<──────────────────────────────────────────────────────────────┤
     │ { success: true }            │                               │
     │                              │                               │
     │ 7. (Optional) Webhook        │                               │
     │                              │<──────────────────────────────┤
     │                              │ POST /webhook                 │
     │                              │ { imageId, status }           │
     │                              │                               │
```

---

## Implementation Steps

### Step 1: Backend - Generate Upload URL

**Endpoint**: `POST /api/upload-url`

```typescript
// backend.ts
interface Env {
  IMAGES_ACCOUNT_ID: string;
  IMAGES_API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Parse request
    const body = await request.json<{
      userId?: string;
      requireSignedURLs?: boolean;
    }>();

    // Generate one-time upload URL
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: body.requireSignedURLs ?? false,
          metadata: {
            userId: body.userId || 'anonymous',
            uploadedAt: new Date().toISOString()
          },
          expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
        })
      }
    );

    const result = await response.json();

    return Response.json({
      uploadURL: result.result?.uploadURL,
      imageId: result.result?.id
    });
  }
};
```

### Step 2: Frontend - Request Upload URL

```javascript
// frontend.js
async function requestUploadURL() {
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      requireSignedURLs: false
    })
  });

  const { uploadURL, imageId } = await response.json();
  return { uploadURL, imageId };
}
```

### Step 3: Frontend - Upload to Cloudflare

```javascript
async function uploadImage(file) {
  // Step 1: Get upload URL
  const { uploadURL, imageId } = await requestUploadURL();

  // Step 2: Upload directly to Cloudflare
  const formData = new FormData();
  formData.append('file', file); // MUST be named 'file'

  const response = await fetch(uploadURL, {
    method: 'POST',
    body: formData // NO Content-Type header - browser sets multipart/form-data
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return imageId;
}
```

---

## Frontend HTML Example

```html
<form id="upload-form">
  <input type="file" id="file-input" accept="image/*" />
  <button type="submit">Upload</button>
  <div id="status"></div>
</form>

<script>
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('file-input');
  const status = document.getElementById('status');
  const file = fileInput.files[0];

  if (!file) {
    status.textContent = 'Please select a file';
    return;
  }

  try {
    status.textContent = 'Requesting upload URL...';

    // Get upload URL from backend
    const urlResponse = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123' })
    });

    const { uploadURL, imageId } = await urlResponse.json();

    status.textContent = 'Uploading...';

    // Upload directly to Cloudflare
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData
    });

    if (uploadResponse.ok) {
      status.textContent = `✓ Upload successful! Image ID: ${imageId}`;
    } else {
      throw new Error('Upload failed');
    }

  } catch (error) {
    status.textContent = `✗ Error: ${error.message}`;
  }
});
</script>
```

---

## Webhook Integration

### Configure Webhook

1. Dashboard → Notifications → Destinations → Webhooks → Create
2. Enter webhook URL: `https://your-backend.com/webhook`
3. Notifications → All Notifications → Add → Images → Select webhook

### Handle Webhook

```typescript
// backend-webhook.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const webhook = await request.json();

    console.log('Image upload webhook:', webhook);
    // {
    //   imageId: "abc123",
    //   status: "uploaded",
    //   metadata: { userId: "user-123" }
    // }

    // Update database
    await db.images.create({
      id: webhook.imageId,
      userId: webhook.metadata.userId,
      status: webhook.status,
      uploadedAt: new Date()
    });

    return Response.json({ received: true });
  }
};
```

---

## Draft vs Uploaded State

When you generate upload URL, image record is created in **draft** state.

**Check status**:
```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
  {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  }
);

const result = await response.json();

if (result.result?.draft) {
  console.log('Upload not completed yet');
} else {
  console.log('Upload complete, image available');
}
```

---

## Error Handling

### Backend Errors

```typescript
try {
  const response = await fetch(directUploadURL, { ... });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudflare error: ${error.errors?.[0]?.message}`);
  }

  return result;

} catch (error) {
  console.error('Failed to generate upload URL:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Frontend Errors

```javascript
// File size validation
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large (max 10MB)');
}

// File type validation
if (!file.type.startsWith('image/')) {
  throw new Error('Please select an image file');
}

// Upload timeout
const timeout = setTimeout(() => {
  throw new Error('Upload timeout (30s limit)');
}, 28000); // 28s (before Cloudflare's 30s timeout)

try {
  await fetch(uploadURL, { body: formData });
  clearTimeout(timeout);
} catch (error) {
  clearTimeout(timeout);
  throw error;
}
```

---

## Custom ID Support

```typescript
// Generate upload URL with custom ID
const response = await fetch(directUploadURL, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    id: `user-${userId}-profile`, // Custom ID
    metadata: { userId }
  })
});

// Access with custom ID
const imageURL = `https://imagedelivery.net/${accountHash}/user-${userId}-profile/public`;
```

**Note**: Custom IDs cannot be used with `requireSignedURLs=true`.

---

## Expiry Configuration

```typescript
// Default: 30 minutes
// Min: 2 minutes
// Max: 6 hours

const expiry = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

const response = await fetch(directUploadURL, {
  method: 'POST',
  body: JSON.stringify({
    expiry: expiry.toISOString()
  })
});
```

---

## Security Best Practices

1. **Never expose API token to browser**: Backend-only
2. **Validate file type and size**: Frontend and backend
3. **Rate limit upload URL generation**: Prevent abuse
4. **Associate uploads with users**: Track in metadata
5. **Implement webhooks**: Verify successful uploads
6. **Set reasonable expiry**: 30min-1hr for most cases
7. **Use signed URLs for private content**: `requireSignedURLs=true`

---

## Testing

```bash
# Test backend endpoint
curl -X POST http://localhost:8787/api/upload-url \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Test upload (replace UPLOAD_URL with response)
curl -X POST "UPLOAD_URL" \
  -F "file=@./test-image.jpg"
```

---

## Official Documentation

- **Direct Creator Upload**: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
- **Configure Webhooks**: https://developers.cloudflare.com/images/manage-images/configure-webhooks/
