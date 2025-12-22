/**
 * Cloudflare Images - Transform via Workers
 *
 * Use Workers to apply transformations programmatically with fetch() cf.image options.
 *
 * Benefits:
 * - Custom URL schemes (hide storage location)
 * - Preset names instead of pixel values
 * - Content negotiation (serve optimal format)
 * - Access control before serving
 */

interface Env {
  // Optional: If storing originals in R2
  IMAGES_BUCKET?: R2Bucket;
}

interface ImageTransformOptions {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  quality?: number; // 1-100
  format?: 'avif' | 'webp' | 'jpeg' | 'auto';
  gravity?: 'auto' | 'face' | 'left' | 'right' | 'top' | 'bottom' | string;
  blur?: number; // 1-250
  sharpen?: number; // 0-10
  rotate?: 0 | 90 | 180 | 270;
  flip?: 'h' | 'v' | 'hv';
  anim?: boolean;
  metadata?: 'none' | 'copyright' | 'keep';
  background?: string;
}

/**
 * Example 1: Custom URL schemes with preset names
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Custom URL: /images/thumbnail/photo.jpg
    if (url.pathname.startsWith('/images/thumbnail/')) {
      const imagePath = url.pathname.replace('/images/thumbnail/', '');
      const imageURL = `https://storage.example.com/${imagePath}`;

      return fetch(imageURL, {
        cf: {
          image: {
            width: 300,
            height: 300,
            fit: 'cover',
            quality: 85,
            format: 'auto'
          }
        }
      });
    }

    // Custom URL: /images/avatar/photo.jpg
    if (url.pathname.startsWith('/images/avatar/')) {
      const imagePath = url.pathname.replace('/images/avatar/', '');
      const imageURL = `https://storage.example.com/${imagePath}`;

      return fetch(imageURL, {
        cf: {
          image: {
            width: 200,
            height: 200,
            fit: 'cover',
            gravity: 'face', // Smart crop to face
            quality: 90,
            format: 'auto'
          }
        }
      });
    }

    // Custom URL: /images/large/photo.jpg
    if (url.pathname.startsWith('/images/large/')) {
      const imagePath = url.pathname.replace('/images/large/', '');
      const imageURL = `https://storage.example.com/${imagePath}`;

      return fetch(imageURL, {
        cf: {
          image: {
            width: 1920,
            quality: 85,
            format: 'auto'
          }
        }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

/**
 * Example 2: Content negotiation (serve optimal format)
 */
function getOptimalFormat(request: Request): 'avif' | 'webp' | 'auto' {
  const accept = request.headers.get('accept') || '';

  if (/image\/avif/.test(accept)) {
    return 'avif';
  } else if (/image\/webp/.test(accept)) {
    return 'webp';
  }

  return 'auto'; // Cloudflare decides
}

export const contentNegotiationWorker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');
    const imageURL = `https://storage.example.com/${imagePath}`;

    return fetch(imageURL, {
      cf: {
        image: {
          width: 800,
          quality: 85,
          format: getOptimalFormat(request)
        }
      }
    });
  }
};

/**
 * Example 3: Dynamic sizing based on query params
 */
export const dynamicSizeWorker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');
    const imageURL = `https://storage.example.com/${imagePath}`;

    // Parse query params: /images/photo.jpg?w=800&q=85
    const width = parseInt(url.searchParams.get('w') || '1920');
    const quality = parseInt(url.searchParams.get('q') || '85');

    // Validate
    const safeWidth = Math.min(Math.max(width, 100), 4000); // 100-4000px
    const safeQuality = Math.min(Math.max(quality, 10), 100); // 10-100

    return fetch(imageURL, {
      cf: {
        image: {
          width: safeWidth,
          quality: safeQuality,
          format: 'auto'
        }
      }
    });
  }
};

/**
 * Example 4: Access control before serving
 */
export const protectedImageWorker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Check authentication (example)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify token (simplified example)
    const token = authHeader.replace('Bearer ', '');
    if (token !== 'valid-token') {
      return new Response('Forbidden', { status: 403 });
    }

    // Serve image after auth check
    const imagePath = url.pathname.replace('/protected/', '');
    const imageURL = `https://storage.example.com/${imagePath}`;

    return fetch(imageURL, {
      cf: {
        image: {
          width: 800,
          quality: 85,
          format: 'auto'
        }
      }
    });
  }
};

/**
 * Example 5: R2 integration
 */
export const r2ImageWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.replace('/images/', '');

    // Get image from R2
    const object = await env.IMAGES_BUCKET?.get(key);
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // Transform and serve
    return fetch(new Request(url.toString(), {
      method: 'GET',
      body: object.body
    }), {
      cf: {
        image: {
          width: 800,
          quality: 85,
          format: 'auto'
        }
      }
    });
  }
};

/**
 * Example 6: Prevent transformation loops (error 9403)
 */
export const safeTransformWorker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ✅ CORRECT: Fetch external origin
    if (url.pathname.startsWith('/images/')) {
      const imagePath = url.pathname.replace('/images/', '');
      const originURL = `https://storage.example.com/${imagePath}`;

      return fetch(originURL, {
        cf: {
          image: {
            width: 800,
            quality: 85
          }
        }
      });
    }

    // ❌ WRONG: Don't fetch Worker's own URL (causes loop)
    // return fetch(request, { cf: { image: { width: 800 } } }); // ERROR 9403

    return new Response('Not found', { status: 404 });
  }
};

/**
 * Example 7: Error handling
 */
export const robustImageWorker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');
    const imageURL = `https://storage.example.com/${imagePath}`;

    try {
      // Verify origin returns image (prevent error 9412)
      const headResponse = await fetch(imageURL, { method: 'HEAD' });
      const contentType = headResponse.headers.get('content-type');

      if (!contentType?.startsWith('image/')) {
        return new Response('Not an image', { status: 400 });
      }

      // Transform
      const response = await fetch(imageURL, {
        cf: {
          image: {
            width: 800,
            quality: 85,
            format: 'auto'
          }
        }
      });

      // Check for transformation errors
      const cfResized = response.headers.get('Cf-Resized');
      if (cfResized?.includes('err=')) {
        console.error('Transformation error:', cfResized);
        return new Response('Image transformation failed', { status: 502 });
      }

      return response;

    } catch (error) {
      console.error('Image fetch error:', error);
      return new Response('Failed to fetch image', { status: 502 });
    }
  }
};

/**
 * Helper: Build transform options
 */
export function buildTransformOptions(
  preset: 'thumbnail' | 'avatar' | 'hero' | 'product',
  overrides?: Partial<ImageTransformOptions>
): ImageTransformOptions {
  const presets = {
    thumbnail: { width: 300, height: 300, fit: 'cover' as const, quality: 85 },
    avatar: { width: 200, height: 200, fit: 'cover' as const, gravity: 'face', quality: 90 },
    hero: { width: 1920, height: 1080, fit: 'cover' as const, quality: 85 },
    product: { width: 800, height: 800, fit: 'contain' as const, quality: 90, sharpen: 2 }
  };

  return {
    ...presets[preset],
    format: 'auto',
    ...overrides
  };
}

/**
 * CRITICAL ERROR CODES:
 *
 * - 9401: Invalid cf.image options
 * - 9402: Image too large or connection interrupted
 * - 9403: Request loop (Worker fetching itself)
 * - 9406/9419: Non-HTTPS URL or URL has spaces/unescaped Unicode
 * - 9412: Origin returned non-image (e.g., HTML error page)
 * - 9413: Image exceeds 100 megapixels
 *
 * Check 'Cf-Resized' header for error codes.
 */
