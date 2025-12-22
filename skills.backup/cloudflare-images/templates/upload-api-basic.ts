/**
 * Cloudflare Images - Basic Upload via API
 *
 * Uploads an image file to Cloudflare Images storage.
 *
 * Usage:
 *   const result = await uploadImageToCloudflare(file, {
 *     requireSignedURLs: false,
 *     metadata: { userId: '12345' }
 *   });
 */

interface Env {
  IMAGES_ACCOUNT_ID: string;
  IMAGES_API_TOKEN: string;
}

interface UploadOptions {
  id?: string; // Custom ID (optional, auto-generated if not provided)
  requireSignedURLs?: boolean; // true for private images
  metadata?: Record<string, string>; // Max 1024 bytes, not visible to end users
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
 * Upload image to Cloudflare Images
 */
export async function uploadImageToCloudflare(
  file: File,
  options: UploadOptions = {},
  env: Env
): Promise<CloudflareImagesResponse> {
  const formData = new FormData();

  // Required: File to upload
  formData.append('file', file);

  // Optional: Custom ID (if not provided, auto-generated)
  if (options.id) {
    formData.append('id', options.id);
  }

  // Optional: Require signed URLs for private images
  if (options.requireSignedURLs !== undefined) {
    formData.append('requireSignedURLs', String(options.requireSignedURLs));
  }

  // Optional: Metadata (JSON object, max 1024 bytes)
  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  // Upload to Cloudflare Images API
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
        // Don't set Content-Type - FormData sets it automatically with boundary
      },
      body: formData
    }
  );

  const result: CloudflareImagesResponse = await response.json();

  if (!result.success) {
    console.error('Upload failed:', result.errors);
    throw new Error(`Upload failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
  }

  return result;
}

/**
 * Example Cloudflare Worker endpoint
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST' && new URL(request.url).pathname === '/upload') {
      try {
        // Parse multipart/form-data from request
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
          return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Upload to Cloudflare Images
        const result = await uploadImageToCloudflare(
          file,
          {
            requireSignedURLs: false,
            metadata: {
              uploadedBy: 'worker',
              timestamp: new Date().toISOString()
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
          { error: error instanceof Error ? error.message : 'Upload failed' },
          { status: 500 }
        );
      }
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

/**
 * Example usage from another script:
 *
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
 * const file = fileInput.files?.[0];
 *
 * if (file) {
 *   const result = await uploadImageToCloudflare(file, {
 *     requireSignedURLs: false,
 *     metadata: { source: 'user-upload' }
 *   }, env);
 *
 *   console.log('Uploaded:', result.result?.id);
 *   console.log('Serve at:', result.result?.variants[0]);
 * }
 * ```
 */
