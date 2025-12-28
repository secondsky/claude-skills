# Polish Compression for Cloudflare Images

Complete guide to Cloudflare's Polish feature for automatic image compression and optimization.

---

## What is Polish?

Polish is Cloudflare's automatic image compression feature that optimizes images served through Cloudflare's network **without modifying the original files**. It works in real-time as images are requested.

**Key Benefits**:
- Reduce file sizes by 35-65%
- Faster page load times
- Lower bandwidth costs
- No original file modification
- Automatic format conversion (WebP, AVIF)

---

## Polish Modes

### 1. Lossless Mode

**What it does**:
- Removes unnecessary metadata (EXIF, comments)
- Optimizes compression algorithms
- **No visual quality loss**
- Typical savings: 10-35%

**Best for**:
- Professional photography
- Medical/scientific images
- Legal documents
- Archival images
- When quality is critical

**Enable**:
Dashboard → Speed → Optimization → Polish → **Lossless**

**Example Savings**:
```
Original JPEG:  2.4 MB → Lossless: 1.8 MB (25% smaller)
Original PNG:   1.2 MB → Lossless: 0.9 MB (25% smaller)
```

### 2. Lossy Mode

**What it does**:
- Aggressive compression
- Slight quality reduction (often imperceptible)
- Typical savings: 35-65%

**Best for**:
- Web images
- Thumbnails
- Product photos
- User avatars
- Marketing materials
- Most web content

**Enable**:
Dashboard → Speed → Optimization → Polish → **Lossy**

**Example Savings**:
```
Original JPEG:  2.4 MB → Lossy: 0.9 MB (62% smaller)
Original PNG:   1.2 MB → Lossy: 0.5 MB (58% smaller)
```

### 3. WebP Conversion

**What it does**:
- Converts JPEG/PNG to WebP format
- 25-35% smaller than equivalent JPEG
- Supported by 95%+ of browsers
- Falls back to original for unsupported browsers

**Enable**:
Dashboard → Speed → Optimization → Polish → **Lossy** + **WebP**

**Example Savings**:
```
Original JPEG: 2.4 MB → WebP: 0.7 MB (70% smaller)
Original PNG:  1.2 MB → WebP: 0.4 MB (67% smaller)
```

**Browser Support**:
- Chrome, Edge, Firefox, Safari (all modern versions)
- Automatic fallback for older browsers

---

## Configuration

### Dashboard Configuration

1. **Navigate to Speed Settings**:
   Dashboard → Your Domain → Speed → Optimization

2. **Select Polish Mode**:
   - **Off**: No compression
   - **Lossless**: Metadata removal only
   - **Lossy**: Aggressive compression

3. **Enable WebP** (Optional):
   - Checkbox: "WebP"
   - Automatically converts to WebP for supported browsers

4. **Save Changes**:
   Takes effect immediately

### API Configuration

```bash
curl --request PATCH \
  https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/polish \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "value": "lossy"
  }'
```

**Values**:
- `"off"` - Polish disabled
- `"lossless"` - Lossless mode
- `"lossy"` - Lossy mode

---

## Polish vs Cloudflare Images Transformations

### Polish (Network-Level)

**Applies to**:
- All images served through Cloudflare (proxied)
- Images on your origin server
- Any image passing through Cloudflare's network

**Configuration**: Zone-wide (applies to entire domain)

**Use when**:
- You want automatic optimization for all images
- You don't want to change image URLs
- You have legacy images on your origin

### Cloudflare Images Transformations (Service-Level)

**Applies to**:
- Images uploaded to Cloudflare Images
- Served via imagedelivery.net or custom domain

**Configuration**: Per-request via URL parameters

**Use when**:
- You need specific transformations (resize, crop)
- You want precise control over format/quality
- You're using Cloudflare Images storage

### Combined Approach (Best Practice)

```
1. Use Cloudflare Images for new uploads
   → Precise transformations via URL parameters

2. Enable Polish for existing origin images
   → Automatic optimization without URL changes

3. Use format=auto in Cloudflare Images
   → Automatic WebP/AVIF conversion
```

---

## Format Comparison

### WebP

**Advantages**:
- 25-35% smaller than JPEG
- Supports transparency (like PNG)
- Supports animation (like GIF)
- Widely supported (95%+ browsers)

**File Size Comparison** (1920x1080 image):
```
JPEG (quality 85):  180 KB
WebP (quality 85):  120 KB (33% smaller)
WebP (quality 75):   85 KB (53% smaller)
```

### AVIF

**Advantages**:
- 30-50% smaller than WebP
- Better quality at lower file sizes
- Supports HDR
- Modern format

**Browser Support**:
- Chrome 85+, Firefox 93+, Safari 16+
- ~85% global support (2025)

**File Size Comparison** (1920x1080 image):
```
JPEG (quality 85):  180 KB
WebP (quality 85):  120 KB
AVIF (quality 85):   75 KB (58% smaller than JPEG)
```

### Format Selection Strategy

```typescript
// Cloudflare Images automatically selects best format
const imageUrl = `https://images.yourdomain.com/${imageId}/public?format=auto`;

