---
name: cloudflare-images
description: |
  This skill provides comprehensive knowledge for Cloudflare Images, covering both the Images API (upload/storage) and Image Transformations (optimize any image). It should be used when uploading images to Cloudflare, resizing images, optimizing image delivery, implementing direct creator uploads, creating image variants, generating signed URLs for private images, transforming images via Workers, or encountering image upload/transformation errors.

  Use when: setting up Cloudflare Images storage, implementing user-uploaded images, creating responsive images, optimizing image formats (WebP/AVIF), resizing images via URL or Workers, debugging CORS errors with direct uploads, handling image transformation errors (9401-9413), implementing signed URLs, managing image variants, or building image CDNs.

  Keywords: cloudflare images, image upload cloudflare, imagedelivery.net, cloudflare image transformations, /cdn-cgi/image/, direct creator upload, image variants, cf.image workers, signed urls images, flexible variants, webp avif conversion, responsive images cloudflare, error 5408, error 9401, error 9403, CORS direct upload, multipart/form-data, image optimization cloudflare
license: MIT
---

# Cloudflare Images

**Status**: Production Ready ✅
**Last Updated**: 2025-10-26
**Dependencies**: Cloudflare account with Images enabled
**Latest Versions**: Cloudflare Images API v2

---

## Overview

Cloudflare Images provides two powerful features:

1. **Images API**: Upload, store, and serve images with automatic optimization and variants
2. **Image Transformations**: Resize, optimize, and transform any publicly accessible image

**Key Benefits**:
- Global CDN delivery
- Automatic WebP/AVIF conversion
- Variants for different use cases (up to 100)
- Direct creator upload (user uploads without API keys)
- Signed URLs for private images
- Transform any image via URL or Workers

---

## Quick Start (5 Minutes)

### 1. Enable Cloudflare Images

Log into Cloudflare dashboard → **Images** → Enable for your account.

Get your Account ID and create an API token with **Cloudflare Images: Edit** permissions.

**Why this matters:**
- Account ID and API token are required for all API operations
- Images Free plan includes limited transformations

### 2. Upload Your First Image

```bash
curl --request POST \
  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1 \
  --header 'Authorization: Bearer <API_TOKEN>' \
  --header 'Content-Type: multipart/form-data' \
  --form 'file=@./image.jpg'
```

Response includes:
- `id`: Image ID for serving
- `variants`: Array of delivery URLs

**CRITICAL:**
- Use `multipart/form-data` encoding (NOT `application/json`)
- Image ID is automatically generated (or use custom ID)

### 3. Serve the Image

```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public" />
```

Default `public` variant serves the image. Replace with your own variant names.

### 4. Enable Image Transformations

Dashboard → **Images** → **Transformations** → Select your zone → **Enable for zone**

Now you can transform ANY image:

```html
<img src="/cdn-cgi/image/width=800,quality=85/uploads/photo.jpg" />
```

**Why this matters:**
- Works on images stored OUTSIDE Cloudflare Images
- Automatic caching on Cloudflare's global network
- No additional storage costs

### 5. Transform via Workers (Advanced)

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const imageURL = "https://example.com/image.jpg";

    return fetch(imageURL, {
      cf: {
        image: {
          width: 800,
          quality: 85,
          format: "auto" // WebP/AVIF for supporting browsers
        }
      }
    });
  }
};
```

---

## The 3-Feature System

### Feature 1: Images API (Upload & Storage)

Store images on Cloudflare's network and serve them globally.

**Upload Methods**:
1. **File Upload** - Upload files directly from your server
2. **Upload via URL** - Ingest images from external URLs
3. **Direct Creator Upload** - Generate one-time upload URLs for user uploads

**Serving Options**:
- Default domain: `imagedelivery.net`
- Custom domains: `/cdn-cgi/imagedelivery/...`
- Signed URLs: Private images with expiry tokens

**See**: `templates/upload-api-basic.ts`, `templates/direct-creator-upload-backend.ts`

### Feature 2: Image Transformations

Optimize and resize ANY image (stored in Images or external).

**Two Methods**:
1. **URL Transformations** - Special URL format
2. **Workers Transformations** - Programmatic control via fetch

**Common Transformations**:
- Resize: `width=800,height=600,fit=cover`
- Optimize: `quality=85,format=auto`
- Effects: `blur=10,sharpen=3`
- Crop: `gravity=face,zoom=0.5`

**See**: `templates/transform-via-url.ts`, `templates/transform-via-workers.ts`

### Feature 3: Variants

Predefined image sizes for different use cases.

**Named Variants** (up to 100):
- Create once, use everywhere
- Example: `thumbnail`, `avatar`, `hero`
- Consistent transformations

**Flexible Variants** (dynamic):
- Enable per account
- Use transformation params in URL
- Example: `w=400,sharpen=3`
- **Cannot use with signed URLs**

**See**: `templates/variants-management.ts`, `references/variants-guide.md`

---

## Images API - Upload Methods

### Method 1: File Upload (Basic)

```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: multipart/form-data" \
  --form 'file=@./image.jpg' \
  --form 'requireSignedURLs=false' \
  --form 'metadata={"key":"value"}'
