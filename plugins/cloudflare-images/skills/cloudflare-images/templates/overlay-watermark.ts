/**
 * Image Watermarking with Canvas API
 *
 * Complete implementation for adding watermarks and overlays to images
 * before uploading to Cloudflare Images.
 *
 * Features:
 * - Text watermarks (copyright notices)
 * - Logo watermarks (PNG overlays)
 * - Customizable position and opacity
 * - Multiple watermark styles
 * - Server-side (Node.js) and client-side (Browser) support
 *
 * Usage:
 * 1. Add watermark to image file
 * 2. Upload watermarked image to Cloudflare Images
 */

// ===== Browser Implementation =====

/**
 * Add text watermark to image (Browser)
 *
 * @param imageFile - Original image file
 * @param watermarkText - Text to display (e.g., "© 2025 Your Company")
 * @param options - Watermark options
 * @returns Watermarked image as Blob
 */
export async function addTextWatermark(
  imageFile: File,
  watermarkText: string,
  options: TextWatermarkOptions = {}
): Promise<Blob> {
  const {
    position = 'bottom-right',
    fontSize = 24,
    fontFamily = 'Arial',
    textColor = '#FFFFFF',
    backgroundColor = 'rgba(0, 0, 0, 0.5)',
    padding = 10,
    borderRadius = 3
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Load image
  const img = await createImageBitmap(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Set font
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const textMetrics = ctx.measureText(watermarkText);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Calculate position
  const { x, y } = calculatePosition(
    canvas.width,
    canvas.height,
    textWidth + padding * 2,
    textHeight + padding * 2,
    position
  );

  // Draw background
  ctx.fillStyle = backgroundColor;
  if (borderRadius > 0) {
    roundRect(ctx, x, y, textWidth + padding * 2, textHeight + padding * 2, borderRadius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, textWidth + padding * 2, textHeight + padding * 2);
  }

  // Draw text
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  ctx.fillText(watermarkText, x + padding, y + padding);

  // Convert to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

/**
 * Add logo watermark to image (Browser)
 *
 * @param imageFile - Original image file
 * @param logoUrl - URL or data URL of logo image
 * @param options - Watermark options
 * @returns Watermarked image as Blob
 */
export async function addLogoWatermark(
  imageFile: File,
  logoUrl: string,
  options: LogoWatermarkOptions = {}
): Promise<Blob> {
  const {
    position = 'bottom-right',
    size = 0.15, // Logo size as percentage of image width (15%)
    opacity = 0.5,
    padding = 20
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Load main image
  const img = await createImageBitmap(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Load logo
  const logo = new Image();
  logo.src = logoUrl;
  await logo.decode();

  // Calculate logo dimensions
  const logoWidth = canvas.width * size;
  const logoHeight = (logo.height / logo.width) * logoWidth;

  // Calculate position
  const { x, y } = calculatePosition(
    canvas.width,
    canvas.height,
    logoWidth,
    logoHeight,
    position,
    padding
  );

  // Draw logo with opacity
  ctx.globalAlpha = opacity;
  ctx.drawImage(logo, x, y, logoWidth, logoHeight);
  ctx.globalAlpha = 1.0;

  // Convert to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

/**
 * Add tiled watermark pattern (Browser)
 *
 * @param imageFile - Original image file
 * @param watermarkText - Text to tile across image
 * @param options - Watermark options
 * @returns Watermarked image as Blob
 */
export async function addTiledWatermark(
  imageFile: File,
  watermarkText: string,
  options: TiledWatermarkOptions = {}
): Promise<Blob> {
  const {
    fontSize = 48,
    opacity = 0.15,
    angle = -45, // Diagonal
    spacing = 200
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Load image
  const img = await createImageBitmap(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Configure watermark style
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = opacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate grid
  const angleRad = (angle * Math.PI) / 180;
  const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

  // Draw tiled watermark
  for (let x = -diagonal; x < diagonal * 2; x += spacing) {
    for (let y = -diagonal; y < diagonal * 2; y += spacing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleRad);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    }
  }

  ctx.globalAlpha = 1.0;

  // Convert to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

// ===== Helper Functions =====

interface Position {
  x: number;
  y: number;
}

type PositionType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

function calculatePosition(
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number,
  elementHeight: number,
  position: PositionType,
  padding: number = 10
): Position {
  const positions: Record<PositionType, Position> = {
    'top-left': {
      x: padding,
      y: padding
    },
    'top-center': {
      x: (canvasWidth - elementWidth) / 2,
      y: padding
    },
    'top-right': {
      x: canvasWidth - elementWidth - padding,
      y: padding
    },
    'center-left': {
      x: padding,
      y: (canvasHeight - elementHeight) / 2
    },
    center: {
      x: (canvasWidth - elementWidth) / 2,
      y: (canvasHeight - elementHeight) / 2
    },
    'center-right': {
      x: canvasWidth - elementWidth - padding,
      y: (canvasHeight - elementHeight) / 2
    },
    'bottom-left': {
      x: padding,
      y: canvasHeight - elementHeight - padding
    },
    'bottom-center': {
      x: (canvasWidth - elementWidth) / 2,
      y: canvasHeight - elementHeight - padding
    },
    'bottom-right': {
      x: canvasWidth - elementWidth - padding,
      y: canvasHeight - elementHeight - padding
    }
  };

  return positions[position];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ===== TypeScript Interfaces =====

interface TextWatermarkOptions {
  position?: PositionType;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
}

interface LogoWatermarkOptions {
  position?: PositionType;
  size?: number; // 0-1 (percentage of image width)
  opacity?: number; // 0-1
  padding?: number;
}

interface TiledWatermarkOptions {
  fontSize?: number;
  opacity?: number; // 0-1
  angle?: number; // Rotation in degrees
  spacing?: number; // Distance between watermarks
}

// ===== Upload to Cloudflare Images =====

/**
 * Upload watermarked image to Cloudflare Images
 *
 * @param watermarkedBlob - Watermarked image blob
 * @param filename - Original filename
 * @param accountId - Cloudflare account ID
 * @param apiToken - Cloudflare API token
 * @returns Upload result
 */
export async function uploadWatermarkedImage(
  watermarkedBlob: Blob,
  filename: string,
  accountId: string,
  apiToken: string
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', watermarkedBlob, filename);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`
        },
        body: formData
      }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        imageId: result.result.id
      };
    } else {
      return {
        success: false,
        error: 'Upload failed'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Internal error'
    };
  }
}

// ===== Complete Workflow Example =====

/**
 * Complete workflow: Add watermark and upload to Cloudflare Images
 *
 * @example
 * const file = fileInput.files[0];
 * const result = await watermarkAndUpload(file, {
 *   watermarkType: 'text',
 *   watermarkText: '© 2025 Your Company',
 *   accountId: 'your-account-id',
 *   apiToken: 'your-api-token'
 * });
 *
 * if (result.success) {
 *   console.log('Image uploaded:', result.imageId);
 * }
 */
export async function watermarkAndUpload(
  imageFile: File,
  options: WatermarkAndUploadOptions
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    let watermarkedBlob: Blob;

    // Add watermark based on type
    switch (options.watermarkType) {
      case 'text':
        watermarkedBlob = await addTextWatermark(
          imageFile,
          options.watermarkText || '© Your Company',
          options.textOptions
        );
        break;

      case 'logo':
        if (!options.logoUrl) {
          return { success: false, error: 'Logo URL required' };
        }
        watermarkedBlob = await addLogoWatermark(
          imageFile,
          options.logoUrl,
          options.logoOptions
        );
        break;

      case 'tiled':
        watermarkedBlob = await addTiledWatermark(
          imageFile,
          options.watermarkText || '© Your Company',
          options.tiledOptions
        );
        break;

      default:
        return { success: false, error: 'Invalid watermark type' };
    }

    // Upload to Cloudflare Images
    return await uploadWatermarkedImage(
      watermarkedBlob,
      imageFile.name,
      options.accountId,
      options.apiToken
    );
  } catch (error) {
    console.error('Watermark and upload error:', error);
    return { success: false, error: 'Processing failed' };
  }
}

interface WatermarkAndUploadOptions {
  watermarkType: 'text' | 'logo' | 'tiled';
  watermarkText?: string;
  logoUrl?: string;
  textOptions?: TextWatermarkOptions;
  logoOptions?: LogoWatermarkOptions;
  tiledOptions?: TiledWatermarkOptions;
  accountId: string;
  apiToken: string;
}

// ===== Usage Examples =====

/*
// Example 1: Text Watermark (Bottom-Right)
const file = fileInput.files[0];
const watermarked = await addTextWatermark(file, '© 2025 Your Company', {
  position: 'bottom-right',
  fontSize: 20,
  textColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  padding: 10,
  borderRadius: 5
});

// Example 2: Logo Watermark (Bottom-Right)
const watermarked = await addLogoWatermark(file, '/logo.png', {
  position: 'bottom-right',
  size: 0.15,
  opacity: 0.5,
  padding: 20
});

// Example 3: Tiled Watermark
const watermarked = await addTiledWatermark(file, 'CONFIDENTIAL', {
  fontSize: 60,
  opacity: 0.1,
  angle: -45,
  spacing: 250
});

// Example 4: Complete Workflow
const result = await watermarkAndUpload(file, {
  watermarkType: 'text',
  watermarkText: '© 2025 Your Company. All Rights Reserved.',
  textOptions: {
    position: 'bottom-right',
    fontSize: 18
  },
  accountId: process.env.CF_ACCOUNT_ID,
  apiToken: process.env.CF_API_TOKEN
});

if (result.success) {
  console.log('Upload successful!', result.imageId);
}
*/

// ===== Server-Side Implementation (Node.js with Sharp) =====

/*
import sharp from 'sharp';
import { readFile } from 'fs/promises';

// Add text watermark using Sharp (Node.js)
async function addTextWatermarkServer(
  imagePath: string,
  watermarkText: string,
  outputPath: string
): Promise<void> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Create SVG text overlay
  const svgWatermark = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <style>
        .watermark {
          fill: white;
          font-size: 24px;
          font-weight: bold;
          font-family: Arial;
        }
      </style>
      <rect x="${metadata.width! - 300}" y="${metadata.height! - 50}"
            width="280" height="40" rx="5" fill="rgba(0,0,0,0.5)"/>
      <text x="${metadata.width! - 160}" y="${metadata.height! - 20}"
            text-anchor="middle" class="watermark">
        ${watermarkText}
      </text>
    </svg>
  `;

  await image
    .composite([
      {
        input: Buffer.from(svgWatermark),
        top: 0,
        left: 0
      }
    ])
    .toFile(outputPath);
}

// Add logo watermark using Sharp (Node.js)
async function addLogoWatermarkServer(
  imagePath: string,
  logoPath: string,
  outputPath: string
): Promise<void> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  const logo = await sharp(logoPath)
    .resize({ width: Math.floor(metadata.width! * 0.15) })
    .toBuffer();

  await image
    .composite([
      {
        input: logo,
        gravity: 'southeast',
        blend: 'over'
      }
    ])
    .toFile(outputPath);
}
*/