// Browser receives:
// - AVIF if browser supports it
// - WebP if browser supports it
// - JPEG/PNG fallback
```

---

## Quality vs Size Tradeoffs

### Quality Settings

**Quality 100** (Original):
- File size: Largest
- Quality: Maximum
- Use: Archival, professional photography

**Quality 90** (High):
- File size: Large
- Quality: Excellent
- Use: Hero images, product photos

**Quality 85** (Recommended):
- File size: Medium
- Quality: Very good (imperceptible difference from 90)
- Use: Most web images

**Quality 75** (Medium):
- File size: Small
- Quality: Good
- Use: Thumbnails, previews

**Quality 60** (Low):
- File size: Very small
- Quality: Acceptable
- Use: Tiny thumbnails, previews

### Size Comparison Chart

**1920x1080 JPEG**:
```
Quality 100:  450 KB  (baseline)
Quality 90:   180 KB  (60% smaller)
Quality 85:   140 KB  (69% smaller) ← Recommended
Quality 75:    95 KB  (79% smaller)
Quality 60:    60 KB  (87% smaller)
```

### Visual Quality Assessment

**Quality 85 vs 90**: Virtually indistinguishable to human eye
**Quality 75 vs 85**: Slight difference in fine details
**Quality 60 vs 75**: Noticeable compression artifacts

**Recommendation**: Use quality 85 for most web images. Human eye cannot perceive difference from quality 90, but file size is 22% smaller.

---

## Performance Impact

### Page Load Time Reduction

**Example Website** (10 images, 4G connection):

**Without Polish**:
```
Total image size: 8.5 MB
Load time: 12.3 seconds
```

**With Lossy Polish + WebP**:
```
Total image size: 3.2 MB (62% reduction)
Load time: 4.6 seconds (63% faster)
```

### Bandwidth Savings

**Monthly savings** (1M pageviews, 10 images/page, avg 250 KB/image):

**Without Polish**:
```
Bandwidth: 2.5 TB/month
Cost: ~$50-75/month
```

**With Polish**:
```
Bandwidth: 0.95 TB/month (62% reduction)
Cost: ~$19-28/month
Savings: ~$31-47/month
```

---

## Metadata Handling

### EXIF Data Removal

Polish removes EXIF metadata by default:

**Removed**:
- Camera make/model
- GPS location
- Timestamp
- Camera settings
- Copyright info

**Benefits**:
- Privacy protection (GPS data)
- Smaller file sizes (5-15% reduction)

**Preserve Metadata**:

If you need to keep EXIF data:

```html
<!-- Don't use Polish, use origin image -->
<img src="https://origin.yourdomain.com/photo.jpg" />

<!-- OR use Cloudflare Images with metadata=keep -->
<img src="/cdn-cgi/image/metadata=keep/photo.jpg" />
```

---

## Cache and Polish

### How Polish Works with Cache

1. **First Request**:
   - Image fetched from origin
   - Polish applied
   - Compressed image cached at edge

2. **Subsequent Requests**:
   - Compressed image served from cache
   - No re-compression needed

### Cache Purging

**Purge specific image**:
```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache \
  --header "Authorization: Bearer <API_TOKEN>" \
  --data '{"files": ["https://yourdomain.com/photo.jpg"]}'
```

**After purge**: Next request will re-apply Polish

---

## Troubleshooting

### Polish Not Working

**Check**:
1. Domain is proxied (orange cloud) in DNS
2. Polish is enabled in Speed settings
3. Image is cacheable (proper Cache-Control headers)
4. Image format is supported (JPEG, PNG, GIF, WebP)
5. Image size is under 100 MB

**Test**:
```bash
# Check response headers
curl -I https://yourdomain.com/image.jpg

# Look for:
CF-BGJ: imgq:85
CF-Polished: qual=85, status=success
```

### WebP Not Served

**Common Causes**:
- Browser doesn't support WebP (check User-Agent)
- WebP checkbox not enabled in Polish settings
- Image already in WebP format

**Test**:
```bash
# Request with WebP support
curl -I https://yourdomain.com/image.jpg \
  -H "Accept: image/webp"

# Should return WebP image
Content-Type: image/webp
```

### Quality Issues

**If images look degraded**:
- Switch from Lossy to Lossless mode
- Increase quality parameter in Cloudflare Images
- Provide higher-quality origin images

---

## Best Practices

### 1. Use Lossy for Web Content

```
For 95% of web images, lossy mode is ideal
Visual quality remains excellent
File sizes reduced 35-65%
```

### 2. Enable WebP Conversion

```
Always enable WebP checkbox
25-35% additional savings
Wide browser support
Automatic fallback
```

### 3. Optimize Origin Images

```
Don't upload 10 MB photos
Pre-resize to reasonable dimensions
Use JPEG for photos, PNG for graphics
Let Polish handle final optimization
```

### 4. Test Visual Quality

```
Before:
View original image

After:
Enable Polish, clear cache, reload
Compare visual quality
Adjust settings if needed
```

---

## Combining Polish with Cloudflare Images

### Hybrid Strategy

**For new content**:
```typescript
// Use Cloudflare Images with format=auto
<img src="https://images.yourdomain.com/id/public?format=auto&quality=85" />
```

**For existing content**:
```typescript
// Use Polish for origin images
<img src="https://yourdomain.com/old-images/photo.jpg" />
// Automatically optimized by Polish
```

---

## Cost Optimization

Polish is **included free** with Cloudflare plans:

**Free Plan**: Lossless only
**Pro Plan**: Lossless + Lossy
**Business Plan**: Lossless + Lossy + WebP
**Enterprise Plan**: All features + AVIF

**No additional cost** for:
- Bandwidth savings
- Format conversion
- Compression

---

## Related References

- **Transformations**: See `references/transformation-options.md`
- **Format Optimization**: See `references/format-optimization.md`
- **Custom Domains**: See `references/custom-domains.md`

---

## Official Documentation

- **Polish**: https://developers.cloudflare.com/speed/optimization/images/polish/
- **Compression**: https://developers.cloudflare.com/speed/optimization/content/
