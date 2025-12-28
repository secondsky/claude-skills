# Sourcing Kit for Cloudflare Images

Guide to integrating external image sources, managing credentials, and migrating from other CDNs to Cloudflare Images.

---

## External Source Integration

### Upload via URL

Cloudflare Images can ingest images from external URLs:

```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
  --header "Authorization: Bearer <API_TOKEN>" \
  --form "url=https://example.com/image.jpg"
```

**Supported Sources**:
- ✅ Public URLs (HTTP/HTTPS)
- ✅ Cloud storage (S3, Google Cloud Storage, Azure Blob)
- ✅ Other CDNs (Cloudinary, Imgix, etc.)
- ❌ Password-protected URLs
- ❌ URLs requiring authentication

---

## Migrating from Other CDNs

### Strategy 1: Bulk Import via URL

**From Cloudinary**:
```typescript
// Fetch all images from Cloudinary
const cloudinaryImages = await fetchCloudinaryImages();

// Import to Cloudflare Images
for (const image of cloudinaryImages) {
  const cloudinaryUrl = `https://res.cloudinary.com/${cloud_name}/image/upload/${image.public_id}.jpg`;

  const formData = new FormData();
  formData.append('url', cloudinaryUrl);
  formData.append('metadata', JSON.stringify({
    source: 'cloudinary',
    originalId: image.public_id
  }));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}` },
      body: formData
    }
  );

  const result = await response.json();
  console.log(`Migrated: ${image.public_id} → ${result.result.id}`);
}
```

**From Imgix**:
```typescript
async function migrateFromImgix(imgixUrl: string) {
  const formData = new FormData();
  formData.append('url', imgixUrl);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}` },
      body: formData
    }
  );

  return response.json();
}

// Usage
await migrateFromImgix('https://your-domain.imgix.net/photo.jpg');
```

### Strategy 2: Download and Re-Upload

**For S3 buckets**:
```typescript
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

async function migrateFromS3(bucket: string, prefix: string) {
  // List objects
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix
  });

  const { Contents } = await s3.send(listCommand);

  for (const object of Contents || []) {
    // Download from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: object.Key
    });

    const { Body } = await s3.send(getCommand);
    const blob = await Body?.transformToByteArray();

    if (!blob) continue;

    // Upload to Cloudflare Images
    const formData = new FormData();
    formData.append('file', new Blob([blob]), object.Key || 'image.jpg');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}` },
        body: formData
      }
    );

    const result = await response.json();
    console.log(`Migrated: ${object.Key} → ${result.result.id}`);
  }
}
```

---

## Credentials Management

### API Token Best Practices

**1. Scoped Tokens**:
```
Create token with minimum required permissions:
- Cloudflare Images: Edit (upload, delete)
- Cloudflare Images: Read (list, fetch metadata)
```

**2. Environment Variables**:
```typescript
// .env
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token_images_edit
CF_ACCOUNT_HASH=your_account_hash

// Never commit to git
// Add to .gitignore:
.env
.env.local
.env.*.local
```

**3. Token Rotation**:
```bash
# Create new token
# Update environment variables
# Revoke old token

# Script to rotate token
./scripts/rotate-api-token.sh
```

**4. Secure Storage**:

**For Cloudflare Workers**:
```bash
# Use secrets (not environment variables)
wrangler secret put CF_API_TOKEN
```

**For Serverless Functions**:
```bash
# Vercel
vercel env add CF_API_TOKEN production

# Netlify
netlify env:set CF_API_TOKEN value
```

---

## Multi-Source Integration

### Aggregate Images from Multiple Sources

