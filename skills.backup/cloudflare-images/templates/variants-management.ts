/**
 * Cloudflare Images - Variants Management
 *
 * Create, list, update, and delete image variants.
 * Variants define predefined transformations for different use cases.
 */

interface Env {
  IMAGES_ACCOUNT_ID: string;
  IMAGES_API_TOKEN: string;
}

interface VariantOptions {
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  width?: number;
  height?: number;
  metadata?: 'none' | 'copyright' | 'keep';
}

interface Variant {
  id: string;
  options: VariantOptions;
  neverRequireSignedURLs?: boolean;
}

/**
 * Create a new variant
 */
export async function createVariant(
  id: string,
  options: VariantOptions,
  neverRequireSignedURLs: boolean = false,
  env: Env
): Promise<{ success: boolean; result?: Variant }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/variants`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        options,
        neverRequireSignedURLs
      })
    }
  );

  return response.json();
}

/**
 * List all variants
 */
export async function listVariants(
  env: Env
): Promise<{ success: boolean; result?: { variants: Variant[] } }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/variants`,
    {
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
      }
    }
  );

  return response.json();
}

/**
 * Get a specific variant
 */
export async function getVariant(
  id: string,
  env: Env
): Promise<{ success: boolean; result?: Variant }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/variants/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
      }
    }
  );

  return response.json();
}

/**
 * Update a variant
 */
export async function updateVariant(
  id: string,
  options: VariantOptions,
  neverRequireSignedURLs?: boolean,
  env: Env
): Promise<{ success: boolean; result?: Variant }> {
  const body: Record<string, unknown> = { options };
  if (neverRequireSignedURLs !== undefined) {
    body.neverRequireSignedURLs = neverRequireSignedURLs;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/variants/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  return response.json();
}

/**
 * Delete a variant
 */
export async function deleteVariant(
  id: string,
  env: Env
): Promise<{ success: boolean }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/variants/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`
      }
    }
  );

  return response.json();
}

/**
 * Enable flexible variants (dynamic transformations)
 */
export async function enableFlexibleVariants(
  enabled: boolean,
  env: Env
): Promise<{ success: boolean }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.IMAGES_ACCOUNT_ID}/images/v1/config`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flexible_variants: enabled
      })
    }
  );

  return response.json();
}

/**
 * Example Worker endpoint
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Create variant: POST /api/variants
    if (request.method === 'POST' && url.pathname === '/api/variants') {
      try {
        const body = await request.json<{
          id: string;
          width?: number;
          height?: number;
          fit?: string;
        }>();

        const result = await createVariant(
          body.id,
          {
            width: body.width,
            height: body.height,
            fit: body.fit as VariantOptions['fit'],
            metadata: 'none'
          },
          false,
          env
        );

        return Response.json(result);

      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to create variant' },
          { status: 500 }
        );
      }
    }

    // List variants: GET /api/variants
    if (request.method === 'GET' && url.pathname === '/api/variants') {
      const result = await listVariants(env);
      return Response.json(result);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};

/**
 * Common variant presets
 */
export async function setupCommonVariants(env: Env): Promise<void> {
  // Thumbnail
  await createVariant('thumbnail', {
    width: 300,
    height: 300,
    fit: 'cover',
    metadata: 'none'
  }, false, env);

  // Avatar
  await createVariant('avatar', {
    width: 200,
    height: 200,
    fit: 'cover',
    metadata: 'none'
  }, false, env);

  // Small
  await createVariant('small', {
    width: 480,
    fit: 'scale-down',
    metadata: 'none'
  }, false, env);

  // Medium
  await createVariant('medium', {
    width: 768,
    fit: 'scale-down',
    metadata: 'none'
  }, false, env);

  // Large
  await createVariant('large', {
    width: 1920,
    fit: 'scale-down',
    metadata: 'none'
  }, false, env);

  // Hero (wide)
  await createVariant('hero', {
    width: 1920,
    height: 1080,
    fit: 'cover',
    metadata: 'none'
  }, false, env);

  // Product (square)
  await createVariant('product', {
    width: 800,
    height: 800,
    fit: 'contain',
    metadata: 'none'
  }, false, env);
}

/**
 * Usage examples:
 *
 * ```typescript
 * // Create a variant
 * await createVariant('thumbnail', {
 *   width: 300,
 *   height: 300,
 *   fit: 'cover',
 *   metadata: 'none'
 * }, false, env);
 *
 * // List all variants
 * const { result } = await listVariants(env);
 * console.log(result?.variants);
 *
 * // Update a variant
 * await updateVariant('thumbnail', {
 *   width: 350, // Changed from 300
 *   height: 350,
 *   fit: 'cover'
 * }, undefined, env);
 *
 * // Delete a variant
 * await deleteVariant('old-variant', env);
 *
 * // Enable flexible variants (dynamic transformations)
 * await enableFlexibleVariants(true, env);
 * // Now can use: /w=400,sharpen=3 in URLs
 *
 * // Use variant in image URL
 * const imageURL = `https://imagedelivery.net/${accountHash}/${imageId}/thumbnail`;
 * ```
 *
 * LIMITS:
 * - Maximum 100 named variants per account
 * - Flexible variants: unlimited dynamic transformations (but can't use with signed URLs)
 *
 * WHEN TO USE:
 * - Named variants: Consistent sizes, private images (signed URLs), predictable URLs
 * - Flexible variants: Dynamic sizing, public images only, rapid prototyping
 */