```

**Key Options**:
- `file`: Image file (required)
- `id`: Custom ID (optional, default auto-generated)
- `requireSignedURLs`: `true` for private images (default: `false`)
- `metadata`: JSON object (max 1024 bytes, not visible to end users)

**Response**:
```json
{
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "filename": "image.jpg",
    "uploaded": "2022-01-31T16:39:28.458Z",
    "requireSignedURLs": false,
    "variants": [
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../public"
    ]
  }
}
```

**See**: `templates/upload-api-basic.ts`

### Method 2: Upload via URL

Ingest images from external sources without downloading first.

```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
  --header "Authorization: Bearer <API_TOKEN>" \
  --form 'url=https://example.com/image.jpg' \
  --form 'metadata={"source":"external"}'
```

**When to use**:
- Migrating images from another service
- Ingesting user-provided URLs
- Backing up images from external sources

**CRITICAL:**
- URL must be publicly accessible or authenticated
- Supports HTTP basic auth: `https://user:password@example.com/image.jpg`
- Cannot use both `file` and `url` in same request

**See**: `templates/upload-via-url.ts`

### Method 3: Direct Creator Upload ⭐

Generate one-time upload URLs for users to upload directly to Cloudflare (no API key exposure).

**Backend Endpoint** (generate upload URL):
```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requireSignedURLs: true,
      metadata: { userId: '12345' },
      expiry: '2025-10-26T18:00:00Z' // Optional: default 30min, max 6hr
    })
  }
);

const { uploadURL, id } = await response.json();
// Return uploadURL to frontend
```

**Frontend Upload** (HTML + JavaScript):
```html
<form id="upload-form">
  <input type="file" id="file-input" accept="image/*" />
  <button type="submit">Upload</button>
</form>

<script>
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('file-input');
  const formData = new FormData();
  formData.append('file', fileInput.files[0]); // MUST be named 'file'

  const uploadURL = 'UPLOAD_URL_FROM_BACKEND'; // Get from backend

  const response = await fetch(uploadURL, {
    method: 'POST',
    body: formData // NO Content-Type header, browser sets multipart/form-data
  });

  if (response.ok) {
    console.log('Upload successful!');
  }
});
</script>
```

**Why this matters:**
- No API key exposure to browser
- Users upload directly to Cloudflare (faster, no intermediary server)
- One-time URL expires after use or timeout
- Webhooks available for upload success/failure notifications

**CRITICAL CORS FIX**:
- ✅ **DO**: Use `multipart/form-data` encoding (let browser set header)
- ✅ **DO**: Name field `file` (NOT `image` or other names)
- ✅ **DO**: Call `/direct_upload` API from backend only
- ❌ **DON'T**: Set `Content-Type: application/json` or `image/jpeg`
- ❌ **DON'T**: Call `/direct_upload` from browser (CORS will fail)

**See**: `templates/direct-creator-upload-backend.ts`, `templates/direct-creator-upload-frontend.html`, `references/direct-upload-complete-workflow.md`

---

## Image Transformations

### URL Transformations

Transform images using a special URL format.

**URL Pattern**:
```
https://<ZONE>/cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
```

**Example**:
```html
<img src="/cdn-cgi/image/width=800,quality=85,format=auto/uploads/photo.jpg" />
```

**Common Options**:
- **Sizing**: `width=800`, `height=600`, `fit=cover`
- **Quality**: `quality=85` (1-100)
- **Format**: `format=auto` (WebP/AVIF auto-detection), `format=webp`, `format=jpeg`
- **Cropping**: `gravity=auto` (smart crop), `gravity=face`, `trim=10`
- **Effects**: `blur=10`, `sharpen=3`, `brightness=1.2`, `contrast=1.1`
- **Rotation**: `rotate=90`, `flip=h` (horizontal), `flip=v` (vertical)

