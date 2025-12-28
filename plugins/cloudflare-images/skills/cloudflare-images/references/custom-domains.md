# Custom Domains for Cloudflare Images

Complete guide to serving Cloudflare Images from your own custom domain instead of the default `imagedelivery.net`.

---

## Why Use Custom Domains?

**Default URL**:
```
https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public
```

**Custom Domain URL**:
```
https://images.yourdomain.com/<IMAGE_ID>/public
```

**Benefits**:
- **Branding**: Use your own domain for professional appearance
- **SEO**: Keep image URLs on your domain
- **Control**: Manage DNS and caching policies
- **Privacy**: Hide Cloudflare account hash
- **CDN**: Leverage Cloudflare's global network with your domain

---

## Prerequisites

1. **Active Cloudflare Account** with Images enabled
2. **Domain on Cloudflare** (DNS managed by Cloudflare)
3. **SSL/TLS Certificate** (automatic with Cloudflare)
4. **Images Subscription** (custom domains available on paid plans)

---

## Setup Guide

### Step 1: Add Subdomain to Cloudflare

1. **Navigate to DNS**:
   - Dashboard → Your Domain → DNS → Records

2. **Add CNAME Record**:
   - Type: `CNAME`
   - Name: `images` (or your preferred subdomain)
   - Target: `imagedelivery.net`
   - Proxy status: **Proxied** (orange cloud)

Example:
```
images.yourdomain.com → CNAME → imagedelivery.net (Proxied)
```

### Step 2: Configure Custom Domain in Images

1. **Navigate to Images Settings**:
   - Dashboard → Images → Custom Domains

2. **Add Custom Domain**:
   - Enter: `images.yourdomain.com`
   - Click "Add Domain"

3. **Verify Setup**:
   - Cloudflare validates DNS configuration
   - SSL certificate provisioned automatically
   - Status changes to "Active"

### Step 3: Update Image URLs

**Before** (default):
```html
<img src="https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../public" />
```

**After** (custom domain):
```html
<img src="https://images.yourdomain.com/2cdc28f0.../public" />
```

**Note**: Account hash is removed from URL when using custom domains.

---

## Configuration Options

### SSL/TLS Settings

**Automatic SSL** (Recommended):
- Cloudflare provisions Universal SSL automatically
- HTTPS enabled by default
- Certificate auto-renews

**Custom SSL** (Advanced):
- Upload custom certificate in SSL/TLS settings
- For specific compliance requirements

### Caching Configuration

**Browser Cache TTL**:

Dashboard → Images → Settings → Browser TTL

```
Default: 4 hours
Range: 30 minutes to 1 year
```

**Edge Cache TTL**:

Automatically optimized by Cloudflare (not configurable)

---

## Implementation Examples

### Static HTML

```html
<!-- Responsive images with custom domain -->
<img
  srcset="
    https://images.yourdomain.com/photo-id/width=400 400w,
    https://images.yourdomain.com/photo-id/width=800 800w,
    https://images.yourdomain.com/photo-id/width=1200 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="https://images.yourdomain.com/photo-id/width=800"
  alt="Product photo"
/>
```

### React/Next.js

```tsx
// components/CloudflareImage.tsx
interface CloudflareImageProps {
  imageId: string;
  variant?: string;
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  alt: string;
}

export function CloudflareImage({
  imageId,
  variant = 'public',
  width,
  quality = 85,
  format = 'auto',
  alt
}: CloudflareImageProps) {
  const CUSTOM_DOMAIN = 'https://images.yourdomain.com';

  // Build transformation parameters
  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  if (quality) params.set('quality', quality.toString());
  if (format) params.set('format', format);

  const transformations = params.toString() ? `?${params}` : '';
  const imageUrl = `${CUSTOM_DOMAIN}/${imageId}/${variant}${transformations}`;

  return <img src={imageUrl} alt={alt} loading="lazy" />;
}

// Usage
<CloudflareImage
  imageId="2cdc28f0-017a-49c4-9ed7-87056c83901"
  variant="thumbnail"
  width={400}
  quality={90}
  format="auto"
  alt="Product thumbnail"
/>
```

### Vue/Nuxt

```vue
<!-- components/CloudflareImage.vue -->
<template>
  <img :src="imageUrl" :alt="alt" loading="lazy" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  imageId: string;
  variant?: string;
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
  alt: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'public',
  quality: 85,
  format: 'auto'
});

const CUSTOM_DOMAIN = 'https://images.yourdomain.com';

const imageUrl = computed(() => {
  const params = new URLSearchParams();
  if (props.width) params.set('width', props.width.toString());
  params.set('quality', props.quality.toString());
  params.set('format', props.format);

  const transformations = `?${params}`;
  return `${CUSTOM_DOMAIN}/${props.imageId}/${props.variant}${transformations}`;
});
</script>

<!-- Usage -->
<CloudflareImage
  image-id="2cdc28f0-017a-49c4-9ed7-87056c83901"
  variant="hero"
  :width="1920"
  :quality="90"
  alt="Hero image"
/>
```

---

## Advanced Configurations

### Multiple Custom Domains

You can configure multiple subdomains for different purposes:

```
images.yourdomain.com      → Product images
assets.yourdomain.com      → Static assets
media.yourdomain.com       → User uploads
thumbnails.yourdomain.com  → Thumbnail variants
```

