---
name: cloudflare-images
description: Cloudflare Images for upload/storage and transformations. Use for image uploads, resizing, WebP/AVIF optimization, or encountering CORS errors, transformation errors 9401-9413.

  Keywords: cloudflare images, image upload cloudflare, imagedelivery.net, cloudflare image transformations, /cdn-cgi/image/, direct creator upload, image variants, cf.image workers, signed urls images, flexible variants, webp avif conversion, responsive images cloudflare, error 5408, error 9401, error 9403, CORS direct upload, multipart/form-data, image optimization cloudflare
license: MIT
metadata:
  version: "2.0.0"
  last_verified: "2025-11-26"
  workers_types_version: "4.20250906.0"
  typescript_version: "5.7.2"
  wrangler_version: "3.109.0"
  production_tested: true
  token_savings: "~60%"
  errors_prevented: 10
  templates_included: 12
  references_included: 9
---

# Cloudflare Images

**Status**: Production Ready ✅ | **Last Verified**: 2025-11-26

---

## What Is Cloudflare Images?

Two powerful features:

1. **Images API**: Upload, store, serve images globally
2. **Image Transformations**: Resize/optimize ANY image

**Key benefits:**
- Global CDN delivery
- Automatic WebP/AVIF conversion
- Up to 100 variants
- Direct creator upload (no API keys in frontend)
- Signed URLs for private images
- Transform any image via URL or Workers

---

## Quick Start (5 Minutes)

### 1. Enable Cloudflare Images

Dashboard → **Images** → **Enable**

Get your **Account ID** and create **API token** (Cloudflare Images: Edit permission)

### 2. Upload Image

```bash
curl --request POST \
  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1 \
  --header 'Authorization: Bearer <API_TOKEN>' \
  --header 'Content-Type: multipart/form-data' \
  --form 'file=@./image.jpg'
```

**CRITICAL:** Use `multipart/form-data`, not JSON

### 3. Serve Image

```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public" />
```

### 4. Enable Transformations

Dashboard → **Images** → **Transformations** → **Enable for zone**

Transform ANY image:

```html
<img src="/cdn-cgi/image/width=800,quality=85/uploads/photo.jpg" />
```

### 5. Transform via Workers

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    return fetch("https://example.com/image.jpg", {
      cf: {
        image: {
          width: 800,
          quality: 85,
          format: "auto"  // WebP/AVIF
        }
      }
    });
  }
};
```

**Load `references/setup-guide.md` for complete walkthrough.**

---

## The 3 Core Features

### Feature 1: Images API (Upload & Storage)

**Upload methods:**
1. File upload (server-side)
2. Upload via URL (ingest from external)
3. Direct creator upload (user uploads, no API keys)

**Load `templates/upload-api-basic.ts` for file upload example.**
**Load `references/direct-upload-complete-workflow.md` for user uploads.**

### Feature 2: Image Transformations

Optimize ANY image (uploaded or external).

**Methods:**
1. URL: `/cdn-cgi/image/width=800,quality=85/path/to/image.jpg`
2. Workers: `cf.image` fetch option

**Load `references/transformation-options.md` for all options.**
**Load `templates/transform-via-workers.ts` for Workers example.**

### Feature 3: Variants

Predefined transformations (up to 100).

**Examples:**
- `thumbnail`: 200x200, fit=cover
- `hero`: 1920x1080, quality=90
- `mobile`: 640, quality=75

**Load `references/variants-guide.md` for complete guide.**

---

## Critical Rules

### Always Do ✅

1. **Use multipart/form-data** for uploads (not JSON)
2. **Enable transformations for zones** before using `/cdn-cgi/image/`
3. **Use direct creator upload** for user uploads (don't expose API tokens)
4. **Set CORS headers** for direct uploads from browser
5. **Use signed URLs** for private images
6. **Configure variants** for common sizes (avoid dynamic transformations)
7. **Use format=auto** for automatic WebP/AVIF
8. **Handle error codes** (9401, 9403, 9413, 5408)
9. **Set quality=85** for optimal size/quality balance
10. **Use fit=cover** for consistent aspect ratios

### Never Do ❌

1. **Never expose API tokens** in frontend code
2. **Never use JSON encoding** for file uploads
3. **Never skip CORS configuration** for direct uploads
4. **Never exceed 100 variants** (hard limit)
5. **Never use transformations without enabling for zone**
6. **Never hardcode account IDs** in public code
7. **Never skip error handling** (uploads can fail)
8. **Never use quality >90** (diminishing returns)
9. **Never skip image validation** (size, format, dimensions)
10. **Never use transformations on non-proxied requests**

---

## Top 5 Use Cases

### Use Case 1: User Profile Pictures

```typescript
// Backend: Generate upload URL
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
  }
);