**Fit Options**:
- `scale-down`: Shrink to fit (never enlarge)
- `contain`: Resize to fit within dimensions (preserve aspect ratio)
- `cover`: Resize to fill dimensions (may crop)
- `crop`: Crop to exact dimensions
- `pad`: Resize and add padding (use with `background` option)

**Format Auto-Detection**:
```html
<img src="/cdn-cgi/image/format=auto/image.jpg" />
```

Cloudflare serves:
- AVIF to browsers that support it (Chrome, Edge)
- WebP to browsers without AVIF support (Safari, Firefox)
- Original format (JPEG) as fallback

**See**: `templates/transform-via-url.ts`, `references/transformation-options.md`

### Workers Transformations

Programmatic image transformations with custom URL schemes.

**Basic Pattern**:
```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Custom URL scheme: /images/thumbnail/photo.jpg
    if (url.pathname.startsWith('/images/thumbnail/')) {
      const imagePath = url.pathname.replace('/images/thumbnail/', '');
      const imageURL = `https://storage.example.com/${imagePath}`;

      return fetch(imageURL, {
        cf: {
          image: {
            width: 300,
            height: 300,
            fit: 'cover',
            quality: 85
          }
        }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

**Advanced: Content Negotiation**:
```typescript
const accept = request.headers.get('accept') || '';

let format: 'avif' | 'webp' | 'auto' = 'auto';
if (/image\/avif/.test(accept)) {
  format = 'avif';
} else if (/image\/webp/.test(accept)) {
  format = 'webp';
}

return fetch(imageURL, {
  cf: {
    image: {
      format,
      width: 800,
      quality: 85
    }
  }
});
```

**Why Workers Transformations:**
- **Custom URL schemes**: Hide image storage location
- **Preset names**: Use `thumbnail`, `avatar`, `large` instead of pixel values
- **Content negotiation**: Serve optimal format based on browser
- **Access control**: Check authentication before serving
- **Dynamic sizing**: Calculate dimensions based on device type

**See**: `templates/transform-via-workers.ts`, `references/transformation-options.md`

---

## Variants Management

### Named Variants (Up to 100)

Create predefined transformations for different use cases.

**Create via API**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/variants" \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "id": "avatar",
    "options": {
      "fit": "cover",
      "width": 200,
      "height": 200,
      "metadata": "none"
    },
    "neverRequireSignedURLs": false
  }'
```

**Use in URLs**:
```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/avatar" />
```

**When to use**:
- Consistent image sizes across your app
- Private images (works with signed URLs)
- Simple, predictable URLs

**See**: `templates/variants-management.ts`

### Flexible Variants

Dynamic transformations using params in URL.

**Enable** (per account, one-time):
```bash
curl --request PATCH \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/config \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{"flexible_variants": true}'
```

**Use in URLs**:
```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/w=400,sharpen=3" />
```

**When to use**:
- Dynamic sizing needs
- Public images only (cannot use with signed URLs)
- Rapid prototyping

**CRITICAL:**
- ❌ **Cannot use with `requireSignedURLs=true`**
- ✅ **Use named variants for private images**

**See**: `references/variants-guide.md`

---

## Signed URLs (Private Images)

Generate time-limited URLs for private images using HMAC-SHA256 tokens.

**URL Format**:
```
https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT>?exp=<EXPIRY>&sig=<SIGNATURE>
```

**Generate Signature** (Workers example):
```typescript
async function generateSignedURL(
  imageId: string,
  variant: string,
  expirySeconds: number = 3600
): Promise<string> {
  const accountHash = 'YOUR_ACCOUNT_HASH';
  const signingKey = 'YOUR_SIGNING_KEY'; // Dashboard → Images → Keys

  const expiry = Math.floor(Date.now() / 1000) + expirySeconds;
  const stringToSign = `${imageId}${variant}${expiry}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const sig = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}?exp=${expiry}&sig=${sig}`;
}
```

**Usage**:
```typescript
const signedURL = await generateSignedURL('image-id', 'public', 3600);
// Returns URL valid for 1 hour
```

**When to use**:
- User profile photos (private until shared)
- Paid content (time-limited access)
- Temporary downloads
- Secure image delivery

**See**: `templates/signed-urls-generation.ts`, `references/signed-urls-guide.md`

---

## Responsive Images

Serve optimal image sizes for different screen sizes.

**Using Named Variants**:
```html
<img
  srcset="
    https://imagedelivery.net/<HASH>/<ID>/mobile 480w,
    https://imagedelivery.net/<HASH>/<ID>/tablet 768w,
    https://imagedelivery.net/<HASH>/<ID>/desktop 1920w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="https://imagedelivery.net/<HASH>/<ID>/desktop"
  alt="Responsive image"
/>
```

**Using Flexible Variants**:
```html
<img
  srcset="
    https://imagedelivery.net/<HASH>/<ID>/w=480,f=auto 480w,
    https://imagedelivery.net/<HASH>/<ID>/w=768,f=auto 768w,
    https://imagedelivery.net/<HASH>/<ID>/w=1920,f=auto 1920w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="https://imagedelivery.net/<HASH>/<ID>/w=1920,f=auto"
  alt="Responsive image"
/>
```

**Art Direction** (different crops for mobile vs desktop):
```html
<picture>
  <source
    media="(max-width: 767px)"
    srcset="https://imagedelivery.net/<HASH>/<ID>/mobile-square"
  />
  <source
    media="(min-width: 768px)"
    srcset="https://imagedelivery.net/<HASH>/<ID>/desktop-wide"
  />
  <img src="https://imagedelivery.net/<HASH>/<ID>/desktop-wide" alt="Hero image" />
</picture>
```

**See**: `templates/responsive-images-srcset.html`, `references/responsive-images-patterns.md`

---

## Critical Rules

### Always Do

✅ Use `multipart/form-data` for Direct Creator Upload
✅ Name the file field `file` (not `image` or other names)
✅ Call `/direct_upload` API from backend only (NOT browser)
✅ Use HTTPS URLs for transformations (HTTP not supported)
✅ URL-encode special characters in image paths
✅ Enable transformations on zone before using `/cdn-cgi/image/`
✅ Use named variants for private images (signed URLs)
✅ Check `Cf-Resized` header for transformation errors
✅ Set `format=auto` for automatic WebP/AVIF conversion
✅ Use `fit=scale-down` to prevent unwanted enlargement

### Never Do

❌ Use `application/json` Content-Type for file uploads
❌ Call `/direct_upload` from browser (CORS will fail)
❌ Use flexible variants with `requireSignedURLs=true`
❌ Resize SVG files (they're inherently scalable)
❌ Use HTTP URLs for transformations (HTTPS only)
❌ Put spaces or unescaped Unicode in URLs
❌ Transform the same image multiple times in Workers (causes 9403 loop)
❌ Exceed 100 megapixels image size
❌ Use `/cdn-cgi/image/` endpoint in Workers (use `cf.image` instead)
❌ Forget to enable transformations on zone before use

---

## Known Issues Prevention

This skill prevents **13+** documented issues.

### Issue #1: Direct Creator Upload CORS Error

**Error**: `Access to XMLHttpRequest blocked by CORS policy: Request header field content-type is not allowed`

**Source**: [Cloudflare Community #345739](https://community.cloudflare.com/t/direct-image-upload-cors-error/345739), [#368114](https://community.cloudflare.com/t/cloudflare-images-direct-upload-cors-problem/368114)

**Why It Happens**: Server CORS settings only allow `multipart/form-data` for Content-Type header

**Prevention**:
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
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }, // CORS error
  body: JSON.stringify({ file: base64Image })
});
```

### Issue #2: Error 5408 - Upload Timeout

**Error**: `Error 5408` after ~15 seconds of upload

**Source**: [Cloudflare Community #571336](https://community.cloudflare.com/t/images-direct-creator-upload-error-5408/571336)

**Why It Happens**: Cloudflare has 30-second request timeout; slow uploads or large files exceed limit

**Prevention**:
- Compress images before upload (client-side with Canvas API)
- Use reasonable file size limits (e.g., max 10MB)
- Show upload progress to user
- Handle timeout errors gracefully

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  alert('File too large. Please select an image under 10MB.');
  return;
}
```

### Issue #3: Error 400 - Invalid File Parameter

**Error**: `400 Bad Request` with unhelpful error message

**Source**: [Cloudflare Community #487629](https://community.cloudflare.com/t/direct-creator-upload-returning-400/487629)

**Why It Happens**: File field must be named `file` (not `image`, `photo`, etc.)

**Prevention**:
```javascript
// ✅ CORRECT
formData.append('file', imageFile);

// ❌ WRONG
formData.append('image', imageFile); // 400 error
formData.append('photo', imageFile); // 400 error
```

### Issue #4: CORS Preflight Failures

**Error**: Preflight OPTIONS request blocked

**Source**: [Cloudflare Community #306805](https://community.cloudflare.com/t/cors-error-when-using-direct-creator-upload/306805)

**Why It Happens**: Calling `/direct_upload` API directly from browser (should be backend-only)

**Prevention**:
```
ARCHITECTURE:
Browser → Backend API → POST /direct_upload → Returns uploadURL → Browser uploads to uploadURL
```

Never expose API token to browser. Generate upload URL on backend, return to frontend.

### Issue #5: Error 9401 - Invalid Arguments

**Error**: `Cf-Resized: err=9401` - Required cf.image options missing or invalid

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Missing required transformation parameters or invalid values

**Prevention**:
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
      quality: 150 // Max 100
    }
  }
});
```

### Issue #6: Error 9402 - Image Too Large

**Error**: `Cf-Resized: err=9402` - Image too large or connection interrupted

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Image exceeds maximum area (100 megapixels) or download fails

**Prevention**:
- Validate image dimensions before transforming
- Use reasonable source images (max 10000x10000px)
- Handle network errors gracefully

### Issue #7: Error 9403 - Request Loop

**Error**: `Cf-Resized: err=9403` - Worker fetching its own URL or already-resized image

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Transformation applied to already-transformed image, or Worker fetches itself

**Prevention**:
```typescript
// ✅ CORRECT
if (url.pathname.startsWith('/images/')) {
  const originalPath = url.pathname.replace('/images/', '');
  const originURL = `https://storage.example.com/${originalPath}`;
  return fetch(originURL, { cf: { image: { width: 800 } } });
}

