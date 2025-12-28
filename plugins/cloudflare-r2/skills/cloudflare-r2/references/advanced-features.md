# R2 Advanced Features

**Last Updated**: 2025-12-27

Advanced R2 capabilities including storage classes, bucket locks, tus protocol resumable uploads, and server-side encryption with customer-provided keys (SSE-C).

---

## Storage Classes

Storage classes optimize costs based on object access patterns. Choose the appropriate class for different data lifecycle stages.

### Available Storage Classes

| Class | Use Case | Access Latency | Cost |
|-------|----------|----------------|------|
| **Standard** | Frequently accessed data | <10ms | Standard |
| **Infrequent Access** | Rarely accessed data | <100ms | Lower storage, higher retrieval |
| **Archive** | Long-term retention | Minutes | Lowest storage, highest retrieval |

**Note**: Storage class support is currently in development. Check official docs for availability.

### Configuring Storage Class (Future)

```typescript
// Upload with storage class (when available)
await env.MY_BUCKET.put('archive/old-data.zip', data, {
  storageClass: 'ARCHIVE',
  httpMetadata: {
    contentType: 'application/zip',
  },
});
```

### Lifecycle Policies (Future)

Automatically transition objects between storage classes:

```jsonc
// wrangler.jsonc (when available)
{
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket",
      "lifecycle_rules": [
        {
          "id": "archive-old-backups",
          "prefix": "backups/",
          "transitions": [
            {
              "days": 30,
              "storage_class": "INFREQUENT_ACCESS"
            },
            {
              "days": 90,
              "storage_class": "ARCHIVE"
            }
          ]
        },
        {
          "id": "delete-temp-files",
          "prefix": "temp/",
          "expiration": {
            "days": 7
          }
        }
      ]
    }
  ]
}
```

---

## Bucket Locks (Compliance Mode)

Bucket locks prevent accidental or malicious deletion of objects, enforcing retention policies for compliance and data protection.

### Object Lock Modes

**Compliance Mode**:
- Objects cannot be deleted or modified until retention period expires
- Even account administrators cannot override
- Required for regulatory compliance (FINRA, SEC, HIPAA, etc.)

**Governance Mode**:
- Objects protected but can be overridden with special permissions
- Useful for internal policies without strict regulatory requirements

### Enabling Bucket Lock

**Dashboard Setup**:
1. Navigate to R2 → Select bucket
2. Click "Settings" tab
3. Scroll to "Object Lock" section
4. Enable "Object Lock" (cannot be disabled once enabled)
5. Set default retention period

**Wrangler Configuration**:

```bash
# Enable object lock on bucket (irreversible!)
bunx wrangler r2 bucket update my-bucket --object-lock

# Set retention mode
bunx wrangler r2 bucket update my-bucket \
  --object-lock-mode COMPLIANCE \
  --object-lock-days 90
```

### Uploading with Retention

```typescript
// Upload with retention policy
await env.MY_BUCKET.put('legal/document.pdf', data, {
  httpMetadata: {
    contentType: 'application/pdf',
  },
  // Object cannot be deleted for 365 days
  objectLock: {
    mode: 'COMPLIANCE',
    retainUntilDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
});
```

### Use Cases

- **Financial Records**: SEC/FINRA require 7-year retention
- **Healthcare Data**: HIPAA compliance requires immutable audit logs
- **Legal Documents**: E-discovery and litigation hold requirements
- **Backup Protection**: Prevent ransomware from deleting backups
- **Audit Trails**: Immutable logs for compliance investigations

---

## tus Protocol (Resumable Uploads)

The tus protocol enables resumable file uploads, allowing uploads to continue after network interruptions without starting over. Better than multipart for unreliable connections.

### Why Use tus Instead of Multipart?

| Feature | Multipart Upload | tus Protocol |
|---------|------------------|--------------|
| **Resume after failure** | No - restart from beginning | Yes - resume from last byte |
| **Network reliability** | Requires stable connection | Handles intermittent connectivity |
| **Client support** | Custom implementation | Standard protocol, many libraries |
| **Progress tracking** | Manual tracking | Built-in progress |
| **Complexity** | Medium | Low (with libraries) |

### Enabling tus Support

**Wrangler Configuration**:

```jsonc
{
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket",
      "tus_enabled": true  // Enable tus protocol
    }
  ]
}
```

### Client-Side tus Upload

**JavaScript Client**:

```javascript
import * as tus from 'tus-js-client';

function uploadWithTus(file, onProgress) {
  const upload = new tus.Upload(file, {
    // tus endpoint (served by your Worker)
    endpoint: '/api/upload/tus',

    // Retry on failure
    retryDelays: [0, 1000, 3000, 5000],

    // Custom metadata
    metadata: {
      filename: file.name,
      filetype: file.type,
      userId: currentUserId,
    },

    // Progress tracking
    onProgress: (bytesUploaded, bytesTotal) => {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      onProgress(percentage);
      console.log(`Uploaded ${bytesUploaded} of ${bytesTotal} bytes (${percentage}%)`);
    },

    // Upload complete
    onSuccess: () => {
      console.log('Upload complete!');
    },

    // Upload failed
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  // Start upload
  upload.start();

  // Return upload object for controls
  return {
    pause: () => upload.abort(),
    resume: () => upload.start(),
    abort: () => upload.abort(true),
  };
}
```

### Worker tus Handler

```typescript
import { Hono } from 'hono';
import { tusMiddleware } from '@tus/server';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// tus upload endpoint
app.all('/api/upload/tus/*', async (c) => {
  const tusHandler = tusMiddleware({
    // Store upload metadata in R2
    datastore: new R2DataStore(c.env.MY_BUCKET),

    // Allow upload resume
    namingFunction: (req) => {
      return `${Date.now()}-${crypto.randomUUID()}`;
    },

    // Maximum upload size (5GB)
    maxSize: 5 * 1024 * 1024 * 1024,

    // Handle upload complete
    onUploadComplete: async (req, upload) => {
      console.log('Upload complete:', upload.id);

      // Move from temp to final location
      const finalKey = `uploads/${upload.metadata.filename}`;
      await c.env.MY_BUCKET.put(finalKey, upload.stream, {
        httpMetadata: {
          contentType: upload.metadata.filetype,
        },
        customMetadata: {
          uploadId: upload.id,
          userId: upload.metadata.userId,
        },
      });
    },
  });

  return tusHandler(c.req.raw);
});

export default app;
```

### tus Best Practices

1. **Set reasonable chunk sizes** - 1-10MB chunks for optimal performance
2. **Implement authentication** - Secure tus endpoints
3. **Monitor storage usage** - Clean up incomplete uploads
4. **Set expiry times** - Delete abandoned uploads after 24-48 hours
5. **Use progress callbacks** - Provide user feedback during upload
6. **Handle network changes** - Detect disconnections and auto-resume

---

## Server-Side Encryption with Customer Keys (SSE-C)

SSE-C allows you to manage your own encryption keys while Cloudflare handles encryption/decryption operations. Keys never leave your control.

### How SSE-C Works

1. Client provides encryption key with upload request
2. Cloudflare encrypts object using provided key
3. Cloudflare discards key after encryption
4. Client must provide same key for download
5. Without key, object cannot be decrypted

### Uploading with SSE-C

```typescript
import crypto from 'crypto';

// Generate or retrieve encryption key (32 bytes)
const encryptionKey = crypto.randomBytes(32);
const keyBase64 = encryptionKey.toString('base64');
const keyMD5 = crypto.createHash('md5').update(encryptionKey).digest('base64');

// Upload with customer-provided encryption
await env.MY_BUCKET.put('secure/document.pdf', data, {
  httpMetadata: {
    contentType: 'application/pdf',
  },
  encryption: {
    algorithm: 'AES256',
    key: keyBase64,
    keyMD5: keyMD5,
  },
});

// Store encryption key securely (e.g., in KV or external key management system)
await env.ENCRYPTION_KEYS.put('document.pdf', keyBase64);
```

### Downloading with SSE-C

```typescript
// Retrieve encryption key
const encryptionKey = await env.ENCRYPTION_KEYS.get('document.pdf');

if (!encryptionKey) {
  return c.json({ error: 'Encryption key not found' }, 404);
}

const keyBuffer = Buffer.from(encryptionKey, 'base64');
const keyMD5 = crypto.createHash('md5').update(keyBuffer).digest('base64');

// Download with encryption key
const object = await env.MY_BUCKET.get('secure/document.pdf', {
  encryption: {
    algorithm: 'AES256',
    key: encryptionKey,
    keyMD5: keyMD5,
  },
});

if (!object) {
  return c.json({ error: 'Object not found or decryption failed' }, 404);
}

return new Response(object.body, {
  headers: {
    'Content-Type': 'application/pdf',
  },
});
```

### SSE-C Key Management

**Option 1: Cloudflare Workers KV**

```typescript
// Store keys in KV (encrypted at rest by Cloudflare)
await env.ENCRYPTION_KEYS.put(`key:${objectKey}`, encryptionKey);

// Retrieve keys
const key = await env.ENCRYPTION_KEYS.get(`key:${objectKey}`);
```

**Option 2: External Key Management Service (KMS)**

```typescript
// Store keys in AWS KMS, Azure Key Vault, or HashiCorp Vault
async function getEncryptionKey(objectKey: string): Promise<string> {
  const response = await fetch(`https://kms.example.com/keys/${objectKey}`, {
    headers: {
      'Authorization': `Bearer ${env.KMS_API_KEY}`,
    },
  });

  const data = await response.json();
  return data.encryptionKey;
}
```

**Option 3: Derived Keys (Password-Based)**

```typescript
import { pbkdf2 } from 'crypto';

