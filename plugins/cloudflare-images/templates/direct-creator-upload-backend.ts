/**
 * Cloudflare Images - Direct Creator Upload (Backend)
 *
 * Generate one-time upload URLs for users to upload directly to Cloudflare.
 *
 * Architecture:
 * 1. Frontend requests upload URL from this backend
 * 2. Backend calls Cloudflare /direct_upload API
 * 3. Backend returns uploadURL to frontend
 * 4. Frontend uploads directly to Cloudflare using uploadURL
 *
 * Benefits:
 * - No API key exposure to browser
 * - Users upload directly to Cloudflare (faster)
 * - No intermediary storage needed
 */

interface Env {
  IMAGES_ACCOUNT_ID: string;
  IMAGES_API_TOKEN: string;
}

interface DirectUploadOptions {
  requireSignedURLs?: boolean;
  metadata?: Record<string, string>;
  expiry?: string; // ISO 8601 format (default: 30min, max: 6hr)
  id?: string; // Custom ID (optional)
}

interface DirectUploadResponse {
  success: boolean;
  result?: {
    id: string; // Image ID that will be uploaded
    uploadURL: string; // One-time upload URL for frontend
  };
  errors?: Array<{ code: number; message: string }>;
}

/**
 * Generate one-time upload URL
 */
export async function generateUploadURL(
  options: DirectUploadOptions = {},
  env: Env
): Promise<DirectUploadResponse> {
  const requestBody: Record<string, unknown> = {};

  // Optional: Require signed URLs for private images
  if (options.requireSignedURLs !== undefined) {
    requestBody.requireSignedURLs = options.requireSignedURLs;
  }

  // Optional: Metadata (attached to image, not visible to end users)
  if (options.metadata) {
    requestBody.metadata = options.metadata;
  }

  // Optional: Expiry (default 30min, max 6hr from now)
  if (options.expiry) {
    requestBody.expiry = options.expiry;
  }

  // Optional: Custom ID (cannot use with requireSignedURLs=true)
  if (options.id) {
    requestBody.id = options.id;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  const result: DirectUploadResponse = await response.json();

  if (!result.success) {
    console.error('Failed to generate upload URL:', result.errors);
    throw new Error(`Failed to generate upload URL: ${result.errors?.[0]?.message || 'Unknown error'}`);
  }

  return result;
}

/**
 * Example Cloudflare Worker endpoint
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Replace with your domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Endpoint: POST /api/upload-url
    if (request.method === 'POST' && url.pathname === '/api/upload-url') {
      try {
        const body = await request.json<{
          userId?: string;
          requireSignedURLs?: boolean;
        }>();

        // Generate upload URL
        const result = await generateUploadURL(
          {
            requireSignedURLs: body.requireSignedURLs ?? false,
            metadata: {
              userId: body.userId || 'anonymous',
              uploadedAt: new Date().toISOString()
            },
            // Set expiry: 1 hour from now
            expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          },
          env
        );

        return Response.json(
          {
            success: true,
            uploadURL: result.result?.uploadURL,
            imageId: result.result?.id
          },
          { headers: corsHeaders }
        );

      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to generate upload URL' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};

/**
 * Check upload status (useful with webhooks)
 */
export async function checkImageStatus(
  imageId: string,
  env: Env
): Promise<{
  success: boolean;
  result?: {
    id: string;
    uploaded: string;
    draft?: boolean; // true if upload not completed yet
    variants?: string[];
  };
}> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
      }
    }
  );

  return response.json();
}

/**
 * Usage example:
 *
 * Frontend calls this endpoint:
 * ```javascript
 * const response = await fetch('/api/upload-url', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ userId: '12345' })
 * });
 * const { uploadURL, imageId } = await response.json();
 *
 * // Now frontend can upload directly to uploadURL
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]); // MUST be named 'file'
 *
 * await fetch(uploadURL, {
 *   method: 'POST',
 *   body: formData // NO Content-Type header
 * });
 * ```
 *
 * Custom expiry:
 * ```typescript
 * const result = await generateUploadURL({
 *   expiry: new Date('2025-10-26T18:00:00Z').toISOString(), // Specific time
 *   metadata: { purpose: 'profile-photo' }
 * }, env);
 * ```
 */
