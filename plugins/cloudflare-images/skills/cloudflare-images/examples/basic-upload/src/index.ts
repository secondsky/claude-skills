/**
 * Basic Upload Example - Cloudflare Worker
 *
 * Generates one-time upload URLs for Direct Creator Upload pattern.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_HASH: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration - Allow frontend to call API
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
    service: 'Cloudflare Images Basic Upload Example',
    endpoints: {
      uploadUrl: 'POST /api/upload-url',
      health: 'GET /'
    }
  });
});

/**
 * Generate one-time upload URL
 *
 * POST /api/upload-url
 *
 * Returns:
 * {
 *   "uploadURL": "https://upload.imagedelivery.net/...",
 *   "imageId": "2cdc28f0-017a-49c4-9ed7-87056c83901"
 * }
 */
app.post('/api/upload-url', async (c) => {
  try {
    // Verify environment variables are set
    if (!c.env.CF_ACCOUNT_ID || !c.env.CF_API_TOKEN) {
      return c.json({
        error: 'Missing configuration',
        message: 'CF_ACCOUNT_ID and CF_API_TOKEN must be set'
      }, 500);
    }

    console.log('Generating upload URL for account:', c.env.CF_ACCOUNT_ID.substring(0, 8) + '...');

    // Request one-time upload URL from Cloudflare Images API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false,
          metadata: {
            source: 'basic-upload-example',
            timestamp: new Date().toISOString()
          }
        })
      }
    );

    const result = await response.json<any>();

    if (!result.success) {
      console.error('Cloudflare API error:', result.errors);
      return c.json({
        error: 'Failed to generate upload URL',
        details: result.errors
      }, 500);
    }

    console.log('Upload URL generated successfully. Image ID:', result.result.id);

    // Return upload URL and image ID to frontend
    return c.json({
      uploadURL: result.result.uploadURL,
      imageId: result.result.id
    });

  } catch (error) {
    console.error('Error generating upload URL:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
