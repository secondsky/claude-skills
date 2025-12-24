# Signed URLs Guide

Complete guide to generating signed URLs for private images using HMAC-SHA256.

---

## What Are Signed URLs?

Time-limited URLs for serving private images securely.

**Format**:
```
https://imagedelivery.net/<HASH>/<ID>/<VARIANT>?exp=<EXPIRY>&sig=<SIGNATURE>
```

**Use cases**:
- User profile photos (private until shared)
- Paid content (time-limited access)
- Temporary downloads
- Secure image delivery

---

## Requirements

1. **Upload with signed URLs enabled**:
```javascript
await uploadImage(file, {
  requireSignedURLs: true // Image requires signed URL
});
```

2. **Get signing key**:
Dashboard → Images → Keys → Generate key

3. **Use named variants only**:
Flexible variants NOT compatible with signed URLs.

---

## Signature Algorithm (HMAC-SHA256)

### String to Sign

```
{imageId}{variant}{expiry}
```

**Example**:
```
Image ID: abc123
Variant: public
Expiry: 1735228800

String to sign: abc123public1735228800
```

### Generate Signature

**Workers** (recommended):
```typescript
async function generateSignature(
  imageId: string,
  variant: string,
  expiry: number,
  signingKey: string
): Promise<string> {
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

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Node.js**:
```javascript
const crypto = require('crypto');

function generateSignature(imageId, variant, expiry, signingKey) {
  const stringToSign = `${imageId}${variant}${expiry}`;

  return crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');
}
```

### Build Signed URL

```typescript
async function generateSignedURL(
  imageId: string,
  variant: string,
  expirySeconds: number,
  accountHash: string,
  signingKey: string
): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + expirySeconds;
  const sig = await generateSignature(imageId, variant, expiry, signingKey);

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}?exp=${expiry}&sig=${sig}`;
}
```

---

## Expiry Timestamp

**Unix timestamp** (seconds since epoch):
```typescript
const now = Math.floor(Date.now() / 1000);
const oneHour = 60 * 60;
const expiry = now + oneHour; // 1 hour from now
```

**From specific date**:
```typescript
const expiryDate = new Date('2025-10-27T18:00:00Z');
const expiry = Math.floor(expiryDate.getTime() / 1000);
```

**Common presets**:
```typescript
const expiryPresets = {
  fiveMinutes: 5 * 60,
  fifteenMinutes: 15 * 60,
  oneHour: 60 * 60,
  oneDay: 24 * 60 * 60,
  oneWeek: 7 * 24 * 60 * 60
};
```

---

## Complete Example (Workers)

```typescript
interface Env {
  IMAGES_ACCOUNT_HASH: string;
  IMAGES_SIGNING_KEY: string;
}

async function generateSignedURL(
  imageId: string,
  variant: string,
  expirySeconds: number,
  env: Env
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + expirySeconds;
  const stringToSign = `${imageId}${variant}${expiry}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.IMAGES_SIGNING_KEY);
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

  return `https://imagedelivery.net/${env.IMAGES_ACCOUNT_HASH}/${imageId}/${variant}?exp=${expiry}&sig=${sig}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Generate signed URL valid for 1 hour
    const signedURL = await generateSignedURL(
      'image-id',
      'public',
      3600,
      env
    );

    return Response.json({ signedURL });
  }
};
```

---

## Multiple Variants

Generate signed URLs for multiple variants at once:

```typescript
async function generateSignedURLsForVariants(
  imageId: string,
  variants: string[],
  expirySeconds: number,
  env: Env
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  for (const variant of variants) {
    urls[variant] = await generateSignedURL(imageId, variant, expirySeconds, env);
  }

  return urls;
}

// Usage
const urls = await generateSignedURLsForVariants(
  'image-id',
  ['thumbnail', 'medium', 'large'],
  3600,
  env
);

// {
//   thumbnail: 'https://imagedelivery.net/.../thumbnail?exp=...&sig=...',
//   medium: 'https://imagedelivery.net/.../medium?exp=...&sig=...',
//   large: 'https://imagedelivery.net/.../large?exp=...&sig=...'
// }
```

---

## Verification (Cloudflare handles this)

For reference, here's how verification works:

```typescript
async function verifySignature(
  imageId: string,
  variant: string,
  expiry: number,
  providedSig: string,
  signingKey: string
): Promise<boolean> {
  // Check if expired
  const now = Math.floor(Date.now() / 1000);
  if (expiry < now) {
    return false; // Expired
  }

  // Generate expected signature
  const expectedSig = await generateSignature(imageId, variant, expiry, signingKey);

  return expectedSig === providedSig;
}
```

---

## Common Issues

### 1. Signed URL returns 403

**Causes**:
- Image not uploaded with `requireSignedURLs=true`
- Signature incorrect (wrong signing key)
- URL expired
- Using flexible variants (not supported)

**Solutions**:
- Verify image requires signed URLs
- Check signing key matches dashboard
- Ensure expiry in future
- Use named variants only

### 2. Signature doesn't match

**Causes**:
- Wrong signing key
- Incorrect string-to-sign format
- Timestamp precision (must be seconds, not milliseconds)

**Solutions**:
```typescript
// ✅ CORRECT - Seconds
const expiry = Math.floor(Date.now() / 1000);

// ❌ WRONG - Milliseconds
const expiry = Date.now();
```

### 3. Cannot use with flexible variants

**Error**: 403 Forbidden when using flexible variants with signed URLs

**Solution**: Use named variants for private images
```typescript
// ✅ CORRECT
const url = await generateSignedURL('id', 'thumbnail', 3600, env);

// ❌ WRONG
const url = `https://imagedelivery.net/${hash}/${id}/w=300?exp=${exp}&sig=${sig}`;
```

---

## Security Best Practices

1. **Keep signing key secret**: Never expose in client-side code
2. **Generate on backend**: Frontend requests signed URL from backend
3. **Short expiry for sensitive content**: 5-15 minutes for temporary access
4. **Longer expiry for user content**: 1-24 hours for profile photos
5. **Rotate keys periodically**: Dashboard → Images → Keys → Regenerate
6. **Log suspicious activity**: Monitor for signature mismatches

---

## Example Use Cases

### Profile Photos (24-hour expiry)
```typescript
const profileURL = await generateSignedURL('user-123', 'avatar', 24 * 60 * 60, env);
```

### Temporary Download (5 minutes)
```typescript
const downloadURL = await generateSignedURL('doc-456', 'large', 5 * 60, env);
```

### Paid Content (1-week subscription)
```typescript
const contentURL = await generateSignedURL('premium-789', 'medium', 7 * 24 * 60 * 60, env);
```

---

## Official Documentation

- **Serve Private Images**: https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/
