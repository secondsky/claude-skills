# Private Images Example

Complete implementation of signed URLs for private image access control using Cloudflare Images.

## Features

- ✅ HMAC-SHA256 signed URL generation
- ✅ Time-based expiry (customizable)
- ✅ Access control patterns
- ✅ Secure image delivery
- ✅ Frontend authentication flow
- ✅ Token validation
- ✅ Automatic expiry handling

## Live Demo Structure

```
private-images/
├── README.md              # This file
├── package.json           # Dependencies
├── wrangler.jsonc         # Worker configuration
├── .env.example           # Environment variables template
├── src/
│   └── index.ts           # Worker with signed URL generation
└── public/
    └── index.html         # Gallery UI with authentication
```

## What are Signed URLs?

Signed URLs are cryptographically signed URLs that grant temporary access to private images. They prevent unauthorized access by requiring a valid signature that expires after a set time.

**Use Cases**:
- Private user content (profile photos, documents)
- Paid content (premium images, stock photos)
- Temporary sharing (time-limited access links)
- HIPAA/GDPR compliance (controlled access to sensitive images)

## Architecture

```
┌─────────────────┐
│   Browser       │
│   (Gallery)     │
└────────┬────────┘
         │ 1. Request signed URL
         ▼
┌─────────────────┐
│  Worker API     │
│  /api/sign-url  │
└────────┬────────┘
         │ 2. Generate signature
         │    HMAC-SHA256(imageId + expiry)
         ▼
┌─────────────────┐
│  Browser        │
│  Displays image │
└────────┬────────┘
         │ 3. Request image with signature
         ▼
┌─────────────────┐
│ Cloudflare CDN  │
│ Validates sig   │
└─────────────────┘
```

## Implementation

### 1. Upload Private Image

Images uploaded with `requireSignedURLs: true` can only be accessed with signed URLs:

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: formData.append('requireSignedURLs', 'true') // ← KEY
  }
);
```

### 2. Generate Signed URL (Server-Side)

```typescript
import { sign } from '@tsndr/cloudflare-worker-jwt';

// Generate expiry timestamp (1 hour from now)
const expiry = Math.floor(Date.now() / 1000) + 3600;

// Create signature using HMAC-SHA256
const signature = await sign(
  { imageId, expiry },
  CF_IMAGES_SIGNING_KEY
);

// Construct signed URL
const signedUrl = `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/public?exp=${expiry}&sig=${signature}`;
```

### 3. Access Control Patterns

**Time-Based Access**:
```typescript
// 5 minutes
const expiry = Math.floor(Date.now() / 1000) + 300;

// 1 hour
const expiry = Math.floor(Date.now() / 1000) + 3600;

// 24 hours
const expiry = Math.floor(Date.now() / 1000) + 86400;
```

**User-Based Access**:
```typescript
// Check user authentication first
if (!req.user || req.user.id !== imageOwnerId) {
  return c.json({ error: 'Unauthorized' }, 403);
}

// Generate signed URL only for authorized user
const signedUrl = await generateSignedUrl(imageId, expiry);
```

**Content Type Restrictions**:
```typescript
// Only allow specific variants
const allowedVariants = ['thumbnail', 'medium'];
if (!allowedVariants.includes(variant)) {
  return c.json({ error: 'Forbidden variant' }, 403);
}
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
CF_ACCOUNT_ID=your_account_id_here
CF_API_TOKEN=your_api_token_here
CF_ACCOUNT_HASH=your_account_hash_here
CF_IMAGES_SIGNING_KEY=your_signing_key_here  # Generate: openssl rand -hex 32
```

**Get your credentials**:
- **Account ID**: Dashboard → Workers & Pages → Account ID (right sidebar)
- **API Token**: Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Images"
- **Account Hash**: Dashboard → Images → Serving Images → Account Hash
- **Signing Key**: Dashboard → Images → Signing Keys → Create Key (or generate with `openssl rand -hex 32`)

### 3. Deploy Worker

```bash
# Development
npm run dev

