# Overlays and Watermarks for Cloudflare Images

Guide to adding overlays, watermarks, and branding elements to images using Cloudflare Images and related techniques.

---

## Watermarking Strategies

While Cloudflare Images doesn't have a built-in `draw` or `overlay` transformation parameter, you can implement watermarking through several approaches:

### Strategy 1: Pre-Processing (Recommended)

**Add watermarks before uploading to Cloudflare Images**:

```typescript
// Using Canvas API (Browser/Node.js)
async function addWatermark(
  imageFile: File,
  watermarkUrl: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Load main image
  const img = await createImageBitmap(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw main image
  ctx.drawImage(img, 0, 0);

  // Load and draw watermark
  const watermark = new Image();
  watermark.src = watermarkUrl;
  await watermark.decode();

  const wmWidth = canvas.width * 0.2; // 20% of image width
  const wmHeight = (watermark.height / watermark.width) * wmWidth;
  const x = canvas.width - wmWidth - 20; // 20px padding
  const y = canvas.height - wmHeight - 20;

  ctx.globalAlpha = 0.5; // 50% opacity
  ctx.drawImage(watermark, x, y, wmWidth, wmHeight);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

// Usage
const watermarkedImage = await addWatermark(file, '/logo.png');

// Upload to Cloudflare Images
const formData = new FormData();
formData.append('file', watermarkedImage);

await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiToken}` },
  body: formData
});
```

### Strategy 2: Cloudflare Workers Image Manipulation

**Apply watermarks using Workers with HTMLRewriter or external libraries**:

```typescript
// Using Workers with image manipulation
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Check if watermark requested
    if (!url.searchParams.has('watermark')) {
      return fetch(request);
    }

    // Fetch base image from Cloudflare Images
    const imageResponse = await fetch(
      `https://imagedelivery.net/${env.ACCOUNT_HASH}/${url.pathname.split('/')[1]}/public`,
      { cf: { image: { quality: 85, format: 'auto' } } }
    );

    const imageBuffer = await imageResponse.arrayBuffer();

    // TODO: Use image processing library to add watermark
    // (Note: This requires a WebAssembly image processing library)

    return new Response(imageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' }
    });
  }
};
```

**Note**: Full image manipulation in Workers requires WebAssembly libraries (e.g., compiled ImageMagick, Sharp).

### Strategy 3: CSS Overlays (Client-Side)

**Add watermarks using CSS layers**:

```html
<style>
  .watermarked-image {
    position: relative;
    display: inline-block;
  }

  .watermarked-image::after {
    content: '© Your Company';
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
</style>

<div class="watermarked-image">
  <img src="https://images.yourdomain.com/photo-id/public" alt="Product" />
</div>
```

**React Component**:
```tsx
interface WatermarkedImageProps {
  imageId: string;
  variant?: string;
  watermarkText?: string;
  alt: string;
}

export function WatermarkedImage({
  imageId,
  variant = 'public',
  watermarkText = '© Your Company',
  alt
}: WatermarkedImageProps) {
  return (
    <div className="relative inline-block">
      <img
        src={`https://images.yourdomain.com/${imageId}/${variant}`}
        alt={alt}
        className="block"
      />
      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded text-sm font-semibold">
        {watermarkText}
      </div>
    </div>
  );
}
```

---

## Server-Side Watermarking

### Using Sharp (Node.js)

```typescript
import sharp from 'sharp';
import { readFile } from 'fs/promises';

async function addWatermark(
  imagePath: string,
  watermarkPath: string,
  outputPath: string
) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  const watermark = await sharp(watermarkPath)
    .resize({ width: Math.floor(metadata.width! * 0.2) })
    .toBuffer();

  await image
    .composite([
      {
        input: watermark,
        gravity: 'southeast',
        blend: 'over'
      }
    ])
    .toFile(outputPath);
}

// Usage in upload workflow
await addWatermark(
  'uploads/photo.jpg',
  'watermarks/logo.png',
  'processed/photo-watermarked.jpg'
);

// Then upload to Cloudflare Images
const watermarkedImage = await readFile('processed/photo-watermarked.jpg');
// Upload via API...
```

### Using ImageMagick

```bash
#!/bin/bash

# Add watermark to image
convert input.jpg \
  watermark.png \
  -gravity southeast \
  -geometry +20+20 \
  -composite \
  output.jpg

# Upload to Cloudflare Images
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/images/v1 \
  --header "Authorization: Bearer $API_TOKEN" \
  --form "file=@output.jpg"
```

---

## Logo Placement Patterns

### Corner Watermarks

```typescript
// Bottom-right (most common)
{
  position: 'absolute',
  bottom: '10px',
  right: '10px'
}

// Top-right
{
  position: 'absolute',
  top: '10px',
  right: '10px'
}

