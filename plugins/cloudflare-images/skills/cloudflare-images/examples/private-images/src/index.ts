/**
 * Private Images Example - Cloudflare Worker
 *
 * Generates signed URLs for private images with time-based expiry.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from '@tsndr/cloudflare-worker-jwt';

interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_HASH: string;
  CF_IMAGES_SIGNING_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('/*', cors({
  origin: ['http://localhost:8787', 'http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true
}));

/**
 * Health check endpoint
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'Cloudflare Images Private Images Example',
    endpoints: {
      uploadPrivate: 'POST /api/upload-private',
      signUrl: 'POST /api/sign-url',
      health: 'GET /'
    }
  });
});

/**
 * Upload private image
 *
 * POST /api/upload-private
 *
 * Uploads an image with requireSignedURLs: true
 *
 * Request (multipart/form-data):
 * - file: Image file
 *
 * Returns:
 * {
 *   "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901",
 *   "uploaded": true,
 *   "requireSignedURLs": true
 * }
 */
app.post('/api/upload-private', async (c) => {
  try {
    // Verify environment variables
    if (!c.env.CF_ACCOUNT_ID || !c.env.CF_API_TOKEN) {
      return c.json({
        error: 'Missing configuration',
        message: 'CF_ACCOUNT_ID and CF_API_TOKEN must be set'
      }, 500);
    }

    // Get file from form data
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({
        error: 'Missing file',
        message: 'Please provide a file in the form data'
      }, 400);
    }

    console.log('Uploading private image:', file.name);

    // Create upload form data
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('requireSignedURLs', 'true'); // ← KEY: Makes image private

    // Upload to Cloudflare Images
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_API_TOKEN}`
        },
        body: uploadFormData
      }
    );

    const result = await response.json<any>();

    if (!result.success) {
      console.error('Cloudflare API error:', result.errors);
      return c.json({
        error: 'Upload failed',
        details: result.errors
      }, 500);
    }

    console.log('Private image uploaded successfully. Image ID:', result.result.id);

    return c.json({
      imageId: result.result.id,
      uploaded: true,
      requireSignedURLs: true
    });

  } catch (error) {
    console.error('Error uploading private image:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Generate signed URL for private image
 *
 * POST /api/sign-url
 *
 * Body:
 * {
 *   "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901",
 *   "variant": "public",           // Optional, defaults to "public"
 *   "expirySeconds": 3600           // Optional, defaults to 1 hour
 * }
 *
 * Returns:
 * {
 *   "signedUrl": "https://imagedelivery.net/{hash}/{id}/public?exp=1234567890&sig=abc123...",
 *   "expiresAt": "2024-01-15T12:00:00Z",
 *   "expirySeconds": 3600
 * }
 */
app.post('/api/sign-url', async (c) => {
  try {
    // Verify environment variables
    if (!c.env.CF_ACCOUNT_HASH || !c.env.CF_IMAGES_SIGNING_KEY) {
      return c.json({
        error: 'Missing configuration',
        message: 'CF_ACCOUNT_HASH and CF_IMAGES_SIGNING_KEY must be set'
      }, 500);
    }

    // Parse request body
    const body = await c.req.json<{
      imageId: string;
      variant?: string;
      expirySeconds?: number;
    }>();

    const { imageId, variant = 'public', expirySeconds = 3600 } = body;

    if (!imageId) {
      return c.json({
        error: 'Missing imageId',
        message: 'Please provide imageId in request body'
      }, 400);
    }

    console.log('Generating signed URL for:', imageId, 'variant:', variant, 'expiry:', expirySeconds);

    // Generate expiry timestamp (Unix epoch)
    const expiry = Math.floor(Date.now() / 1000) + expirySeconds;

    // Generate signature using HMAC-SHA256
    // Format: imageId + "/" + variant + expiry
    const dataToSign = `${imageId}/${variant}${expiry}`;

    const signature = await sign(
      { data: dataToSign },
      c.env.CF_IMAGES_SIGNING_KEY,
      { algorithm: 'HS256' }
    );

    // Construct signed URL
    const signedUrl = `https://imagedelivery.net/${c.env.CF_ACCOUNT_HASH}/${imageId}/${variant}?exp=${expiry}&sig=${signature}`;

    console.log('Signed URL generated successfully');

    return c.json({
      signedUrl,
      expiresAt: new Date(expiry * 1000).toISOString(),
      expirySeconds
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