// ❌ WRONG
if (url.pathname.startsWith('/images/')) {
  // Fetches worker's own URL, causes loop
  return fetch(request, { cf: { image: { width: 800 } } });
}
```

### Issue #8: Error 9406/9419 - Invalid URL Format

**Error**: `Cf-Resized: err=9406` or `err=9419` - Non-HTTPS URL or URL has spaces/unescaped Unicode

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Image URL uses HTTP (not HTTPS) or contains invalid characters

**Prevention**:
```typescript
// ✅ CORRECT
const imageURL = "https://example.com/images/photo%20name.jpg";

// ❌ WRONG
const imageURL = "http://example.com/images/photo.jpg"; // HTTP not allowed
const imageURL = "https://example.com/images/photo name.jpg"; // Space not encoded
```

Always use `encodeURIComponent()` for URL paths:
```typescript
const filename = "photo name.jpg";
const imageURL = `https://example.com/images/${encodeURIComponent(filename)}`;
```

### Issue #9: Error 9412 - Non-Image Response

**Error**: `Cf-Resized: err=9412` - Origin returned HTML instead of image

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Origin server returns 404 page or error page (HTML) instead of image

**Prevention**:
```typescript
// Verify URL before transforming
const originResponse = await fetch(imageURL, { method: 'HEAD' });
const contentType = originResponse.headers.get('content-type');

