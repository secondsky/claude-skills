# Format Optimization

Complete guide to automatic WebP/AVIF conversion and format selection.

---

## format=auto (Recommended)

Automatically serve optimal format based on browser support.

**Priority**:
1. **AVIF** - Best compression (Chrome, Edge)
2. **WebP** - Good compression (Safari, Firefox)
3. **Original format** - Fallback (older browsers)

**Usage**:
```typescript
// URL format
/cdn-cgi/image/width=800,quality=85,format=auto/image.jpg

// Workers format
fetch(imageURL, {
  cf: {
    image: {
      width: 800,
      quality: 85,
      format: 'auto'
    }
  }
});

// Cloudflare Images
https://imagedelivery.net/HASH/ID/w=800,q=85,f=auto
```

---

## Browser Support Detection

Cloudflare automatically checks the `Accept` header.

**Chrome/Edge**:
```
Accept: image/avif,image/webp,image/apng,image/*,*/*
```
→ Serves AVIF

**Safari**:
```
Accept: image/webp,image/apng,image/*,*/*
```
→ Serves WebP

**Older browsers**:
```
Accept: image/jpeg,image/png,image/*,*/*
```
→ Serves original format (JPEG)

---

## Manual Format Selection

### In URL Transformations

```html
<!-- AVIF (best compression) -->
<img src="/cdn-cgi/image/format=avif/image.jpg" />

<!-- WebP (good compression, wide support) -->
<img src="/cdn-cgi/image/format=webp/image.jpg" />

<!-- JPEG (progressive) -->
<img src="/cdn-cgi/image/format=jpeg/image.jpg" />

<!-- Baseline JPEG (older devices) -->
<img src="/cdn-cgi/image/format=baseline-jpeg/image.jpg" />
```

### In Workers

```typescript
// Get optimal format from Accept header
function getOptimalFormat(request: Request): 'avif' | 'webp' | 'auto' {
  const accept = request.headers.get('accept') || '';

  if (/image\/avif/.test(accept)) {
    return 'avif';
  } else if (/image\/webp/.test(accept)) {
    return 'webp';
  }

  return 'auto'; // Cloudflare decides
}

return fetch(imageURL, {
  cf: {
    image: {
      format: getOptimalFormat(request)
    }
  }
});
```

---

## Format Comparison

| Format | Compression | Quality | Support | Use Case |
|--------|-------------|---------|---------|----------|
| **AVIF** | Best (~50% smaller) | Excellent | Modern browsers | First choice (auto) |
| **WebP** | Good (~30% smaller) | Excellent | Wide support | Fallback from AVIF |
| **JPEG** | Standard | Good | Universal | Fallback, photos |
| **PNG** | Lossless | Lossless | Universal | Graphics, transparency |

**File Size Example** (1920x1080 photo):
- Original JPEG: 500 KB
- WebP: ~350 KB (30% smaller)
- AVIF: ~250 KB (50% smaller)

---

## Progressive vs Baseline JPEG

**Progressive JPEG** (default):
- Loads in multiple passes (low→high quality)
- Better for slow connections
- Slightly larger file size

**Baseline JPEG**:
- Loads top-to-bottom
- Better for older devices
- Slightly smaller file size

**Usage**:
```
format=jpeg → Progressive JPEG
format=baseline-jpeg → Baseline JPEG
```

---

## WebP Compression Modes

```typescript
// Fast compression (faster encoding, larger file)
fetch(imageURL, {
  cf: {
    image: {
      format: 'webp',
      compression: 'fast'
    }
  }
});

// Lossless WebP (no quality loss, larger file)
fetch(imageURL, {
  cf: {
    image: {
      format: 'webp',
      compression: 'lossless'
    }
  }
});
```

---

## Responsive Images with format=auto

