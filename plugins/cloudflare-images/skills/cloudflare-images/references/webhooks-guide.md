# Cloudflare Images Webhooks Guide

Complete guide to configuring and handling webhooks for Cloudflare Images upload notifications.

---

## What Are Webhooks?

Webhooks allow you to receive real-time notifications when images are uploaded to Cloudflare Images. Instead of polling the API, Cloudflare sends HTTP POST requests to your specified endpoint when events occur.

**Common Use Cases**:
- Process images after upload (resize, analyze, moderate)
- Update database records with image metadata
- Trigger workflows (send notifications, update UI)
- Audit and logging
- Content moderation pipelines

---

## Webhook Events

Cloudflare Images sends webhooks for these events:

### 1. Image Upload Success

**Trigger**: Image successfully uploaded via API or direct creator upload

**Payload**:
```json
{
  "event": "image.uploaded",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "accountId": "abc123",
  "image": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "filename": "profile.jpg",
    "uploaded": "2025-01-15T10:30:45.000Z",
    "requireSignedURLs": false,
    "variants": [
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../public",
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../thumbnail"
    ],
    "metadata": {
      "userId": "user_12345",
      "source": "profile_upload"
    }
  }
}
```

---

## Configuring Webhooks

### Dashboard Configuration

1. **Navigate to Images Settings**:
   - Dashboard → Images → Settings → Webhooks

2. **Add Webhook URL**:
   - Enter your endpoint URL (must be HTTPS)
   - Select events to receive
   - (Optional) Add secret for signature verification

3. **Test Webhook**:
   - Click "Test" to send sample payload
   - Verify your endpoint receives and processes it

### API Configuration

```bash
curl --request PUT \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/webhooks \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "url": "https://your-server.com/webhooks/images",
    "events": ["image.uploaded"],
    "secret": "your_webhook_secret_key"
  }'
```

**Response**:
```json
{
  "success": true,
  "result": {
    "id": "webhook_abc123",
    "url": "https://your-server.com/webhooks/images",
    "events": ["image.uploaded"],
    "active": true,
    "created": "2025-01-15T10:00:00Z"
  }
}
```

---

## Implementing Webhook Handler

### Cloudflare Workers Example

**Complete webhook handler with signature verification**:

```typescript
// src/index.ts
interface ImageWebhook {
  event: 'image.uploaded';
  timestamp: string;
  accountId: string;
  image: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
    metadata?: Record<string, string>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Verify webhook signature
    const signature = request.headers.get('X-Cloudflare-Signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const body = await request.text();
    const isValid = await verifySignature(body, signature, env.WEBHOOK_SECRET);

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    // 2. Parse webhook payload
    const webhook: ImageWebhook = JSON.parse(body);

    // 3. Handle webhook event
    try {
      await handleImageUpload(webhook, env);
      return new Response('Webhook processed', { status: 200 });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Processing failed', { status: 500 });
    }
  }
};

async function verifySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = hexToBuffer(signature);
  const dataBuffer = encoder.encode(body);

  return crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

async function handleImageUpload(webhook: ImageWebhook, env: Env) {
  // Example: Save metadata to D1 database
  await env.DB.prepare(
    `INSERT INTO uploaded_images (id, filename, uploaded_at, user_id, variants)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    webhook.image.id,
    webhook.image.filename,
    webhook.image.uploaded,
    webhook.image.metadata?.userId || 'unknown',
    JSON.stringify(webhook.image.variants)
  ).run();

  // Example: Trigger additional processing
  if (webhook.image.metadata?.requiresModeration) {
    await env.MODERATION_QUEUE.send({
      imageId: webhook.image.id,
      timestamp: webhook.timestamp
    });
  }

  console.log(`Processed image upload: ${webhook.image.id}`);
}
```

**wrangler.jsonc**:
```jsonc
{
  "name": "images-webhook-handler",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-15",
  "vars": {
    "WEBHOOK_SECRET": "your_webhook_secret_key"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "images_metadata",
      "database_id": "your-database-id"
    }
  ],
  "queues": {
    "producers": [
      {
        "binding": "MODERATION_QUEUE",
        "queue": "image-moderation"
      }
    ]
  }
}
```

---

## Security Best Practices

### 1. Signature Verification

**Always verify webhook signatures** to ensure requests come from Cloudflare:

```typescript
const isValid = await verifySignature(
  requestBody,
  request.headers.get('X-Cloudflare-Signature'),
  env.WEBHOOK_SECRET
);

if (!isValid) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 2. Secret Management

- **Never hardcode secrets** in source code
- Use environment variables or secrets management
- Rotate webhook secrets periodically
- Use different secrets for dev/staging/production

### 3. Endpoint Security

- **Require HTTPS** for webhook endpoints
- **Validate payload structure** before processing
- **Rate limit** webhook endpoint to prevent abuse
- **Log all webhook attempts** for auditing

### 4. Error Handling

- Return `200 OK` only after successful processing
- Return `4xx` for client errors (invalid payload)
- Return `5xx` for server errors (processing failure)
- Cloudflare will retry failed webhooks (exponential backoff)

---