if (!contentType?.startsWith('image/')) {
  return new Response('Not an image', { status: 400 });
}

return fetch(imageURL, { cf: { image: { width: 800 } } });
```

### Issue #10: Error 9413 - Max Image Area Exceeded

**Error**: `Cf-Resized: err=9413` - Image exceeds 100 megapixels

**Source**: [Cloudflare Images Docs - Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)

**Why It Happens**: Source image dimensions exceed 100 megapixels (e.g., 10000x10000px)

**Prevention**:
- Validate image dimensions before upload
- Pre-process oversized images
- Reject images above threshold

```typescript
const MAX_MEGAPIXELS = 100;

if (width * height > MAX_MEGAPIXELS * 1_000_000) {
  return new Response('Image too large', { status: 413 });
}
```

### Issue #11: Flexible Variants + Signed URLs Incompatibility

**Error**: Flexible variants don't work with private images

**Source**: [Cloudflare Images Docs - Enable flexible variants](https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/)

**Why It Happens**: Flexible variants cannot be used with `requireSignedURLs=true`

**Prevention**:
```typescript
// ✅ CORRECT - Use named variants for private images
await uploadImage({
  file: imageFile,
  requireSignedURLs: true // Use named variants: /public, /avatar, etc.
});

// ❌ WRONG - Flexible variants don't support signed URLs
// Cannot use: /w=400,sharpen=3 with requireSignedURLs=true
```

### Issue #12: SVG Resizing Limitation

**Error**: SVG files don't resize via transformations

**Source**: [Cloudflare Images Docs - SVG files](https://developers.cloudflare.com/images/transform-images/#svg-files)

**Why It Happens**: SVG is inherently scalable (vector format), resizing not applicable

**Prevention**:
```typescript
// SVGs can be served but not resized
// Use any variant name as placeholder
// https://imagedelivery.net/<HASH>/<SVG_ID>/public

