/**
 * Cloudflare Images Webhook Handler
 *
 * Complete webhook handler for processing Cloudflare Images upload notifications.
 * Includes signature verification, event processing, and error handling.
 *
 * Features:
 * - HMAC-SHA256 signature verification
 * - Database integration (D1)
 * - Queue integration for async processing
 * - Comprehensive error handling
 * - Logging and monitoring
 *
 * Setup:
 * 1. Configure webhook URL in Cloudflare Images dashboard
 * 2. Set WEBHOOK_SECRET in wrangler.jsonc
 * 3. Configure D1 database binding
 * 4. (Optional) Configure queue for async processing
 */

// ===== Types =====

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

interface Env {
  // Secrets
  WEBHOOK_SECRET: string;

  // D1 Database
  DB: D1Database;

  // Queue (optional)
  PROCESSING_QUEUE?: Queue;

  // Analytics (optional)
  ANALYTICS?: AnalyticsEngineDataset;
}

// ===== Main Handler =====

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 1. Verify signature
      const signature = request.headers.get('X-Cloudflare-Signature');
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }

      const body = await request.text();
      const isValid = await verifySignature(body, signature, env.WEBHOOK_SECRET);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }

      // 2. Parse webhook payload
      let webhook: ImageWebhook;
      try {
        webhook = JSON.parse(body);
      } catch (error) {
        console.error('Invalid JSON payload:', error);
        return new Response('Bad Request', { status: 400 });
      }

      // 3. Validate payload structure
      if (!webhook.event || !webhook.image?.id) {
        console.error('Invalid webhook structure:', webhook);
        return new Response('Bad Request', { status: 400 });
      }

      // 4. Process webhook (respond immediately, process async)
      ctx.waitUntil(processWebhook(webhook, env));

      // 5. Log analytics
      if (env.ANALYTICS) {
        ctx.waitUntil(
          env.ANALYTICS.writeDataPoint({
            blobs: [webhook.event, webhook.image.id],
            doubles: [1],
            indexes: [webhook.accountId]
          })
        );
      }

      // Return success immediately
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook received',
          imageId: webhook.image.id
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

// ===== Signature Verification =====

async function verifySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Import secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert hex signature to ArrayBuffer
    const signatureBuffer = hexToBuffer(signature);
    const dataBuffer = encoder.encode(body);

    // Verify signature
    return await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// ===== Webhook Processing =====

async function processWebhook(webhook: ImageWebhook, env: Env): Promise<void> {
  try {
    console.log(`Processing webhook: ${webhook.event} for image ${webhook.image.id}`);

    // Save to database
    await saveToDatabase(webhook, env);

    // Send to processing queue (if configured)
    if (env.PROCESSING_QUEUE) {
      await queueForProcessing(webhook, env);
    }

    console.log(`Successfully processed webhook for image ${webhook.image.id}`);
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}

async function saveToDatabase(webhook: ImageWebhook, env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO uploaded_images (
        cloudflare_id,
        filename,
        uploaded_at,
        user_id,
        variants,
        requires_signed_urls,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(
        webhook.image.id,
        webhook.image.filename,
        webhook.image.uploaded,
        webhook.image.metadata?.userId || null,
        JSON.stringify(webhook.image.variants),
        webhook.image.requireSignedURLs ? 1 : 0,
        webhook.image.metadata ? JSON.stringify(webhook.image.metadata) : null
      )
      .run();

    console.log(`Saved image ${webhook.image.id} to database`);
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}

async function queueForProcessing(webhook: ImageWebhook, env: Env): Promise<void> {
  if (!env.PROCESSING_QUEUE) return;

  try {
    await env.PROCESSING_QUEUE.send({
      action: 'process_uploaded_image',
      imageId: webhook.image.id,
      filename: webhook.image.filename,
      timestamp: webhook.timestamp,
      metadata: webhook.image.metadata
    });

    console.log(`Queued image ${webhook.image.id} for processing`);
  } catch (error) {
    console.error('Queue send error:', error);
    // Don't throw - queuing is optional
  }
}

// ===== CORS Handler =====

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Cloudflare-Signature',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// ===== Database Schema =====

/*
SQL Schema for D1:

CREATE TABLE IF NOT EXISTS uploaded_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cloudflare_id TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  user_id TEXT,
  variants TEXT NOT NULL,
  requires_signed_urls INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed INTEGER NOT NULL DEFAULT 0,
  processed_at TEXT
);

CREATE INDEX idx_cloudflare_id ON uploaded_images(cloudflare_id);
CREATE INDEX idx_user_id ON uploaded_images(user_id);
CREATE INDEX idx_uploaded_at ON uploaded_images(uploaded_at);
CREATE INDEX idx_processed ON uploaded_images(processed);
*/

// ===== Queue Consumer (Optional) =====

/*
If using Cloudflare Queues, add this consumer:

export default {
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const { action, imageId, filename } = message.body;

        if (action === 'process_uploaded_image') {
          // Add your custom processing logic here
          console.log(`Processing image: ${imageId}`);

          // Example: Generate additional thumbnails, run moderation, etc.

          // Mark as processed
          await env.DB.prepare(
            `UPDATE uploaded_images
             SET processed = 1, processed_at = CURRENT_TIMESTAMP
             WHERE cloudflare_id = ?`
          ).bind(imageId).run();
        }

        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        message.retry();
      }
    }
  }
};
*/

// ===== Testing =====

/*
Test webhook locally:

curl --request POST \
  http://localhost:8787/webhooks \
  --header "X-Cloudflare-Signature: test_signature" \
  --header "Content-Type: application/json" \
  --data '{
    "event": "image.uploaded",
    "timestamp": "2025-01-15T10:30:00Z",
    "accountId": "test_account",
    "image": {
      "id": "test_image_id",
      "filename": "test.jpg",
      "uploaded": "2025-01-15T10:30:00Z",
      "requireSignedURLs": false,
      "variants": [
        "https://imagedelivery.net/hash/test_image_id/public"
      ],
      "metadata": {
        "userId": "user_123",
        "source": "profile_upload"
      }
    }
  }'
*/