```typescript
interface ImageSource {
  type: 'url' | 's3' | 'cloudinary' | 'local';
  location: string;
  credentials?: Record<string, string>;
}

async function importFromSource(source: ImageSource) {
  switch (source.type) {
    case 'url':
      return importFromURL(source.location);

    case 's3':
      return importFromS3(
        source.location,
        source.credentials?.accessKeyId!,
        source.credentials?.secretAccessKey!
      );

    case 'cloudinary':
      return importFromCloudinary(
        source.location,
        source.credentials?.cloudName!,
        source.credentials?.apiKey!
      );

    case 'local':
      return importFromLocal(source.location);

    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
}

// Usage
const sources: ImageSource[] = [
  {
    type: 'url',
    location: 'https://example.com/photos/image1.jpg'
  },
  {
    type: 's3',
    location: 's3://my-bucket/images/',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  },
  {
    type: 'cloudinary',
    location: 'my-image-id',
    credentials: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!
    }
  }
];

for (const source of sources) {
  await importFromSource(source);
}
```

---

## Webhook Integration for External Updates

### Listen for External Source Changes

**When external source updates**:
```typescript
// Webhook handler for external CDN
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const webhook = await request.json<{
      event: 'image.updated' | 'image.deleted';
      imageUrl: string;
      imageId: string;
    }>();

    if (webhook.event === 'image.updated') {
      // Re-import updated image from external source
      await reimportImage(webhook.imageUrl, env);
    }

    if (webhook.event === 'image.deleted') {
      // Delete from Cloudflare Images
      await deleteImage(webhook.imageId, env);
    }

    return new Response('Webhook processed', { status: 200 });
  }
};

async function reimportImage(url: string, env: Env) {
  const formData = new FormData();
  formData.append('url', url);

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
      body: formData
    }
  );
}
```

---

## Batch Import Script

### Complete Migration Script

**scripts/migrate-images.ts**:
```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface MigrationConfig {
  accountId: string;
  apiToken: string;
  sourceDir: string;
  batchSize: number;
}

async function migrateImages(config: MigrationConfig) {
  const files = await readdir(config.sourceDir);
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  console.log(`Found ${imageFiles.length} images to migrate`);

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < imageFiles.length; i += config.batchSize) {
    const batch = imageFiles.slice(i, i + config.batchSize);

    const uploadPromises = batch.map(async (file) => {
      try {
        const filePath = join(config.sourceDir, file);
        const fileBuffer = await readFile(filePath);

        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), file);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/images/v1`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${config.apiToken}` },
            body: formData
          }
        );

        const result = await response.json();

        if (result.success) {
          processed++;
          console.log(`✓ Uploaded: ${file} → ${result.result.id}`);
        } else {
          errors++;
          console.error(`✗ Failed: ${file}`, result.errors);
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error uploading ${file}:`, error);
      }
    });

    await Promise.all(uploadPromises);

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nMigration complete:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${imageFiles.length}`);
}

// Usage
await migrateImages({
  accountId: process.env.CF_ACCOUNT_ID!,
  apiToken: process.env.CF_API_TOKEN!,
  sourceDir: './images-to-migrate',
  batchSize: 10
});
```

**Run**:
```bash
tsx scripts/migrate-images.ts
```

---

## URL Mapping for Migration

### Maintain URL Compatibility

**Create mapping table**:
```typescript
// Database schema
interface ImageMapping {
  oldUrl: string;          // https://old-cdn.com/abc/image.jpg
  cloudflareId: string;    // Cloudflare Images ID
  cloudflareUrl: string;   // https://imagedelivery.net/.../public
}

// During migration
await db.imageMappings.create({
  data: {
    oldUrl: 'https://old-cdn.com/images/product-123.jpg',
    cloudflareId: '2cdc28f0-017a-49c4-9ed7-87056c83901',
    cloudflareUrl: `https://imagedelivery.net/${accountHash}/2cdc28f0.../public`
  }
});
```

**Redirect old URLs**:
```typescript
// Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Check if this is an old CDN URL pattern
    if (url.pathname.startsWith('/old-cdn/')) {
      const oldUrl = url.toString();

      // Lookup mapping
      const mapping = await env.DB.prepare(
        'SELECT cloudflareUrl FROM imageMappings WHERE oldUrl = ?'
      ).bind(oldUrl).first<{ cloudflareUrl: string }>();

      if (mapping) {
        return Response.redirect(mapping.cloudflareUrl, 301);
      }
    }

    return fetch(request);
  }
};
```

---

## Cost Optimization During Migration

### Minimize Bandwidth Costs

**1. Use Direct URL Import** (No download to your server):
```typescript
// ✅ EFFICIENT: Cloudflare fetches directly
formData.append('url', externalImageUrl);