// SVG will be served at original size regardless of variant settings
```

### Issue #13: EXIF Metadata Stripped by Default

**Error**: GPS data, camera settings removed from uploaded JPEGs

**Source**: [Cloudflare Images Docs - Transform via URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/#metadata)

**Why It Happens**: Default behavior strips all metadata except copyright

**Prevention**:
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

**Options**:
- `none`: Strip all metadata
- `copyright`: Keep only copyright tag (default for JPEG)
- `keep`: Preserve most EXIF metadata including GPS

---

## Using Bundled Resources

### Templates (templates/)

Copy-paste ready code for common patterns:

1. **wrangler-images-binding.jsonc** - Wrangler configuration (no binding needed)
2. **upload-api-basic.ts** - Upload file to Images API
3. **upload-via-url.ts** - Ingest image from external URL
4. **direct-creator-upload-backend.ts** - Generate one-time upload URLs
5. **direct-creator-upload-frontend.html** - User upload form
6. **transform-via-url.ts** - URL transformation examples
7. **transform-via-workers.ts** - Workers transformation patterns
8. **variants-management.ts** - Create/list/delete variants
9. **signed-urls-generation.ts** - HMAC-SHA256 signed URL generation
10. **responsive-images-srcset.html** - Responsive image patterns
11. **batch-upload.ts** - Batch API for high-volume uploads

**Usage**:
```bash
cp templates/upload-api-basic.ts src/upload.ts
# Edit with your account ID and API token
```

### References (references/)

In-depth documentation Claude can load as needed:

1. **api-reference.md** - Complete API endpoints (upload, list, delete, variants)
2. **transformation-options.md** - All transform params with examples
3. **variants-guide.md** - Named vs flexible variants, when to use each
4. **signed-urls-guide.md** - HMAC-SHA256 implementation details
5. **direct-upload-complete-workflow.md** - Full architecture and flow
6. **responsive-images-patterns.md** - srcset, sizes, art direction
7. **format-optimization.md** - WebP/AVIF auto-conversion strategies
8. **top-errors.md** - All 13+ errors with detailed troubleshooting

**When to load**:
- Deep-dive into specific feature
- Troubleshooting complex issues
- Understanding API details
- Implementing advanced patterns

### Scripts (scripts/)

**check-versions.sh** - Verify API endpoints are current

---

## Advanced Topics

### Custom Domains

Serve images from your own domain instead of `imagedelivery.net`.

**URL Format**:
```
https://example.com/cdn-cgi/imagedelivery/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT>
```

**Requirements**:
- Domain must be on Cloudflare (same account as Images)
- Proxied through Cloudflare (orange cloud)

**Custom Paths** (Transform Rules):

Rewrite `/images/...` to `/cdn-cgi/imagedelivery/...`:

1. Dashboard → Rules → Transform Rules → Rewrite URL
2. Match: `starts_with(http.request.uri.path, "/images/")`
3. Rewrite: `/cdn-cgi/imagedelivery/<ACCOUNT_HASH>${substring(http.request.uri.path, 7)}`

Now `/images/{id}/{variant}` → `/cdn-cgi/imagedelivery/{hash}/{id}/{variant}`

**See**: [Serve images from custom domains](https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/)

### Batch API

High-volume uploads with batch tokens.

**Host**: `batch.imagedelivery.net` (instead of `api.cloudflare.com`)

**Usage**:
```bash
# Create batch token in dashboard: Images → Batch API

curl "https://batch.imagedelivery.net/images/v1" \
  --header "Authorization: Bearer <BATCH_TOKEN>" \
  --form 'file=@./image.jpg'