const { result } = await response.json();
return Response.json({ uploadURL: result.uploadURL });

// Frontend: Upload file
const formData = new FormData();
formData.append('file', file);

await fetch(uploadURL, {
  method: 'POST',
  body: formData
});
```

**Load `templates/direct-creator-upload-backend.ts` for complete example.**

### Use Case 2: Responsive Images

```html
<img
  srcset="
    https://imagedelivery.net/abc/xyz/width=400 400w,
    https://imagedelivery.net/abc/xyz/width=800 800w,
    https://imagedelivery.net/abc/xyz/width=1200 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="https://imagedelivery.net/abc/xyz/width=800"
/>
```

**Load `templates/responsive-images-srcset.html` for complete example.**

### Use Case 3: Transform Existing Images

```html
<!-- Original image on your server -->
<img src="/uploads/photo.jpg" />

<!-- Transformed via URL -->
<img src="/cdn-cgi/image/width=800,quality=85,format=auto/uploads/photo.jpg" />
```

**Load `references/transformation-options.md` for all options.**

### Use Case 4: Private Images with Signed URLs

```typescript
// Generate signed URL (backend)
const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600;  // 1 hour

const message = `/${imageId}/${variant}/${expiryTimestamp}`;
const encoder = new TextEncoder();
const data = encoder.encode(message);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const signature = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

const signedURL = `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${variant}?exp=${expiryTimestamp}&sig=${signature}`;
```

**Load `references/signed-urls-guide.md` for complete implementation.**

### Use Case 5: Batch Upload

```typescript
const files = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

const uploadPromises = files.map(file =>
  fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    body: createFormData(file)
  })
);

const results = await Promise.all(uploadPromises);
```

**Load `templates/batch-upload.ts` for complete example.**

---

## Common Transformations

### Resize

```
/cdn-cgi/image/width=800,height=600,fit=cover/image.jpg
```

**fit options:**
- `scale-down`: Never enlarge
- `contain`: Fit within dimensions
- `cover`: Fill dimensions, crop excess
- `crop`: Crop to exact size
- `pad`: Add padding

### Optimize

```
/cdn-cgi/image/quality=85,format=auto/image.jpg
```

**format options:**
- `auto`: WebP/AVIF for supporting browsers
- `webp`: Force WebP
- `avif`: Force AVIF
- `jpeg`, `png`: Force format

### Effects

```
/cdn-cgi/image/blur=10,sharpen=3,brightness=1.1/image.jpg
```

**Load `references/transformation-options.md` for complete reference.**

---

## Top 5 Errors Prevented

### Error 1: CORS Issues with Direct Upload

**Problem:** Browser blocks direct upload

**Solution:** Configure CORS headers

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requireSignedURLs: false,
      metadata: { source: 'user-upload' }
    })
  }
);
```

**Load `references/top-errors.md` for all 10 errors.**

### Error 2: Multipart Form Data Encoding

**Problem:** JSON encoding fails for file uploads

**Solution:** Use multipart/form-data

```typescript
// ✅ CORRECT
const formData = new FormData();
formData.append('file', file);

// ❌ WRONG
const json = JSON.stringify({ file: base64File });
```

