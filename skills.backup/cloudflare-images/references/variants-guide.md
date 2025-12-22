# Variants Guide - Named vs Flexible

Complete guide to Cloudflare Images variants.

---

## What Are Variants?

Variants define how images should be resized and transformed for different use cases.

**Two Types**:
1. **Named Variants** - Predefined transformations (up to 100)
2. **Flexible Variants** - Dynamic transformations (unlimited)

---

## Named Variants

### Overview

Pre-configured transformations that apply consistently across all images.

**Limits**: 100 variants per account
**Use with**: Public and private images (signed URLs compatible)

### Creating Named Variants

**Via API**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/variants" \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "id": "thumbnail",
    "options": {
      "fit": "cover",
      "width": 300,
      "height": 300,
      "metadata": "none"
    },
    "neverRequireSignedURLs": false
  }'
```

**Via Dashboard**:
1. Dashboard → Images → Variants
2. Create variant
3. Set dimensions, fit mode, metadata handling

### Using Named Variants

**URL Format**:
```
https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT_NAME>
```

**Example**:
```html
<img src="https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/abc123/thumbnail" />
```

### Common Named Variants

```javascript
const presets = {
  thumbnail: { width: 300, height: 300, fit: 'cover' },
  avatar: { width: 200, height: 200, fit: 'cover' },
  small: { width: 480, fit: 'scale-down' },
  medium: { width: 768, fit: 'scale-down' },
  large: { width: 1920, fit: 'scale-down' },
  hero: { width: 1920, height: 1080, fit: 'cover' },
  product: { width: 800, height: 800, fit: 'contain' }
};
```

### When to Use Named Variants

✅ **Use when**:
- Consistent sizes needed across app
- Private images (signed URLs required)
- Predictable, simple URLs
- Team collaboration (shared definitions)

❌ **Don't use when**:
- Need dynamic sizing per request
- Rapid prototyping with many sizes
- Approaching 100-variant limit

---

## Flexible Variants

### Overview

Dynamic transformations using params directly in URL.

**Limits**: Unlimited transformations
**Use with**: Public images only (signed URLs NOT compatible)

### Enabling Flexible Variants

**One-time setup per account**:
```bash
curl --request PATCH \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/config \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{"flexible_variants": true}'
```

### Using Flexible Variants

**URL Format**:
```
https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<TRANSFORMATION_PARAMS>
```

**Examples**:
```html
<!-- Basic resize -->
<img src="https://imagedelivery.net/HASH/ID/w=400,h=300" />

<!-- With quality and format -->
<img src="https://imagedelivery.net/HASH/ID/w=800,q=85,f=auto" />

<!-- Sharpen and crop -->
<img src="https://imagedelivery.net/HASH/ID/w=600,h=600,fit=cover,sharpen=3" />

<!-- Blur effect -->
<img src="https://imagedelivery.net/HASH/ID/w=500,blur=20,q=50" />
```

### Available Parameters

Same as transformation options:
- `w`, `h` - Width, height
- `fit` - Fit mode (scale-down, contain, cover, crop, pad)
- `q` - Quality (1-100)
- `f` - Format (auto, avif, webp, jpeg)
- `gravity` - Crop focal point (auto, face, left, right, top, bottom)
- `blur`, `sharpen`, `brightness`, `contrast`, `gamma`
- `rotate`, `flip`
- `dpr` - Device pixel ratio
- `metadata` - EXIF handling (none, copyright, keep)
- `anim` - Preserve animation (true/false)

### When to Use Flexible Variants

✅ **Use when**:
- Dynamic sizing needs
- Public images only
- Rapid prototyping
- User-controlled transformations

❌ **Don't use when**:
- Need signed URLs (private images)
- Want consistent, predictable URLs
- Team needs shared definitions

---

## Comparison Table

| Feature | Named Variants | Flexible Variants |
|---------|---------------|-------------------|
| **Limit** | 100 per account | Unlimited |
| **Signed URLs** | ✅ Compatible | ❌ Not compatible |
| **URL Format** | `/thumbnail` | `/w=400,h=300,fit=cover` |
| **URL Length** | Short, clean | Longer, dynamic |
| **Setup** | Create variants first | Enable once, use anywhere |
| **Use Case** | Consistent sizes | Dynamic sizing |
| **Team Sharing** | Shared definitions | Ad-hoc transformations |
| **Private Images** | ✅ Supported | ❌ Public only |

---

## Combining Both

You can use both types in the same account:

```html
<!-- Named variant for avatar (private image, signed URL) -->
<img src="https://imagedelivery.net/HASH/PRIVATE_ID/avatar?exp=123&sig=abc" />

<!-- Flexible variant for public thumbnail -->
<img src="https://imagedelivery.net/HASH/PUBLIC_ID/w=300,h=300,fit=cover" />
```

---

## Best Practices

### For Named Variants

1. **Create core sizes first**: thumbnail, small, medium, large
2. **Use descriptive names**: `product-square`, `hero-wide`, `avatar-round`
3. **Document variant usage**: Share definitions with team
4. **Set consistent quality**: 85 for photos, 90+ for graphics
5. **Use `metadata: none`**: Unless specific need to preserve EXIF

### For Flexible Variants

1. **Always use `f=auto`**: Optimal format for each browser
2. **Limit dynamic range**: Don't allow arbitrary sizes (performance)
3. **Cache popular sizes**: Create named variants for common sizes
4. **URL-encode params**: Especially if using special characters
5. **Public images only**: Remember signed URL incompatibility

---

## Migration Strategies

### From Flexible to Named

If approaching flexibility limits or need signed URLs:

```javascript
// Analyze usage logs
const popularSizes = analyzeImageRequests();
// { w=300,h=300: 50000, w=800,h=600: 30000, ... }

// Create named variants for top sizes
for (const [params, count] of Object.entries(popularSizes)) {
  if (count > 10000) {
    await createVariant(getNameForParams(params), parseParams(params));
  }
}

// Update URLs from flexible to named
// Before: /w=300,h=300,fit=cover
// After: /thumbnail
```

### From Named to Flexible

If need more than 100 variants:

1. Enable flexible variants
2. Gradually migrate to dynamic params
3. Keep popular sizes as named variants
4. Use flexible for long-tail sizes

---

## Cost Considerations

**Named Variants**:
- Cached at edge (fast delivery)
- Predictable bandwidth
- Good for high traffic

**Flexible Variants**:
- Also cached at edge
- More cache keys (potentially)
- Good for diverse sizing needs

**Both**: First transformation billable, subsequent cached requests free

---

## Official Documentation

- **Create Variants**: https://developers.cloudflare.com/images/manage-images/create-variants/
- **Enable Flexible Variants**: https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/
