/**
 * Cloudflare Images - Transform via URL
 *
 * Transform images using the special URL format:
 * /cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
 *
 * Works on ANY publicly accessible image (not just Cloudflare Images storage).
 */

/**
 * URL Transformation Examples
 */

// Basic resize
const thumbnailURL = '/cdn-cgi/image/width=300,height=300,fit=cover/uploads/photo.jpg';

// Responsive with auto format (WebP/AVIF)
const responsiveURL = '/cdn-cgi/image/width=800,quality=85,format=auto/uploads/hero.jpg';

// Smart crop to face
const avatarURL = '/cdn-cgi/image/width=200,height=200,gravity=face,fit=cover/uploads/profile.jpg';

// Blur effect
const blurredURL = '/cdn-cgi/image/blur=20,quality=50/uploads/background.jpg';

// Sharpen
const sharpenedURL = '/cdn-cgi/image/sharpen=3,quality=90/uploads/product.jpg';

// Rotate and flip
const rotatedURL = '/cdn-cgi/image/rotate=90,flip=h/uploads/document.jpg';

/**
 * All available options (comma-separated)
 */
interface TransformOptions {
  // Sizing
  width?: number; // Max width in pixels (alias: w)
  height?: number; // Max height in pixels (alias: h)
  dpr?: number; // Device pixel ratio (1-3)

  // Fit modes
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';

  // Quality
  quality?: number; // 1-100 (alias: q)
  compression?: 'fast' | 'lossless'; // WebP only

  // Format
  format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'baseline-jpeg' | 'json';
  // 'auto' serves AVIF → WebP → original based on browser support

  // Cropping
  gravity?: 'auto' | 'face' | 'left' | 'right' | 'top' | 'bottom' | string; // Or 'XxY' coordinates
  zoom?: number; // 0-1 for face cropping
  trim?: number; // Remove border (pixels)

  // Effects
  blur?: number; // 1-250
  sharpen?: number; // 0-10
  brightness?: number; // 0-2 (1 = no change)
  contrast?: number; // 0-2 (1 = no change)
  gamma?: number; // 0-2 (1 = no change)

  // Rotation
  rotate?: 0 | 90 | 180 | 270;
  flip?: 'h' | 'v' | 'hv'; // Horizontal, vertical, both

  // Other
  background?: string; // CSS color for transparency/padding
  metadata?: 'none' | 'copyright' | 'keep'; // EXIF handling
  anim?: boolean; // Preserve GIF/WebP animation (default: true)
}

/**
 * Build transformation URL
 */
export function buildTransformURL(
  imagePath: string,
  options: Partial<TransformOptions>
): string {
  const params: string[] = [];

  // Sizing
  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.dpr) params.push(`dpr=${options.dpr}`);

  // Fit
  if (options.fit) params.push(`fit=${options.fit}`);

  // Quality
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.compression) params.push(`compression=${options.compression}`);

  // Format
  if (options.format) params.push(`format=${options.format}`);

  // Cropping
  if (options.gravity) params.push(`gravity=${options.gravity}`);
  if (options.zoom) params.push(`zoom=${options.zoom}`);
  if (options.trim) params.push(`trim=${options.trim}`);

  // Effects
  if (options.blur) params.push(`blur=${options.blur}`);
  if (options.sharpen) params.push(`sharpen=${options.sharpen}`);
  if (options.brightness) params.push(`brightness=${options.brightness}`);
  if (options.contrast) params.push(`contrast=${options.contrast}`);
  if (options.gamma) params.push(`gamma=${options.gamma}`);

  // Rotation
  if (options.rotate) params.push(`rotate=${options.rotate}`);
  if (options.flip) params.push(`flip=${options.flip}`);

  // Other
  if (options.background) params.push(`background=${encodeURIComponent(options.background)}`);
  if (options.metadata) params.push(`metadata=${options.metadata}`);
  if (options.anim === false) params.push('anim=false');

  return `/cdn-cgi/image/${params.join(',')}/${imagePath}`;
}

/**
 * Example HTML generation
 */
export function generateResponsiveHTML(imagePath: string, alt: string): string {
  return `
<img
  srcset="${buildTransformURL(imagePath, { width: 480, format: 'auto' })} 480w,
          ${buildTransformURL(imagePath, { width: 768, format: 'auto' })} 768w,
          ${buildTransformURL(imagePath, { width: 1920, format: 'auto' })} 1920w"
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="${buildTransformURL(imagePath, { width: 1920, format: 'auto' })}"
  alt="${alt}"
/>
  `.trim();
}

/**
 * Common presets
 */
export const presets = {
  thumbnail: (path: string) => buildTransformURL(path, {
    width: 300,
    height: 300,
    fit: 'cover',
    quality: 85,
    format: 'auto'
  }),

  avatar: (path: string) => buildTransformURL(path, {
    width: 200,
    height: 200,
    fit: 'cover',
    gravity: 'face',
    quality: 90,
    format: 'auto'
  }),

  hero: (path: string) => buildTransformURL(path, {
    width: 1920,
    height: 1080,
    fit: 'cover',
    quality: 85,
    format: 'auto'
  }),

  blurPlaceholder: (path: string) => buildTransformURL(path, {
    width: 50,
    quality: 10,
    blur: 20,
    format: 'webp'
  }),

  productImage: (path: string) => buildTransformURL(path, {
    width: 800,
    height: 800,
    fit: 'contain',
    quality: 90,
    sharpen: 2,
    format: 'auto'
  })
};

/**
 * Usage examples:
 *
 * ```html
 * <!-- Thumbnail -->
 * <img src="/cdn-cgi/image/width=300,height=300,fit=cover,quality=85,format=auto/uploads/photo.jpg" />
 *
 * <!-- Smart crop to face -->
 * <img src="/cdn-cgi/image/width=200,height=200,gravity=face,fit=cover/uploads/profile.jpg" />
 *
 * <!-- Blur effect for privacy -->
 * <img src="/cdn-cgi/image/blur=20,quality=50/uploads/document.jpg" />
 *
 * <!-- Responsive with srcset -->
 * <img
 *   srcset="/cdn-cgi/image/width=480,format=auto/uploads/hero.jpg 480w,
 *           /cdn-cgi/image/width=768,format=auto/uploads/hero.jpg 768w,
 *           /cdn-cgi/image/width=1920,format=auto/uploads/hero.jpg 1920w"
 *   sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
 *   src="/cdn-cgi/image/width=1920,format=auto/uploads/hero.jpg"
 * />
 * ```
 *
 * With helper functions:
 * ```typescript
 * const url = buildTransformURL('uploads/photo.jpg', {
 *   width: 800,
 *   quality: 85,
 *   format: 'auto'
 * });
 *
 * const html = generateResponsiveHTML('uploads/hero.jpg', 'Hero image');
 *
 * const thumbURL = presets.thumbnail('uploads/photo.jpg');
 * ```
 *
 * IMPORTANT:
 * - Must enable transformations on zone first (Dashboard → Images → Transformations)
 * - Works on any publicly accessible image (not just Cloudflare Images storage)
 * - Source image must use HTTPS (HTTP not supported)
 * - URL-encode special characters in paths
 */