**Setup**:
1. Add CNAME for each subdomain
2. Configure each in Images dashboard
3. Use appropriate domain per use case

### CDN Integration

Custom domains automatically benefit from Cloudflare's global CDN:

- **200+ Data Centers** worldwide
- **Automatic caching** at edge locations
- **DDoS protection** included
- **Analytics** available in dashboard

### Cache Purging

**Purge specific image**:

```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "files": [
      "https://images.yourdomain.com/image-id/public"
    ]
  }'
```

**Purge all images**:

```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{"purge_everything": true}'
```

---

## DNS Propagation

After adding CNAME record:

- **Propagation time**: Usually 1-5 minutes
- **Global propagation**: Up to 24 hours (rare)
- **Verify**: `dig images.yourdomain.com` or `nslookup images.yourdomain.com`

**Check DNS**:
```bash
# Should show CNAME to imagedelivery.net
dig images.yourdomain.com CNAME

# Expected output:
# images.yourdomain.com. 300 IN CNAME imagedelivery.net.
```

---

## Migrating from imagedelivery.net

### Strategy 1: Gradual Migration

```typescript
// Environment variable controls domain
const IMAGE_DOMAIN = process.env.USE_CUSTOM_DOMAIN
  ? 'https://images.yourdomain.com'
  : 'https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q';

function getImageUrl(imageId: string, variant: string) {
  if (process.env.USE_CUSTOM_DOMAIN) {
    return `${IMAGE_DOMAIN}/${imageId}/${variant}`;
  } else {
    return `${IMAGE_DOMAIN}/${imageId}/${variant}`;
  }
}
```

### Strategy 2: URL Rewriting

Use Cloudflare Workers to rewrite old URLs:

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Rewrite old imagedelivery.net URLs
    if (url.hostname === 'imagedelivery.net') {
      url.hostname = 'images.yourdomain.com';
      // Remove account hash from path
      url.pathname = url.pathname.replace('/Vi7wi5KSItxGFsWRG2Us6Q', '');

      return Response.redirect(url.toString(), 301);
    }

    return fetch(request);
  }
};
```

---

## Troubleshooting

### Domain Not Working

**Check**:
1. DNS CNAME record exists: `dig images.yourdomain.com`
2. Proxy status is "Proxied" (orange cloud)
3. Domain is on Cloudflare (not external DNS)
4. SSL certificate is active (check SSL/TLS tab)
5. Custom domain is "Active" in Images settings

### Images Not Loading

**Common Causes**:
- DNS not propagated yet (wait 5-10 minutes)
- SSL certificate provisioning (automatic, takes ~5 minutes)
- Incorrect image ID in URL
- Firewall rules blocking requests

**Test**:
```bash
# Check if domain resolves
curl -I https://images.yourdomain.com/test-image/public

# Should return 200 OK or 404 (not DNS error)
```

### Mixed Content Warning

**Cause**: Loading images over HTTP on HTTPS page

**Solution**: Always use HTTPS for custom domain URLs:
```html
<!-- ✅ CORRECT -->
<img src="https://images.yourdomain.com/id/public" />

<!-- ❌ WRONG -->
<img src="http://images.yourdomain.com/id/public" />
```

---

## Best Practices

### 1. Use Descriptive Subdomains

```
✅ images.yourdomain.com     (Clear purpose)
✅ cdn.yourdomain.com         (Standard convention)
✅ assets.yourdomain.com      (Common pattern)

❌ img.yourdomain.com         (Too abbreviated)
❌ i.yourdomain.com           (Not descriptive)
```

### 2. Configure HTTPS Only

```
# Cloudflare Page Rule (optional)
Always Use HTTPS: ON
```

### 3. Set Appropriate Cache TTL

```
Short TTL (1 hour):    Frequently updated images
Medium TTL (1 day):    Product images, avatars
Long TTL (1 week+):    Static assets, logos
```

### 4. Monitor Performance

Dashboard → Analytics → Images:
- Requests per second
- Bandwidth usage
- Cache hit ratio
- Geographic distribution

---

## Security Considerations

### SSL/TLS

- **Always use HTTPS** (HTTP redirects automatically)
- **TLS 1.2+ required** (older versions disabled)
- **Certificate auto-renews** (no manual intervention)

### Access Control

**Private images with signed URLs still work**:

```typescript
// Generate signed URL with custom domain
const signedUrl = `https://images.yourdomain.com/${imageId}/${variant}?exp=${expiry}&sig=${signature}`;
```

**Note**: Signature generation is identical, only domain changes.

---

## Cost Implications

**Custom domains are included** in Cloudflare Images pricing:

- No additional cost for custom domain setup
- Same pricing for bandwidth and storage
- Unlimited custom domains on paid plans

**Bandwidth Pricing**:
- Same rates whether using `imagedelivery.net` or custom domain
- $1 per 100,000 delivered images

---

## Related References

- **Signed URLs**: See `references/signed-urls-guide.md`
- **Variants**: See `references/variants-guide.md`
- **Transformations**: See `references/transformation-options.md`

---

## Official Documentation

- **Custom Domains**: https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/
- **DNS Configuration**: https://developers.cloudflare.com/dns/
- **SSL/TLS Settings**: https://developers.cloudflare.com/ssl/