# Production
npm run deploy
```

### 4. Configure Wrangler

Update `wrangler.jsonc` with your Account ID:

```jsonc
{
  "account_id": "YOUR_ACCOUNT_ID"  // ← Replace
}
```

### 5. Set Secrets

```bash
# Set secrets in production (more secure than .env)
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN
npx wrangler secret put CF_IMAGES_SIGNING_KEY
```

### 6. Open Gallery

```bash
# Serve frontend locally
npx serve public

# Or open directly
open public/index.html
```

## API Endpoints

### POST /api/upload-private

Upload a private image (requireSignedURLs: true).

**Request**:
```bash
curl -X POST http://localhost:8787/api/upload-private \
  -F "file=@image.jpg"
```

**Response**:
```json
{
  "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901",
  "uploaded": true,
  "requireSignedURLs": true
}
```

### POST /api/sign-url

Generate a signed URL for a private image.

**Request**:
```bash
curl -X POST http://localhost:8787/api/sign-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "variant": "public",
    "expirySeconds": 3600
  }'
```

**Response**:
```json
{
  "signedUrl": "https://imagedelivery.net/{hash}/{id}/public?exp=1234567890&sig=abc123...",
  "expiresAt": "2024-01-15T12:00:00Z",
  "expirySeconds": 3600
}
```

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "service": "Cloudflare Images Private Images Example"
}
```

## Security Best Practices

### 1. Use Strong Signing Keys

```bash
# Generate cryptographically secure key
openssl rand -hex 32

# Store as Wrangler secret (not in code)
npx wrangler secret put CF_IMAGES_SIGNING_KEY
```

### 2. Short Expiry Times

```typescript
// Prefer short expiry for sensitive content
const expiry = Math.floor(Date.now() / 1000) + 300; // 5 minutes
```

### 3. Validate User Access

```typescript
// Check user owns the image before signing
const image = await db.query('SELECT owner_id FROM images WHERE id = ?', [imageId]);
if (image.owner_id !== req.user.id) {
  return c.json({ error: 'Forbidden' }, 403);
}
```

### 4. Rate Limiting

```typescript
// Limit signed URL generation
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: /* your redis */,
  limiter: Ratelimit.slidingWindow(10, '1m') // 10 requests per minute
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  return c.json({ error: 'Rate limit exceeded' }, 429);
}
```

### 5. Audit Logging

```typescript
// Log all signed URL generations
await db.insert('audit_log').values({
  user_id: req.user.id,
  image_id: imageId,
  action: 'generate_signed_url',
  expiry: expiry,
  timestamp: new Date()
});
```

## Testing

### Test Signed URL Generation

```bash
# 1. Upload private image
IMAGE_ID=$(curl -X POST http://localhost:8787/api/upload-private \
  -F "file=@test.jpg" | jq -r '.imageId')

# 2. Generate signed URL
SIGNED_URL=$(curl -X POST http://localhost:8787/api/sign-url \
  -H "Content-Type: application/json" \
  -d "{\"imageId\": \"$IMAGE_ID\", \"expirySeconds\": 300}" | jq -r '.signedUrl')

# 3. Access image
curl "$SIGNED_URL" -o output.jpg

# 4. Verify output.jpg displays correctly
open output.jpg
```

### Test Expiry

```bash
# Generate URL with 5-second expiry
SIGNED_URL=$(curl -X POST http://localhost:8787/api/sign-url \
  -H "Content-Type: application/json" \
  -d "{\"imageId\": \"$IMAGE_ID\", \"expirySeconds\": 5}" | jq -r '.signedUrl')

# Access immediately (should work)
curl "$SIGNED_URL" -o output1.jpg

# Wait 10 seconds
sleep 10

# Try again (should fail with 403)
curl "$SIGNED_URL" -o output2.jpg  # ← Expect error
```

### Test Invalid Signature

```bash
# Try accessing without signature (should fail)
curl "https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/public" -o output.jpg
# ← Expect: 403 Forbidden (requireSignedURLs: true)
```

## Common Use Cases

### 1. User Profile Photos

**Scenario**: Users can upload profile photos visible only to authenticated users.

```typescript
// Upload private profile photo
const uploadResponse = await uploadPrivateImage(file);

// Generate signed URL for logged-in user
const signedUrl = await generateSignedUrl(uploadResponse.imageId, 3600);

// Display in profile
<img src={signedUrl} alt="Profile" />
```