// Derive encryption key from user password
function deriveEncryptionKey(password: string, salt: string): string {
  return pbkdf2(password, salt, 100000, 32, 'sha256').toString('base64');
}

// Use derived key for encryption
const userPassword = 'user-secret-password';
const salt = 'unique-salt-per-user';
const encryptionKey = deriveEncryptionKey(userPassword, salt);
```

### SSE-C Best Practices

1. **Never log encryption keys** - Keys are sensitive credentials
2. **Use strong key generation** - Crypto-secure random number generators
3. **Rotate keys periodically** - Re-encrypt objects with new keys
4. **Backup keys securely** - Losing keys means losing data permanently
5. **Use separate keys per object** - Limit blast radius of key compromise
6. **Implement key derivation** - Use password-based keys for user data
7. **Monitor key access** - Audit who retrieves encryption keys

### SSE-C Use Cases

- **PII/PHI Data**: HIPAA compliance with customer-managed keys
- **Financial Records**: SOC 2 compliance requirements
- **Intellectual Property**: Source code, patents, trade secrets
- **User Data Encryption**: Per-user encryption keys
- **Zero-Knowledge Architecture**: Server cannot decrypt user data

---

## Combining Advanced Features

### Example: Encrypted, Locked, Resumable Upload

```typescript
// Upload sensitive document with all protections
async function uploadSecureDocument(
  file: File,
  env: Bindings,
  userId: string
) {
  // Generate encryption key
  const encryptionKey = crypto.randomBytes(32);
  const keyBase64 = encryptionKey.toString('base64');
  const keyMD5 = crypto.createHash('md5').update(encryptionKey).digest('base64');

  // Upload with tus (resumable), SSE-C (encrypted), and object lock (immutable)
  const upload = new tus.Upload(file, {
    endpoint: '/api/upload/tus',
    metadata: {
      filename: file.name,
      filetype: file.type,
      userId: userId,
      encrypted: 'true',
      locked: 'true',
    },
    headers: {
      // SSE-C headers
      'x-amz-server-side-encryption-customer-algorithm': 'AES256',
      'x-amz-server-side-encryption-customer-key': keyBase64,
      'x-amz-server-side-encryption-customer-key-md5': keyMD5,
      // Object lock headers
      'x-amz-object-lock-mode': 'COMPLIANCE',
      'x-amz-object-lock-retain-until-date': new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    onSuccess: async () => {
      // Store encryption key securely
      await env.ENCRYPTION_KEYS.put(`user:${userId}:${file.name}`, keyBase64);
      console.log('Secure upload complete!');
    },
  });

  upload.start();
}
```

---

## Migration Strategies

### Enabling Advanced Features on Existing Buckets

**Storage Classes**: Can be enabled retroactively, objects keep current class until changed

**Bucket Locks**: CANNOT be enabled on existing buckets with data (create new bucket)

**tus Protocol**: Can be enabled anytime, doesn't affect existing objects

**SSE-C**: Can be enabled anytime, only new uploads will be encrypted

### Migration Steps for Bucket Lock

```bash
# 1. Create new bucket with object lock
bunx wrangler r2 bucket create my-bucket-locked --object-lock

# 2. Copy objects to new bucket (Workers script)
# 3. Update application to use new bucket
# 4. Verify all data migrated
# 5. Delete old bucket
```

---

## Troubleshooting

### Storage Class Errors

**Error**: "Storage class not supported"
**Solution**: Feature in development, use Standard class for now

### Bucket Lock Issues

**Error**: "Cannot enable object lock on existing bucket"
**Solution**: Create new bucket with object lock enabled, migrate data

**Error**: "Cannot delete object - retention period active"
**Solution**: Wait for retention period to expire, or use Governance mode with override permissions

### tus Upload Failures

**Error**: "tus endpoint not found"
**Solution**: Enable tus in wrangler.jsonc, implement tus handler in Worker

**Error**: "Upload not resuming"
**Solution**: Check tus client configuration, ensure upload ID is being stored

### SSE-C Decryption Failures

**Error**: "Decryption failed - wrong key"
**Solution**: Verify encryption key matches upload key, check key storage

**Error**: "Cannot download - key required"
**Solution**: Provide encryption key in download request headers

---

## Official Documentation

- **Storage Classes** (In Development): https://developers.cloudflare.com/r2/
- **Bucket Locks**: https://developers.cloudflare.com/r2/buckets/object-lock/
- **tus Protocol**: https://tus.io/protocols/resumable-upload
- **SSE-C**: https://developers.cloudflare.com/r2/api/s3/encryption/

---

**Advanced features for enterprise-grade R2 deployments!**
