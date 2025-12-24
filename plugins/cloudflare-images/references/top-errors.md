# Top Errors and Solutions

Complete troubleshooting guide for all documented Cloudflare Images errors.

---

## Direct Creator Upload Errors

### 1. CORS Error - Content-Type Not Allowed

**Error**:
```
Access to XMLHttpRequest blocked by CORS policy: Request header field content-type is not allowed by Access-Control-Allow-Headers
```

**Source**: [Cloudflare Community #345739](https://community.cloudflare.com/t/direct-image-upload-cors-error/345739), [#368114](https://community.cloudflare.com/t/cloudflare-images-direct-upload-cors-problem/368114)

**Why It Happens**:
Server CORS settings only allow `multipart/form-data` for Content-Type header.

**Solution**:
```javascript
// ✅ CORRECT
const formData = new FormData();
formData.append('file', fileInput.files[0]);
await fetch(uploadURL, {
  method: 'POST',
  body: formData // Browser sets multipart/form-data automatically
});

// ❌ WRONG
await fetch(uploadURL, {
  headers: { 'Content-Type': 'application/json' }, // CORS error
  body: JSON.stringify({ file: base64Image })
});
```

**Prevention**:
- Use FormData API
- Let browser set Content-Type header (don't set manually)
- Name field `file` (not `image` or other)

---

### 2. Error 5408 - Upload Timeout

**Error**: `Error 5408` after ~15 seconds

**Source**: [Cloudflare Community #571336](https://community.cloudflare.com/t/images-direct-creator-upload-error-5408/571336)

**Why It Happens**:
Cloudflare has 30-second request timeout. Slow uploads or large files exceed limit.

**Solution**:
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  alert('File too large. Please select an image under 10MB.');
  return;
}

// Compress image before upload (optional)
async function compressImage(file) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await createImageBitmap(file);

  const maxWidth = 4000;
  const scale = Math.min(1, maxWidth / img.width);

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}
```

**Prevention**:
- Limit file size (10MB max recommended)
- Compress images client-side if needed
- Show upload progress to user
- Handle timeout errors gracefully

---

### 3. Error 400 - Invalid File Parameter

**Error**: `400 Bad Request` with unhelpful message

**Source**: [Cloudflare Community #487629](https://community.cloudflare.com/t/direct-creator-upload-returning-400/487629)

**Why It Happens**:
File field must be named `file` (not `image`, `photo`, etc.).

**Solution**:
```javascript
// ✅ CORRECT
formData.append('file', imageFile);

// ❌ WRONG
formData.append('image', imageFile); // 400 error
formData.append('photo', imageFile); // 400 error
formData.append('upload', imageFile); // 400 error
```

**Prevention**:
- Always name the field `file`
- Check FormData contents before sending

---

### 4. CORS Preflight Failures

**Error**: Preflight OPTIONS request blocked

**Source**: [Cloudflare Community #306805](https://community.cloudflare.com/t/cors-error-when-using-direct-creator-upload/306805)

**Why It Happens**:
Calling `/direct_upload` API directly from browser (should be backend-only).

**Solution**:
```
CORRECT ARCHITECTURE:

Browser → POST /api/upload-url → Backend
                                    ↓
                                 POST /direct_upload → Cloudflare API
                                    ↓
Backend ← Returns uploadURL ← Cloudflare API
   ↓
Browser receives uploadURL
   ↓
Browser → Uploads to uploadURL → Cloudflare (direct upload)
```

**Prevention**:
- Never expose API token to browser
- Generate upload URL on backend
- Return uploadURL to frontend
- Frontend uploads to uploadURL (not /direct_upload)

---

## Image Transformation Errors

### 5. Error 9401 - Invalid Arguments

**Error**: `Cf-Resized: err=9401` in response headers

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Missing required `cf.image` parameters or invalid values.

**Solution**:
```typescript
// ✅ CORRECT
fetch(imageURL, {
  cf: {
    image: {
      width: 800,
      quality: 85,
      format: 'auto'
    }
  }
});

// ❌ WRONG
fetch(imageURL, {
  cf: {
    image: {
      width: 'large', // Must be number
      quality: 150, // Max 100
      format: 'invalid' // Must be valid format
    }
  }
});
```

**Prevention**:
- Validate all parameters
- Use TypeScript for type checking
- Check official docs for valid ranges

---

### 6. Error 9402 - Image Too Large

**Error**: `Cf-Resized: err=9402`

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Image exceeds maximum area or download fails.

**Solution**:
```typescript
// Check image dimensions before transforming
const response = await fetch(imageURL, { method: 'HEAD' });
// Or fetch and check after
const img = await fetch(imageURL);
// Validate size
```

**Prevention**:
- Validate source image dimensions
- Max 100 megapixels (e.g., 10000x10000px)
- Use reasonable source images

---

### 7. Error 9403 - Request Loop

**Error**: `Cf-Resized: err=9403`

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Worker fetching its own URL or already-resized image.

**Solution**:
```typescript
// ✅ CORRECT - Fetch external origin
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/images/')) {
      const imagePath = url.pathname.replace('/images/', '');
      const originURL = `https://storage.example.com/${imagePath}`;

      return fetch(originURL, {
        cf: { image: { width: 800 } }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

// ❌ WRONG - Fetches worker's own URL (loop)
export default {
  async fetch(request: Request): Promise<Response> {
    return fetch(request, { // Fetches self
      cf: { image: { width: 800 } }
    });
  }
};
```

**Prevention**:
- Always fetch external origin
- Don't transform already-transformed images
- Check URL routing logic

---

### 8. Error 9406/9419 - Invalid URL Format

**Error**: `Cf-Resized: err=9406` or `err=9419`

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Image URL uses HTTP (not HTTPS) or contains spaces/unescaped Unicode.

**Solution**:
```typescript
// ✅ CORRECT
const filename = "photo name.jpg";
const imageURL = `https://example.com/images/${encodeURIComponent(filename)}`;

// ❌ WRONG
const imageURL = "http://example.com/image.jpg"; // HTTP not allowed
const imageURL = "https://example.com/photo name.jpg"; // Space not encoded
```

**Prevention**:
- Always use HTTPS (HTTP not supported)
- URL-encode all paths with `encodeURIComponent()`
- No spaces or unescaped Unicode in URLs

---

### 9. Error 9412 - Non-Image Response

**Error**: `Cf-Resized: err=9412`

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Origin server returns HTML (e.g., 404 page) instead of image.

**Solution**:
```typescript
// Verify URL before transforming
const originResponse = await fetch(imageURL, { method: 'HEAD' });
const contentType = originResponse.headers.get('content-type');

if (!contentType?.startsWith('image/')) {
  return new Response('Not an image', { status: 400 });
}

return fetch(imageURL, {
  cf: { image: { width: 800 } }
});
```

**Prevention**:
- Verify origin returns image (check Content-Type)
- Handle 404s before transforming
- Validate image URLs

---

### 10. Error 9413 - Max Image Area Exceeded

**Error**: `Cf-Resized: err=9413`

**Source**: [Cloudflare Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**:
Source image exceeds 100 megapixels (e.g., 10000x10000px).

**Solution**:
```typescript
const MAX_MEGAPIXELS = 100;

if (width * height > MAX_MEGAPIXELS * 1_000_000) {
  return new Response('Image too large', { status: 413 });
}
```

**Prevention**:
- Validate image dimensions before transforming
- Pre-process oversized images
- Reject images above threshold (100 megapixels)

---

## Configuration Errors

### 11. Flexible Variants + Signed URLs Incompatibility

**Error**: Flexible variants don't work with private images

**Source**: [Cloudflare Docs - Enable flexible variants](https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/)

**Why It Happens**:
Flexible variants cannot be used with `requireSignedURLs=true`.

**Solution**:
```typescript
// ✅ CORRECT - Use named variants for private images
await uploadImage({
  file: imageFile,
  requireSignedURLs: true // Use named variants: /public, /avatar, etc.
});

// ❌ WRONG - Flexible variants don't support signed URLs
// Cannot use: /w=400,sharpen=3 with requireSignedURLs=true
```

**Prevention**:
- Use named variants for private images
- Use flexible variants for public images only

---

### 12. SVG Resizing Limitation

**Error**: SVG files don't resize via transformations

**Source**: [Cloudflare Docs - SVG files](https://developers.cloudflare.com/images/transform-images/#svg-files)

**Why It Happens**:
SVG is vector format (inherently scalable), resizing not applicable.

**Solution**:
```typescript
// SVGs can be served but not resized
// Use any variant name as placeholder
// https://imagedelivery.net/<HASH>/<SVG_ID>/public

// SVG will be served at original size regardless of variant settings
```

**Prevention**:
- Don't try to resize SVGs
- Serve SVGs as-is
- Use variants as placeholders

---

### 13. EXIF Metadata Stripped by Default

**Error**: GPS data, camera settings removed from uploaded JPEGs

**Source**: [Cloudflare Docs - Transform via URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/#metadata)

**Why It Happens**:
Default behavior strips all metadata except copyright.

**Solution**:
```typescript
// Preserve metadata
fetch(imageURL, {
  cf: {
    image: {
      width: 800,
      metadata: 'keep' // Options: 'none', 'copyright', 'keep'
    }
  }
});
```

**Prevention**:
- Use `metadata=keep` if preservation needed
- Default `copyright` for JPEG
- Color profiles and EXIF rotation always applied

---

## General Troubleshooting

### Images not transforming

**Symptoms**: `/cdn-cgi/image/...` returns original or 404

**Solutions**:
1. Enable transformations: Dashboard → Images → Transformations → Enable
2. Verify zone proxied (orange cloud)
3. Check source image accessible
4. Wait 5-10 minutes for propagation

### Signed URLs returning 403

**Symptoms**: 403 Forbidden with signed URL

**Solutions**:
1. Verify image uploaded with `requireSignedURLs=true`
2. Check signature generation (HMAC-SHA256)
3. Ensure expiry in future
4. Verify signing key matches dashboard
5. Cannot use flexible variants (use named variants)

---

## Checking for Errors

**Response Headers**:
```javascript
const response = await fetch(transformedImageURL);
const cfResized = response.headers.get('Cf-Resized');

if (cfResized?.includes('err=')) {
  console.error('Transformation error:', cfResized);
}
```

**Common patterns**:
- `Cf-Resized: err=9401` - Invalid arguments
- `Cf-Resized: err=9403` - Request loop
- `Cf-Resized: err=9412` - Non-image response

---

## Official Documentation

- **Troubleshooting**: https://developers.cloudflare.com/images/reference/troubleshooting/
- **Transform via Workers**: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