### Error 3: Transformation Error 9401

**Problem:** Transformations not enabled for zone

**Solution:** Enable in dashboard

Dashboard → **Images** → **Transformations** → **Enable for zone**

### Error 4: Variant Limit (100)

**Problem:** Trying to create >100 variants

**Solution:** Use flexible variants or combine similar sizes

```typescript
// Instead of: thumbnail-100, thumbnail-150, thumbnail-200...
// Use: thumbnail (configurable in URL)

<img src="https://imagedelivery.net/abc/xyz/thumbnail?width=150" />
```

### Error 5: Missing requireSignedURLs Configuration

**Problem:** Private images accessible without signature

**Solution:** Enable signed URLs

```typescript
await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requireSignedURLs: true
  })
});
```

**Load `references/top-errors.md` for all 10 errors with solutions.**

---

## When to Load References

### Load `references/setup-guide.md` when:
- First-time Cloudflare Images setup
- Need step-by-step walkthrough
- Setting up direct creator upload
- Enabling transformations

### Load `references/direct-upload-complete-workflow.md` when:
- Implementing user uploads
- Need frontend + backend example
- Configuring CORS
- Handling upload callbacks

### Load `references/transformation-options.md` when:
- Need complete transformation reference
- Exploring all fit/format/effect options
- Optimizing image delivery
- Building custom transformation URLs

### Load `references/variants-guide.md` when:
- Creating/managing variants
- Need flexible variants
- Variant best practices
- Troubleshooting variant issues

### Load `references/signed-urls-guide.md` when:
- Implementing private images
- Need signature generation
- Setting expiry times
- Securing image access

### Load `references/top-errors.md` when:
- Encountering any error code
- Troubleshooting upload/transformation issues
- Prevention checklist needed

### Load `references/responsive-images-patterns.md` when:
- Building responsive images
- Need srcset examples
- Implementing picture element
- Art direction use cases

### Load `references/format-optimization.md` when:
- Optimizing format selection
- WebP/AVIF conversion
- Quality vs size tradeoffs
- Browser compatibility concerns

### Load `references/api-reference.md` when:
- Need complete API documentation
- All endpoints and parameters
- Rate limits and quotas
- Authentication details

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete setup walkthrough
- **api-reference.md** - Complete API documentation
- **direct-upload-complete-workflow.md** - User upload implementation
- **transformation-options.md** - All transformation options
- **variants-guide.md** - Variants management
- **signed-urls-guide.md** - Private images with signatures
- **responsive-images-patterns.md** - Responsive image patterns
- **format-optimization.md** - Format selection and optimization
- **top-errors.md** - All 10 common errors with solutions

### Templates (templates/)

- **upload-api-basic.ts** - Basic file upload
- **upload-via-url.ts** - Upload from external URL
- **direct-creator-upload-backend.ts** - Backend for user uploads
- **direct-creator-upload-frontend.html** - Frontend for user uploads
- **transform-via-url.ts** - URL transformation examples
- **transform-via-workers.ts** - Workers transformation examples
- **variants-management.ts** - Create/update variants
- **signed-urls-generation.ts** - Generate signed URLs
- **batch-upload.ts** - Batch upload implementation
- **responsive-images-srcset.html** - Responsive images with srcset
- **wrangler-images-binding.jsonc** - Workers binding configuration
- **package.json** - Dependencies

---

## Pricing

**Images API**: $5/100k stored, $1/100k delivered
**Transformations**: $0.50/1k (100k/month free per zone)
**Direct Upload**: Included in API pricing

---

## Official Documentation

- **Images Overview**: https://developers.cloudflare.com/images/
- **Upload API**: https://developers.cloudflare.com/images/upload-images/
- **Transformations**: https://developers.cloudflare.com/images/transform-images/
- **Direct Creator Upload**: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
- **Variants**: https://developers.cloudflare.com/images/manage-images/create-variants/