```html
<picture>
  <!-- Explicit AVIF for modern browsers -->
  <source
    type="image/avif"
    srcset="
      https://imagedelivery.net/HASH/ID/w=480,f=avif 480w,
      https://imagedelivery.net/HASH/ID/w=1920,f=avif 1920w
    "
  />

  <!-- WebP fallback -->
  <source
    type="image/webp"
    srcset="
      https://imagedelivery.net/HASH/ID/w=480,f=webp 480w,
      https://imagedelivery.net/HASH/ID/w=1920,f=webp 1920w
    "
  />

  <!-- JPEG fallback -->
  <img
    srcset="
      https://imagedelivery.net/HASH/ID/w=480,f=jpeg 480w,
      https://imagedelivery.net/HASH/ID/w=1920,f=jpeg 1920w
    "
    src="https://imagedelivery.net/HASH/ID/w=1920,f=jpeg"
    alt="Responsive image with format fallbacks"
  />
</picture>

<!-- OR: Let format=auto handle it -->
<img
  srcset="
    https://imagedelivery.net/HASH/ID/w=480,f=auto 480w,
    https://imagedelivery.net/HASH/ID/w=1920,f=auto 1920w
  "
  src="https://imagedelivery.net/HASH/ID/w=1920,f=auto"
  alt="Auto-format responsive image"
/>
```

---

## Quality Recommendations by Format

```typescript
const qualitySettings = {
  jpeg: 85,        // Standard for photos
  webp: 85,        // Same as JPEG
  avif: 85,        // AVIF efficient at same quality
  png: undefined,  // Lossless (quality N/A)
  graphics: 95     // High quality for logos/text
};

// Photos
/cdn-cgi/image/width=800,quality=85,format=auto/photo.jpg

// Graphics with text
/cdn-cgi/image/width=800,quality=95,format=auto/logo.png

// Thumbnails (lower quality acceptable)
/cdn-cgi/image/width=300,quality=75,format=auto/thumb.jpg
```

---

## Animation Support

**GIF**:
```
format=auto → Still GIF or first frame
anim=true → Preserve animation
```

**Animated WebP**:
```typescript
fetch(animatedGif, {
  cf: {
    image: {
      format: 'webp',
      anim: true // Preserve animation
    }
  }
});
```

---

## Metadata Handling

**Strip metadata** (smaller file size):
```
metadata=none
```

**Keep copyright** (default for JPEG):
```
metadata=copyright
```

**Keep all EXIF** (GPS, camera settings):
```
metadata=keep
```

**Example**:
```
/cdn-cgi/image/width=800,format=auto,metadata=none/photo.jpg
```

---

## Cost Optimization

1. **Use format=auto**: Smallest files = less bandwidth
2. **Reasonable quality**: 80-85 for photos, 90-95 for graphics
3. **Strip metadata**: `metadata=none` for public images
4. **Cache at edge**: First transformation billable, subsequent free
5. **WebP animations**: Convert GIF to animated WebP (smaller)

---

## Testing Format Support

```html
<script>
// Check AVIF support
const avifSupport = document.createElement('canvas')
  .toDataURL('image/avif').indexOf('data:image/avif') === 0;

// Check WebP support
const webpSupport = document.createElement('canvas')
  .toDataURL('image/webp').indexOf('data:image/webp') === 0;

console.log('AVIF:', avifSupport); // true in Chrome/Edge
console.log('WebP:', webpSupport); // true in modern browsers
</script>
```

**But**: Let Cloudflare handle this with `format=auto`!

---

## Common Patterns

### Hero Image
```
width=1920,height=1080,fit=cover,quality=85,format=auto,metadata=none
```

### Thumbnail
```
width=300,height=300,fit=cover,quality=75,format=auto,metadata=none
```

### Avatar
```
width=200,height=200,fit=cover,gravity=face,quality=90,format=auto
```

### Product Photo
```
width=800,height=800,fit=contain,quality=90,sharpen=2,format=auto
```

### Blur Placeholder (LQIP)
```
width=50,quality=10,blur=20,format=webp,metadata=none
```

---

## Best Practices

1. **Always use format=auto**: Let Cloudflare optimize
2. **Quality 80-90**: Balance file size and quality
3. **Strip unnecessary metadata**: Smaller files
4. **Test on real devices**: Verify format delivery
5. **Monitor bandwidth**: Check Cloudflare Analytics
6. **Use WebP for animations**: Smaller than GIF
7. **Progressive JPEG for photos**: Better perceived load time

---

## Official Documentation

- **Transform via URL**: https://developers.cloudflare.com/images/transform-images/transform-via-url/
- **Supported Formats**: https://developers.cloudflare.com/images/transform-images/#supported-formats-and-limitations
