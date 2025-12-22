/**
 * Cloudflare Images - Upload via URL
 *
 * Ingest images from external URLs without downloading first.
 *
 * Use cases:
 * - Migrating images from another service
 * - Ingesting user-provided URLs
 * - Backing up images from external sources
 */

interface Env {
  IMAGES_ACCOUNT_ID: string;
  IMAGES_API_TOKEN: string;
}

interface UploadViaURLOptions {
  url: string; // Image URL to ingest
  id?: string; // Custom ID (optional)
  requireSignedURLs?: boolean;
  metadata?: Record<string, string>;
}

interface CloudflareImagesResponse {
  success: boolean;
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  errors?: Array<{ code: number; message: string }>;
}

/**
 * Upload image from external URL
 */
export async function uploadImageViaURL(
  options: UploadViaURLOptions,
  env: Env
): Promise<CloudflareImagesResponse> {
  const formData = new FormData();

  // Required: URL to ingest
  formData.append('url', options.url);

  // Optional: Custom ID
  if (options.id) {
    formData.append('id', options.id);
  }

  // Optional: Require signed URLs
  if (options.requireSignedURLs !== undefined) {
    formData.append('requireSignedURLs', String(options.requireSignedURLs));
  }

  // Optional: Metadata
  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
      },
      body: formData
    }
  );

  const result: CloudflareImagesResponse = await response.json();

  if (!result.success) {
    console.error('Upload via URL failed:', result.errors);
    throw new Error(`Upload via URL failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
  }

  return result;
}

/**
 * Example Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint: POST /ingest-image
    if (request.method === 'POST' && url.pathname === '/ingest-image') {
      try {
        const body = await request.json<{ imageUrl: string }>();

        if (!body.imageUrl) {
          return Response.json({ error: 'imageUrl required' }, { status: 400 });
        }

        // Validate URL format
        try {
          new URL(body.imageUrl);
        } catch {
          return Response.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Upload from external URL
        const result = await uploadImageViaURL(
          {
            url: body.imageUrl,
            metadata: {
              source: 'external',
              ingestedAt: new Date().toISOString()
            }
          },
          env
        );

        return Response.json({
          success: true,
          imageId: result.result?.id,
          variants: result.result?.variants
        });

      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Ingestion failed' },
          { status: 500 }
        );
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};

/**
 * Batch ingestion example
 */
export async function batchIngestImages(
  imageUrls: string[],
  env: Env
): Promise<Array<{ url: string; result?: CloudflareImagesResponse; error?: string }>> {
  const results = await Promise.allSettled(
    imageUrls.map(async (url) => {
      return {
        url,
        result: await uploadImageViaURL({ url }, env)
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        url: imageUrls[index],
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
      };
    }
  });
}

/**
 * Example with authentication for private origins
 */
export async function uploadFromPrivateURL(
  imageUrl: string,
  username: string,
  password: string,
  env: Env
): Promise<CloudflareImagesResponse> {
  // Cloudflare supports HTTP Basic Auth in URL
  const urlObj = new URL(imageUrl);
  const authenticatedURL = `${urlObj.protocol}//${username}:${password}@${urlObj.host}${urlObj.pathname}${urlObj.search}`;

  return uploadImageViaURL({ url: authenticatedURL }, env);
}

/**
 * Usage examples:
 *
 * ```typescript
 * // Single image
 * const result = await uploadImageViaURL({
 *   url: 'https://example.com/photo.jpg',
 *   metadata: { source: 'migration' }
 * }, env);
 *
 * // Batch ingestion
 * const urls = [
 *   'https://example.com/photo1.jpg',
 *   'https://example.com/photo2.jpg',
 *   'https://example.com/photo3.jpg'
 * ];
 * const results = await batchIngestImages(urls, env);
 *
 * // Private origin with auth
 * const result = await uploadFromPrivateURL(
 *   'https://private-storage.example.com/image.jpg',
 *   'username',
 *   'password',
 *   env
 * );
 * ```
 */