// ❌ INEFFICIENT: Download to server first
const response = await fetch(externalImageUrl);
const blob = await response.blob();
formData.append('file', blob);
```

**2. Batch Operations**:
```typescript
// Process 100 images at a time
const batchSize = 100;

for (let i = 0; i < urls.length; i += batchSize) {
  const batch = urls.slice(i, i + batchSize);
  await Promise.all(batch.map(url => importImage(url)));

  // Rate limit: 1 second between batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**3. Deduplicate Before Import**:
```typescript
// Check if image already exists
const existingImage = await db.images.findFirst({
  where: { originalUrl: externalUrl }
});

if (!existingImage) {
  // Import only if not already migrated
  await importImage(externalUrl);
}
```

---

## Error Handling

### Retry Logic for Failed Imports

```typescript
async function importWithRetry(
  url: string,
  maxRetries = 3
): Promise<any> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiToken}` },
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        return result;
      }

      throw new Error(JSON.stringify(result.errors));
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

---

## Progress Tracking

### Monitor Migration Progress

```typescript
interface MigrationProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  startTime: Date;
  estimatedCompletion: Date | null;
}

class MigrationTracker {
  private progress: MigrationProgress;

  constructor(total: number) {
    this.progress = {
      total,
      processed: 0,
      succeeded: 0,
      failed: 0,
      startTime: new Date(),
      estimatedCompletion: null
    };
  }

  recordSuccess() {
    this.progress.processed++;
    this.progress.succeeded++;
    this.updateEstimate();
    this.logProgress();
  }

  recordFailure() {
    this.progress.processed++;
    this.progress.failed++;
    this.updateEstimate();
    this.logProgress();
  }

  private updateEstimate() {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const rate = this.progress.processed / elapsed;
    const remaining = this.progress.total - this.progress.processed;
    const estimatedMs = remaining / rate;

    this.progress.estimatedCompletion = new Date(Date.now() + estimatedMs);
  }

  private logProgress() {
    const { processed, total, succeeded, failed, estimatedCompletion } = this.progress;
    const percentage = ((processed / total) * 100).toFixed(1);

    console.log(
      `Progress: ${processed}/${total} (${percentage}%) | ✓ ${succeeded} | ✗ ${failed} | ETA: ${estimatedCompletion?.toLocaleTimeString()}`
    );
  }
}

// Usage
const tracker = new MigrationTracker(1000);

for (const url of imageUrls) {
  try {
    await importImage(url);
    tracker.recordSuccess();
  } catch (error) {
    tracker.recordFailure();
  }
}
```

---

## Best Practices

### 1. Test with Sample First

```typescript
// Test with 10 images before full migration
const testUrls = imageUrls.slice(0, 10);
for (const url of testUrls) {
  await importImage(url);
}

// Verify results, then proceed with full migration
```

### 2. Maintain Source Mapping

```typescript
// Always store original source
await db.images.create({
  data: {
    cloudflareId: result.result.id,
    originalSource: 'cloudinary',
    originalId: cloudinaryPublicId,
    importedAt: new Date()
  }
});
```

### 3. Implement Rollback Strategy

```typescript
// Keep old CDN active during transition
// Test Cloudflare Images thoroughly
// Gradually switch traffic
// Decommission old CDN only after validation
```

---

## Related References

- **Upload API**: See `references/api-reference.md`
- **Direct Creator Upload**: See `references/direct-upload-complete-workflow.md`
- **Custom Domains**: See `references/custom-domains.md`

---

## Official Documentation

- **Upload Images**: https://developers.cloudflare.com/images/upload-images/
- **Upload via URL**: https://developers.cloudflare.com/images/upload-images/upload-via-url/
- **API Reference**: https://developers.cloudflare.com/api/resources/images/