```

**When to use**:
- Migrating thousands of images
- Bulk upload workflows
- Automated image ingestion

**See**: `templates/batch-upload.ts`

### Webhooks

Receive notifications for upload success/failure (Direct Creator Upload only).

**Setup**:
1. Dashboard → Notifications → Destinations → Webhooks → Create
2. Enter webhook URL and test
3. Notifications → All Notifications → Add → Images → Select webhook

**Payload** (example):
```json
{
  "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901",
  "status": "uploaded",
  "metadata": {"userId": "12345"}
}
```

**When to use**:
- Update database after upload
- Trigger image processing pipeline
- Notify user of upload status

**See**: [Configure webhooks](https://developers.cloudflare.com/images/manage-images/configure-webhooks/)

---

## Troubleshooting

### Problem: Images not transforming

**Symptoms**: `/cdn-cgi/image/...` returns original image or 404

**Solutions**:
1. Enable transformations on zone: Dashboard → Images → Transformations → Enable for zone
2. Verify zone is proxied through Cloudflare (orange cloud)
3. Check source image is publicly accessible
4. Wait 5-10 minutes for settings to propagate

### Problem: Direct upload returns CORS error

**Symptoms**: `Access-Control-Allow-Origin` error in browser console

**Solutions**:
1. Use `multipart/form-data` encoding (let browser set Content-Type)
2. Don't call `/direct_upload` from browser; call from backend
3. Name file field `file` (not `image`)
4. Remove manual Content-Type header

### Problem: Worker transformations return 9403 loop error

**Symptoms**: `Cf-Resized: err=9403` in response headers

**Solutions**:
1. Don't fetch Worker's own URL (use external origin)
2. Don't transform already-resized images
3. Check URL routing logic to avoid loops

### Problem: Signed URLs not working

**Symptoms**: 403 Forbidden when accessing signed URL

**Solutions**:
1. Verify image uploaded with `requireSignedURLs=true`
2. Check signature generation (HMAC-SHA256)
3. Ensure expiry timestamp is in future
4. Verify signing key matches dashboard (Images → Keys)
5. Cannot use flexible variants with signed URLs (use named variants)

### Problem: Images uploaded but not appearing

**Symptoms**: Upload returns 200 OK but image not in dashboard

**Solutions**:
1. Check for `draft: true` in response (Direct Creator Upload)
2. Wait for upload to complete (check via GET `/images/v1/{id}`)
3. Verify account ID matches
4. Check for upload errors in webhooks

---

## Complete Setup Checklist

- [ ] Cloudflare account with Images enabled
- [ ] Account ID and API token obtained (Images: Edit permission)
- [ ] (Optional) Image transformations enabled on zone
- [ ] (Optional) Variants created for common use cases
- [ ] (Optional) Flexible variants enabled if dynamic sizing needed
- [ ] (Optional) Signing key obtained for private images
- [ ] (Optional) Webhooks configured for upload notifications
- [ ] (Optional) Custom domain configured with Transform Rules
- [ ] Upload method implemented (file, URL, or direct creator)
- [ ] Serving URLs tested (imagedelivery.net or custom domain)
- [ ] Transformations tested (URL or Workers)
- [ ] Error handling implemented (CORS, timeouts, size limits)

---

## Official Documentation

- **Cloudflare Images**: https://developers.cloudflare.com/images/
- **Get Started**: https://developers.cloudflare.com/images/get-started/
- **Upload Images**: https://developers.cloudflare.com/images/upload-images/
- **Direct Creator Upload**: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
- **Transform Images**: https://developers.cloudflare.com/images/transform-images/
- **Transform via URL**: https://developers.cloudflare.com/images/transform-images/transform-via-url/
- **Transform via Workers**: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
- **Create Variants**: https://developers.cloudflare.com/images/manage-images/create-variants/
- **Serve Private Images**: https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/
- **Troubleshooting**: https://developers.cloudflare.com/images/reference/troubleshooting/
- **API Reference**: https://developers.cloudflare.com/api/resources/images/

---

## Package Versions (Verified 2025-10-26)

**API Version**: v2 (for direct uploads), v1 (for standard uploads)

**No npm packages required** - uses native Cloudflare APIs

**Optional**:
- `@cloudflare/workers-types@latest` - TypeScript types for Workers

---

**Questions? Issues?**

1. Check `references/top-errors.md` for common issues
2. Verify all steps in the setup process
3. Check official docs: https://developers.cloudflare.com/images/
4. Ensure transformations are enabled on zone
5. Verify CORS setup for Direct Creator Upload
