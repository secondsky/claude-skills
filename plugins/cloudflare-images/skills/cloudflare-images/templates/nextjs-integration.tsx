/**
 * Next.js 15 + Cloudflare Images Integration
 *
 * Complete integration for Next.js Image component with Cloudflare Images.
 * Works with both Pages Router and App Router.
 *
 * Features:
 * - Custom image loader for Next.js
 * - Reusable CloudflareImage component
 * - Server-side upload API route
 * - TypeScript support
 * - Format auto-detection (WebP/AVIF)
 * - Responsive images with srcset
 *
 * Setup:
 * 1. Add loader configuration to next.config.js
 * 2. Set environment variables
 * 3. Copy components to your project
 */

// ===== 1. next.config.js =====

/*
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
*/

// ===== 2. lib/cloudflare-image-loader.ts =====

/**
 * Custom image loader for Next.js Image component
 * Generates Cloudflare Images URLs with proper transformations
 */
export default function cloudflareLoader({
  src,
  width,
  quality
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = new URLSearchParams();
  params.set('width', width.toString());
  params.set('quality', (quality || 85).toString());
  params.set('format', 'auto'); // Automatic WebP/AVIF

  // Extract image ID from src (assuming src is the Cloudflare image ID)
  const imageId = src.startsWith('/') ? src.slice(1) : src;

  // Use custom domain or default imagedelivery.net
  const DOMAIN = process.env.NEXT_PUBLIC_CF_IMAGES_DOMAIN;
  const ACCOUNT_HASH = process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH;
  const VARIANT = process.env.NEXT_PUBLIC_CF_DEFAULT_VARIANT || 'public';

  if (DOMAIN) {
    // Custom domain (e.g., images.yourdomain.com)
    return `https://${DOMAIN}/${imageId}/${VARIANT}?${params}`;
  }

  // Default imagedelivery.net
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${VARIANT}?${params}`;
}

// ===== 3. .env.local =====

/*
# Cloudflare Images Configuration
NEXT_PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
# OR use default imagedelivery.net
NEXT_PUBLIC_CF_ACCOUNT_HASH=Vi7wi5KSItxGFsWRG2Us6Q
NEXT_PUBLIC_CF_DEFAULT_VARIANT=public

# Server-side only (for uploads)
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
*/

// ===== 4. components/CloudflareImage.tsx (App Router) =====

import Image, { ImageProps } from 'next/image';

interface CloudflareImageProps extends Omit<ImageProps, 'src' | 'loader'> {
  /**
   * Cloudflare Images ID
   * Example: "2cdc28f0-017a-49c4-9ed7-87056c83901"
   */
  imageId: string;

  /**
   * Variant name (optional)
   * Default: 'public'
   */
  variant?: string;
}

/**
 * CloudflareImage Component
 *
 * Wrapper around Next.js Image component for Cloudflare Images.
 * Automatically uses the custom loader configured in next.config.js.
 *
 * @example
 * <CloudflareImage
 *   imageId="2cdc28f0-017a-49c4-9ed7-87056c83901"
 *   alt="Product photo"
 *   width={800}
 *   height={600}
 *   priority
 * />
 */
export function CloudflareImage({
  imageId,
  variant = 'public',
  ...imageProps
}: CloudflareImageProps) {
  // src is just the image ID, loader handles the rest
  return <Image src={imageId} {...imageProps} />;
}

// ===== 5. app/api/upload/route.ts (Upload API Route) =====

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. Validate file
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 3. Upload to Cloudflare Images
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    // Optional: Add metadata
    const userId = request.headers.get('X-User-ID');
    if (userId) {
      cloudflareFormData.append(
        'metadata',
        JSON.stringify({
          userId,
          uploadedAt: new Date().toISOString(),
          source: 'nextjs-app'
        })
      );
    }

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`
        },
        body: cloudflareFormData
      }
    );

    const result = await uploadResponse.json();

    if (!result.success) {
      console.error('Cloudflare upload failed:', result.errors);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // 4. Return image info
    return NextResponse.json({
      success: true,
      imageId: result.result.id,
      variants: result.result.variants,
      filename: file.name,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ===== 6. app/upload/page.tsx (Upload Page Example) =====

'use client';

import { useState, FormEvent } from 'react';
import { CloudflareImage } from '@/components/CloudflareImage';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setError('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageId(result.imageId);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Image</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Select Image
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/*"
            required
            className="block w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        {error && <p className="text-red-600">{error}</p>}
      </form>

      {uploadedImageId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Uploaded Image</h2>
          <CloudflareImage
            imageId={uploadedImageId}
            alt="Uploaded image"
            width={800}
            height={600}
            className="rounded-lg"
          />
          <p className="mt-2 text-sm text-gray-600">Image ID: {uploadedImageId}</p>
        </div>
      )}
    </div>
  );
}

// ===== 7. app/gallery/page.tsx (Gallery Example) =====

import { CloudflareImage } from '@/components/CloudflareImage';

// This would typically come from your database
const galleryImages = [
  {
    id: '1',
    cloudflareId: '2cdc28f0-017a-49c4-9ed7-87056c83901',
    alt: 'Product 1',
    title: 'Modern Chair'
  },
  {
    id: '2',
    cloudflareId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    alt: 'Product 2',
    title: 'Wooden Table'
  }
  // Add more images...
];

export default function GalleryPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Image Gallery</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryImages.map((image) => (
          <div key={image.id} className="group">
            <CloudflareImage
              imageId={image.cloudflareId}
              alt={image.alt}
              width={400}
              height={300}
              className="rounded-lg shadow-lg group-hover:scale-105 transition-transform"
            />
            <h3 className="mt-2 font-semibold">{image.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 8. TypeScript Types =====

/*
// types/cloudflare-images.ts

export interface CloudflareImageMetadata {
  id: string;
  filename: string;
  uploaded: string;
  requireSignedURLs: boolean;
  variants: string[];
  metadata?: Record<string, string>;
}

export interface CloudflareUploadResult {
  success: boolean;
  result: CloudflareImageMetadata;
  errors?: Array<{ code: number; message: string }>;
}
*/

// ===== 9. Responsive Images with srcset =====

/*
// components/ResponsiveImage.tsx

import Image from 'next/image';

interface ResponsiveImageProps {
  imageId: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

export function ResponsiveImage({
  imageId,
  alt,
  sizes,
  priority = false
}: ResponsiveImageProps) {
  return (
    <Image
      src={imageId}
      alt={alt}
      width={1920}
      height={1080}
      sizes={sizes}
      priority={priority}
      className="w-full h-auto"
    />
  );
}

// Usage
<ResponsiveImage
  imageId="your-image-id"
  alt="Hero image"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority
/>
*/

// ===== 10. Server Component Example =====

/*
// app/product/[id]/page.tsx

import { CloudflareImage } from '@/components/CloudflareImage';
import { notFound } from 'next/navigation';

async function getProduct(id: string) {
  // Fetch from your database
  const product = await db.product.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!product) return null;

  return product;
}

export default async function ProductPage({
  params
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) notFound();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <CloudflareImage
            imageId={product.images[0].cloudflareId}
            alt={product.name}
            width={800}
            height={800}
            priority
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-4">{product.description}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-4">
        {product.images.slice(1).map((image: any) => (
          <CloudflareImage
            key={image.id}
            imageId={image.cloudflareId}
            alt={`${product.name} - Image ${image.id}`}
            width={200}
            height={200}
          />
        ))}
      </div>
    </div>
  );
}
*/
