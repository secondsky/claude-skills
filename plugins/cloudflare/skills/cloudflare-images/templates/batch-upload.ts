/**
 * Cloudflare Images - Batch API
 *
 * High-volume image uploads using batch tokens.
 *
 * When to use:
 * - Migrating thousands of images
 * - Bulk upload workflows
 * - Automated image ingestion
 *
 * IMPORTANT: Batch API uses different host and authentication
 * - Host: batch.imagedelivery.net (NOT api.cloudflare.com)
 * - Auth: Batch token (NOT regular API token)
 */

interface Env {
  IMAGES_BATCH_TOKEN: string; // From Dashboard → Images → Batch API
}

interface BatchUploadOptions {
  id?: string;
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
 * Upload single image via Batch API
 */
export async function batchUploadImage(
  file: File,
  options: BatchUploadOptions = {},
  env: Env
): Promise<CloudflareImagesResponse> {
  const formData = new FormData();

  formData.append('file', file);

  if (options.id) {
    formData.append('id', options.id);
  }

  if (options.requireSignedURLs !== undefined) {
    formData.append('requireSignedURLs', String(options.requireSignedURLs));
  }

  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  const response = await fetch('https://batch.imagedelivery.net/images/v1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.IMAGES_BATCH_TOKEN}`
    },
    body: formData
  });

  return response.json();
}

/**
 * Upload image via URL using Batch API
 */
export async function batchUploadViaURL(
  imageUrl: string,
  options: BatchUploadOptions = {},
  env: Env
): Promise<CloudflareImagesResponse> {
  const formData = new FormData();

  formData.append('url', imageUrl);

  if (options.id) {
    formData.append('id', options.id);
  }

  if (options.requireSignedURLs !== undefined) {
    formData.append('requireSignedURLs', String(options.requireSignedURLs));
  }

  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  const response = await fetch('https://batch.imagedelivery.net/images/v1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.IMAGES_BATCH_TOKEN}`
    },
    body: formData
  });

  return response.json();
}

/**
 * List images via Batch API
 */
export async function batchListImages(
  page: number = 1,
  perPage: number = 100,
  env: Env
): Promise<{ success: boolean; result?: { images: unknown[] } }> {
  const response = await fetch(
    `https://batch.imagedelivery.net/images/v2?page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': `Bearer ${env.IMAGES_BATCH_TOKEN}`
      }
    }
  );

  return response.json();
}

/**
 * Parallel batch upload (multiple images at once)
 */
export async function uploadMultipleImages(
  images: Array<{ file?: File; url?: string; id?: string; metadata?: Record<string, string> }>,
  concurrency: number = 5,
  env: Env
): Promise<Array<{ input: unknown; result?: CloudflareImagesResponse; error?: string }>> {
  const results: Array<{ input: unknown; result?: CloudflareImagesResponse; error?: string }> = [];
  const chunks: typeof images[] = [];

  // Split into chunks for parallel processing
  for (let i = 0; i < images.length; i += concurrency) {
    chunks.push(images.slice(i, i + concurrency));
  }

  // Process each chunk
  for (const chunk of chunks) {
    const promises = chunk.map(async (img) => {
      try {
        let result: CloudflareImagesResponse;

        if (img.file) {
          result = await batchUploadImage(img.file, { id: img.id, metadata: img.metadata }, env);
        } else if (img.url) {
          result = await batchUploadViaURL(img.url, { id: img.id, metadata: img.metadata }, env);
        } else {
          throw new Error('Must provide either file or url');
        }

        return { input: img, result };

      } catch (error) {
        return {
          input: img,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Migration helper: Bulk ingest from URLs
 */
export async function migrateImagesFromURLs(
  imageUrls: string[],
  options: {
    concurrency?: number;
    prefix?: string; // ID prefix for all images
    metadata?: Record<string, string>;
  } = {},
  env: Env
): Promise<{
  successful: number;
  failed: number;
  results: Array<{ url: string; id?: string; error?: string }>;
}> {
  const concurrency = options.concurrency || 5;
  const successful: string[] = [];
  const failed: string[] = [];
  const results: Array<{ url: string; id?: string; error?: string }> = [];

  const images = imageUrls.map((url, index) => ({
    url,
    id: options.prefix ? `${options.prefix}-${index}` : undefined,
    metadata: options.metadata
  }));

  const uploadResults = await uploadMultipleImages(images, concurrency, env);

  for (const result of uploadResults) {
    const input = result.input as { url: string; id?: string };

    if (result.error) {
      failed.push(input.url);
      results.push({ url: input.url, error: result.error });
    } else {
      successful.push(input.url);
      results.push({ url: input.url, id: result.result?.result?.id });
    }
  }

  return {
    successful: successful.length,
    failed: failed.length,
    results
  };
}

/**
 * Example Worker
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Bulk upload: POST /api/batch-upload
    if (request.method === 'POST' && url.pathname === '/api/batch-upload') {
      try {
        const body = await request.json<{ imageUrls: string[] }>();

        if (!body.imageUrls || !Array.isArray(body.imageUrls)) {
          return Response.json({ error: 'imageUrls array required' }, { status: 400 });
        }

        const result = await migrateImagesFromURLs(
          body.imageUrls,
          {
            concurrency: 5,
            prefix: 'migration',
            metadata: { source: 'bulk-upload' }
          },
          env
        );

        return Response.json(result);

      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Batch upload failed' },
          { status: 500 }
        );
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};

/**
 * Usage examples:
 *
 * ```typescript
 * // Single upload via Batch API
 * const result = await batchUploadImage(file, {
 *   metadata: { source: 'migration' }
 * }, env);
 *
 * // Upload from URL
 * const result = await batchUploadViaURL('https://example.com/image.jpg', {}, env);
 *
 * // Parallel upload multiple images
 * const images = [
 *   { file: file1, id: 'image-1' },
 *   { file: file2, id: 'image-2' },
 *   { url: 'https://example.com/image3.jpg', id: 'image-3' }
 * ];
 * const results = await uploadMultipleImages(images, 5, env);
 *
 * // Migrate from URLs
 * const urls = [
 *   'https://old-cdn.example.com/image1.jpg',
 *   'https://old-cdn.example.com/image2.jpg',
 *   // ... thousands more
 * ];
 * const migration = await migrateImagesFromURLs(urls, {
 *   concurrency: 10,
 *   prefix: 'migrated',
 *   metadata: { migratedAt: new Date().toISOString() }
 * }, env);
 *
 * console.log(`Successful: ${migration.successful}, Failed: ${migration.failed}`);
 * ```
 *
 * SETUP:
 * 1. Dashboard → Images → Batch API
 * 2. Create batch token
 * 3. Add to wrangler.toml: wrangler secret put IMAGES_BATCH_TOKEN
 *
 * DIFFERENCES FROM REGULAR API:
 * - Host: batch.imagedelivery.net (NOT api.cloudflare.com)
 * - Auth: Batch token (NOT regular API token)
 * - Same endpoints: /images/v1, /images/v2
 * - Rate limits may differ (contact Cloudflare for high-volume needs)
 */