// Bottom-left
{
  position: 'absolute',
  bottom: '10px',
  left: '10px'
}
```

### Center Watermarks

```typescript
// Centered
{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

// Tiled (repeated pattern)
// Use CSS or canvas to repeat watermark across image
```

---

## Opacity and Blending

### CSS Approach

```css
.watermark {
  position: absolute;
  opacity: 0.3; /* 30% opacity */
  mix-blend-mode: multiply; /* Blend with background */
}

/* Alternative blend modes */
mix-blend-mode: overlay;
mix-blend-mode: soft-light;
mix-blend-mode: lighten;
```

### Canvas Approach

```typescript
ctx.globalAlpha = 0.3; // 30% opacity
ctx.globalCompositeOperation = 'multiply'; // Blend mode
ctx.drawImage(watermark, x, y, width, height);
```

---

## Batch Watermarking

### Process Multiple Images

```typescript
async function batchWatermark(
  imageFiles: File[],
  watermarkUrl: string
): Promise<string[]> {
  const uploadedIds: string[] = [];

  for (const file of imageFiles) {
    // Add watermark
    const watermarked = await addWatermark(file, watermarkUrl);

    // Upload to Cloudflare Images
    const formData = new FormData();
    formData.append('file', watermarked);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}` },
        body: formData
      }
    );

    const result = await response.json();
    uploadedIds.push(result.result.id);
  }

  return uploadedIds;
}
```

---

## Dynamic Watermarks

### User-Specific Watermarks

```typescript
async function addUserWatermark(
  imageFile: File,
  userId: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const img = await createImageBitmap(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  // Dynamic text watermark
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 2;

  const text = `User: ${userId}`;
  const x = canvas.width - ctx.measureText(text).width - 20;
  const y = canvas.height - 20;

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}
```

---

## Protecting Images from Download

While watermarks deter casual copying, determined users can still download images. Additional protection strategies:

### 1. Disable Right-Click (Limited Effectiveness)

```html
<img
  src="https://images.yourdomain.com/photo-id/public"
  oncontextmenu="return false;"
  alt="Protected image"
/>
```

### 2. Use Transparent Overlay

```html
<div style="position: relative;">
  <img src="https://images.yourdomain.com/photo-id/public" alt="Product" />
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: default;"></div>
</div>
```

### 3. Signed URLs with Expiry

```typescript
// Generate temporary URL
const signedUrl = generateSignedUrl(imageId, {
  expiresIn: 3600 // 1 hour
});

// URL becomes invalid after expiry
<img src={signedUrl} alt="Protected image" />
```

See `references/signed-urls-guide.md` for implementation.

---

## Copyright Notices

### Text-Based Watermarks

```typescript
function addCopyrightNotice(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  copyrightText: string
) {
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';

  const x = width / 2;
  const y = height - 20;

  ctx.strokeText(copyrightText, x, y);
  ctx.fillText(copyrightText, x, y);
}

// Usage
addCopyrightNotice(ctx, canvas.width, canvas.height, '© 2025 Your Company. All Rights Reserved.');
```

---

## Performance Considerations

### Pre-Processing vs Runtime

**Pre-Processing** (Recommended):
- ✅ Watermark added once during upload
- ✅ No runtime performance cost
- ✅ Images cached with watermark
- ✅ Better for high-traffic sites

**Runtime** (CSS/Canvas):
- ⚠️ Watermark added on every page load
- ⚠️ Client-side processing (can be removed)
- ⚠️ Not embedded in image file
- ✅ Easier to update watermark design

**Recommendation**: Pre-process watermarks for production use.

---

## Best Practices

### 1. Balance Visibility and Aesthetics

```
✅ Subtle logo in corner (30-50% opacity)
❌ Large centered watermark obscuring content
```

### 2. Consistent Placement

```
✅ Always bottom-right for all product images
❌ Random placement across different images
```

### 3. Appropriate Size

```
✅ Watermark 10-20% of image dimensions
❌ Tiny watermark (ineffective)
❌ Huge watermark (poor UX)
```

### 4. Use Vector Logos

```
✅ SVG or high-res PNG for watermarks
✅ Scale gracefully to any image size
❌ Low-res watermark on high-res images
```

---

## Related References

- **Upload API**: See `references/api-reference.md`
- **Transformations**: See `references/transformation-options.md`
- **Signed URLs**: See `references/signed-urls-guide.md`

---

## External Tools

**Image Processing Libraries**:
- **Sharp** (Node.js): https://sharp.pixelplumbing.com/
- **Jimp** (Node.js, pure JS): https://github.com/jimp-dev/jimp
- **Pillow** (Python): https://python-pillow.org/
- **ImageMagick** (CLI): https://imagemagick.org/

**Browser APIs**:
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **createImageBitmap**: https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