## Common Webhook Patterns

### Pattern 1: Database Update

```typescript
async function handleImageUpload(webhook: ImageWebhook, env: Env) {
  // Update database with image metadata
  await env.DB.prepare(
    `INSERT INTO images (id, filename, user_id, uploaded_at)
     VALUES (?, ?, ?, ?)`
  ).bind(
    webhook.image.id,
    webhook.image.filename,
    webhook.image.metadata?.userId,
    webhook.image.uploaded
  ).run();
}
```

### Pattern 2: Queue for Processing

```typescript
async function handleImageUpload(webhook: ImageWebhook, env: Env) {
  // Send to queue for async processing
  await env.IMAGE_QUEUE.send({
    imageId: webhook.image.id,
    action: 'generate_thumbnails',
    variants: webhook.image.variants
  });
}
```

### Pattern 3: Notification

```typescript
async function handleImageUpload(webhook: ImageWebhook, env: Env) {
  // Send notification to user
  await fetch(`${env.API_URL}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: webhook.image.metadata?.userId,
      message: `Your image ${webhook.image.filename} has been uploaded`,
      imageUrl: webhook.image.variants[0]
    })
  });
}
```

### Pattern 4: Content Moderation

```typescript
async function handleImageUpload(webhook: ImageWebhook, env: Env) {
  // Send image to moderation API
  const moderationResult = await fetch(`${env.MODERATION_API}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: webhook.image.variants[0],
      imageId: webhook.image.id
    })
  });

  const result = await moderationResult.json();

  if (!result.approved) {
    // Delete image if moderation fails
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${webhook.accountId}/images/v1/${webhook.image.id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` }
      }
    );
  }
}
```

---

## Troubleshooting Webhooks

### Webhook Not Received

**Check**:
1. Endpoint URL is correct and accessible
2. Endpoint uses HTTPS (not HTTP)
3. Firewall allows Cloudflare IPs
4. Webhook is active in dashboard
5. Event type is enabled

**Test**:
```bash
# Send test webhook from dashboard
# Check server logs for incoming requests
```

### Signature Verification Fails

**Common Causes**:
- Wrong secret key
- Request body modified before verification
- Incorrect signature parsing (hex encoding)

**Solution**:
```typescript
// Log signature and body for debugging
console.log('Received signature:', signature);
console.log('Request body:', body);

// Verify secret matches dashboard configuration
```

### Webhook Timeout

**Cloudflare timeout**: 30 seconds

**Best Practice**:
- Acknowledge webhook immediately (return 200)
- Process asynchronously (queue, background job)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const webhook = await request.json();

    // Acknowledge immediately
    const response = new Response('Accepted', { status: 202 });

    // Process in background
    env.ctx.waitUntil(processWebhook(webhook, env));

    return response;
  }
};
```

---

## Webhook Retry Policy

Cloudflare automatically retries failed webhooks:

**Retry Schedule**:
1. Immediate retry
2. 1 minute later
3. 5 minutes later
4. 15 minutes later
5. 1 hour later
6. Give up after 24 hours

**Success Criteria**:
- HTTP status: 2xx (200-299)
- Response within 30 seconds

**Best Practice**: Return 200 OK as soon as webhook is received and validated, then process asynchronously.

---

## Testing Webhooks Locally

### Using ngrok

```bash
# 1. Start ngrok tunnel
ngrok http 8787

# 2. Configure webhook URL in dashboard
# URL: https://abc123.ngrok.io/webhooks

# 3. Start local dev server
npm run dev

# 4. Upload test image
# Webhook will be sent to your local server
```

### Manual Testing

```bash
# Send test webhook to local endpoint
curl --request POST \
  http://localhost:8787/webhooks \
  --header "X-Cloudflare-Signature: test_signature" \
  --header "Content-Type: application/json" \
  --data '{
    "event": "image.uploaded",
    "timestamp": "2025-01-15T10:30:00Z",
    "accountId": "test",
    "image": {
      "id": "test_image_id",
      "filename": "test.jpg",
      "uploaded": "2025-01-15T10:30:00Z",
      "requireSignedURLs": false,
      "variants": ["https://example.com/test.jpg"],
      "metadata": {"userId": "test_user"}
    }
  }'
```

---

## Production Checklist

Before deploying webhooks to production:

- [ ] Signature verification implemented
- [ ] Secrets stored in environment variables (not hardcoded)
- [ ] HTTPS endpoint with valid SSL certificate
- [ ] Error handling for all webhook processing steps
- [ ] Logging for audit trail
- [ ] Monitoring/alerting for webhook failures
- [ ] Tested with sample webhooks
- [ ] Retry logic handles idempotency
- [ ] Async processing for long-running operations
- [ ] Database transactions for data consistency

---

## Related References

- **Upload API**: See `references/api-reference.md`
- **Direct Creator Upload**: See `references/direct-upload-complete-workflow.md`
- **Error Handling**: See `references/top-errors.md`

---

## Official Documentation

- **Webhooks**: https://developers.cloudflare.com/images/manage-images/webhooks/
- **API Reference**: https://developers.cloudflare.com/api/resources/images/