### 2. Premium Content

**Scenario**: Paid users get temporary access to premium images.

```typescript
// Check subscription
if (!user.isPremium) {
  return c.json({ error: 'Subscription required' }, 402);
}

// Generate signed URL with 24-hour expiry
const signedUrl = await generateSignedUrl(imageId, 86400);
```

### 3. Temporary Sharing

**Scenario**: Generate a shareable link that expires after 1 hour.

```typescript
// Generate short-lived share link
const shareUrl = await generateSignedUrl(imageId, 3600);

// Send via email or copy to clipboard
await sendEmail(recipient, `View image: ${shareUrl}`);
```

### 4. Medical/Legal Images (HIPAA/GDPR)

**Scenario**: Highly sensitive images with strict access control.

```typescript
// Check authorization
if (!user.hasPermission('view_medical_records')) {
  return c.json({ error: 'Unauthorized' }, 403);
}

// Generate very short expiry (5 minutes)
const signedUrl = await generateSignedUrl(imageId, 300);

// Log access for audit trail
await logAccess(user.id, imageId, 'medical_image_view');
```

## Performance Optimization

### 1. Cache Signed URLs

```typescript
// Cache signed URL in KV for 50% of expiry time
const cacheKey = `signed:${imageId}:${variant}`;
const cachedUrl = await env.KV.get(cacheKey);

if (cachedUrl) {
  return c.json({ signedUrl: cachedUrl });
}

const signedUrl = await generateSignedUrl(imageId, expiry);
await env.KV.put(cacheKey, signedUrl, { expirationTtl: expiry / 2 });

return c.json({ signedUrl });
```

### 2. Batch Signing

```typescript
// Sign multiple images at once
const imageIds = ['id1', 'id2', 'id3'];
const signedUrls = await Promise.all(
  imageIds.map(id => generateSignedUrl(id, 3600))
);
```

### 3. CDN Caching

Signed URLs are cached by Cloudflare CDN until expiry:

```
Cache-Control: public, max-age=<expiry-seconds>
```

Ensure expiry is set correctly to leverage CDN caching.

## Troubleshooting

### Issue: "Invalid signature" (403)

**Cause**: Signature verification failed.

**Solutions**:
- Verify signing key matches between upload and URL generation
- Check expiry timestamp is in the future
- Ensure URL encoding is correct (no spaces, special chars)

### Issue: Signed URL works initially, then fails

**Cause**: URL has expired.

**Solutions**:
- Increase `expirySeconds` when generating URL
- Regenerate URL before displaying to user
- Implement automatic refresh in frontend

### Issue: Cannot access image even with signature

**Cause**: Image not uploaded with `requireSignedURLs: true`.

**Solutions**:
- Re-upload image with `requireSignedURLs: true`
- Or remove signing requirement (not recommended for private content)

### Issue: Signature works in browser but not in cURL

**Cause**: URL encoding differences.

**Solutions**:
- Ensure proper URL encoding: `encodeURIComponent(signedUrl)`
- Use raw URL in cURL: `curl "$SIGNED_URL"`

## Related Examples

- **Basic Upload**: Minimal upload implementation
- **Responsive Gallery**: Public image gallery with srcset

## Related References

- **Signed URLs Guide**: `references/signed-urls-guide.md`
- **API Reference**: `references/api-reference.md`
- **Top Errors**: `references/top-errors.md`
- **Security Best Practices**: `references/api-reference.md` (Security section)

## Production Checklist

Before deploying to production:

- [ ] Store signing key in Wrangler secrets (not .env)
- [ ] Implement rate limiting on `/api/sign-url`
- [ ] Add user authentication/authorization
- [ ] Enable audit logging for signed URL generation
- [ ] Set appropriate expiry times (shorter for sensitive content)
- [ ] Test expiry behavior thoroughly
- [ ] Monitor signed URL generation rate
- [ ] Implement signed URL refresh mechanism in frontend
- [ ] Add CORS headers if accessing from different domain
- [ ] Set up error monitoring (Sentry, etc.)

## License

MIT
