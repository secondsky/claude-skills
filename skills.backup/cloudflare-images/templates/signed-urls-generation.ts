/**
 * Cloudflare Images - Signed URLs Generation
 *
 * Generate time-limited, signed URLs for private images using HMAC-SHA256.
 *
 * URL format:
 * https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT>?exp=<EXPIRY>&sig=<SIGNATURE>
 */

interface Env {
  IMAGES_ACCOUNT_HASH: string;
  IMAGES_SIGNING_KEY: string; // From Dashboard → Images → Keys
}

/**
 * Generate signed URL for private image
 */
export async function generateSignedURL(
  imageId: string,
  variant: string,
  expirySeconds: number = 3600, // Default: 1 hour
  env: Env
): Promise<string> {
  // Calculate expiry timestamp
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + expirySeconds;

  // String to sign: {imageId}{variant}{expiry}
  const stringToSign = `${imageId}${variant}${expiry}`;

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.IMAGES_SIGNING_KEY);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert to hex string
  const sig = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Build signed URL
  return `https://imagedelivery.net/${env.IMAGES_ACCOUNT_HASH}/${imageId}/${variant}?exp=${expiry}&sig=${sig}`;
}

/**
 * Generate signed URL with absolute expiry time
 */
export async function generateSignedURLWithExpiry(
  imageId: string,
  variant: string,
  expiryDate: Date,
  env: Env
): Promise<string> {
  const expiry = Math.floor(expiryDate.getTime() / 1000);
  const stringToSign = `${imageId}${variant}${expiry}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.IMAGES_SIGNING_KEY);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const sig = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `https://imagedelivery.net/${env.IMAGES_ACCOUNT_HASH}/${imageId}/${variant}?exp=${expiry}&sig=${sig}`;
}

/**
 * Generate signed URLs for multiple variants
 */
export async function generateSignedURLsForVariants(
  imageId: string,
  variants: string[],
  expirySeconds: number,
  env: Env
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  for (const variant of variants) {
    urls[variant] = await generateSignedURL(imageId, variant, expirySeconds, env);
  }

  return urls;
}

/**
 * Example Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Generate signed URL: GET /api/signed-url/:imageId/:variant
    if (request.method === 'GET' && url.pathname.startsWith('/api/signed-url/')) {
      const parts = url.pathname.replace('/api/signed-url/', '').split('/');
      const [imageId, variant] = parts;

      if (!imageId || !variant) {
        return Response.json({ error: 'Missing imageId or variant' }, { status: 400 });
      }

      // Parse expiry (default 1 hour)
      const expirySeconds = parseInt(url.searchParams.get('expiry') || '3600');

      try {
        const signedURL = await generateSignedURL(imageId, variant, expirySeconds, env);

        return Response.json({
          signedURL,
          expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString()
        });

      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to generate signed URL' },
          { status: 500 }
        );
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};

/**
 * Common expiry presets
 */
export const expiryPresets = {
  fiveMinutes: 5 * 60,
  fifteenMinutes: 15 * 60,
  oneHour: 60 * 60,
  oneDay: 24 * 60 * 60,
  oneWeek: 7 * 24 * 60 * 60
};

/**
 * Generate signed URL with preset expiry
 */
export async function generateSignedURLPreset(
  imageId: string,
  variant: string,
  preset: keyof typeof expiryPresets,
  env: Env
): Promise<string> {
  return generateSignedURL(imageId, variant, expiryPresets[preset], env);
}

/**
 * Verify if URL signature is valid (for reference, Cloudflare handles verification)
 */
export async function verifySignature(
  imageId: string,
  variant: string,
  expiry: number,
  signature: string,
  env: Env
): Promise<boolean> {
  // Check if expired
  const now = Math.floor(Date.now() / 1000);
  if (expiry < now) {
    return false;
  }

  // Generate expected signature
  const stringToSign = `${imageId}${variant}${expiry}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.IMAGES_SIGNING_KEY);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedSig = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSig === signature;
}

/**
 * Usage examples:
 *
 * ```typescript
 * // Generate signed URL valid for 1 hour
 * const signedURL = await generateSignedURL(
 *   'image-id',
 *   'public',
 *   3600,
 *   env
 * );
 * // https://imagedelivery.net/{hash}/{id}/public?exp=1234567890&sig=abc123...
 *
 * // Generate with specific expiry date
 * const expiryDate = new Date('2025-10-27T18:00:00Z');
 * const signedURL = await generateSignedURLWithExpiry(
 *   'image-id',
 *   'public',
 *   expiryDate,
 *   env
 * );
 *
 * // Generate for multiple variants
 * const urls = await generateSignedURLsForVariants(
 *   'image-id',
 *   ['thumbnail', 'medium', 'large'],
 *   3600,
 *   env
 * );
 * // { thumbnail: 'https://...', medium: 'https://...', large: 'https://...' }
 *
 * // Use preset expiry
 * const signedURL = await generateSignedURLPreset(
 *   'image-id',
 *   'public',
 *   'oneDay',
 *   env
 * );
 * ```
 *
 * REQUIREMENTS:
 * - Image must be uploaded with requireSignedURLs=true
 * - Get signing key from Dashboard → Images → Keys
 * - CANNOT use flexible variants with signed URLs (use named variants only)
 *
 * WHEN TO USE:
 * - User profile photos (private until shared)
 * - Paid content (time-limited access)
 * - Temporary downloads
 * - Secure image delivery
 */
