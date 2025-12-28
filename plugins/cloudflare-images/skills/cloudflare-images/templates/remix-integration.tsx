/**
 * Remix + Cloudflare Images Integration
 *
 * Complete integration for Remix with Cloudflare Images.
 * Works with Remix loaders, actions, and components.
 *
 * Features:
 * - Reusable CloudflareImage component
 * - Server-side upload action
 * - Image gallery with loader
 * - TypeScript support
 * - Progressive enhancement
 *
 * Setup:
 * 1. Set environment variables
 * 2. Copy components and routes to your project
 * 3. Configure database (optional)
 */

// ===== 1. .env =====

/*
# Cloudflare Images Configuration
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
CF_ACCOUNT_HASH=your_account_hash

# Public (exposed to browser)
PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
# OR
PUBLIC_CF_ACCOUNT_HASH=your_account_hash
*/

// ===== 2. app/components/CloudflareImage.tsx =====

interface CloudflareImageProps {
  /**
   * Cloudflare Images ID
   */
  imageId: string;

  /**
   * Variant name (optional)
   * Default: 'public'
   */
  variant?: string;

  /**
   * Image width for transformation
   */
  width?: number;

  /**
   * Image quality (1-100)
   * Default: 85
   */
  quality?: number;

  /**
   * Image format
   * Default: 'auto' (WebP/AVIF auto-detection)
   */
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';

  /**
   * Alt text for accessibility
   */
  alt: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Loading strategy
   */
  loading?: 'lazy' | 'eager';
}

/**
 * CloudflareImage Component
 *
 * Reusable component for displaying Cloudflare Images in Remix.
 *
 * @example
 * <CloudflareImage
 *   imageId="2cdc28f0-017a-49c4-9ed7-87056c83901"
 *   alt="Product photo"
 *   width={800}
 *   quality={85}
 *   className="rounded-lg"
 * />
 */
export function CloudflareImage({
  imageId,
  variant = 'public',
  width,
  quality = 85,
  format = 'auto',
  alt,
  className,
  loading = 'lazy'
}: CloudflareImageProps) {
  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('format', format);

  const DOMAIN =
    typeof window !== 'undefined'
      ? window.ENV?.PUBLIC_CF_IMAGES_DOMAIN
      : process.env.PUBLIC_CF_IMAGES_DOMAIN;

  const ACCOUNT_HASH =
    typeof window !== 'undefined'
      ? window.ENV?.PUBLIC_CF_ACCOUNT_HASH
      : process.env.PUBLIC_CF_ACCOUNT_HASH;

  const transformations = params.toString() ? `?${params}` : '';

  const imageUrl = DOMAIN
    ? `https://${DOMAIN}/${imageId}/${variant}${transformations}`
    : `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${variant}${transformations}`;

  return <img src={imageUrl} alt={alt} className={className} loading={loading} />;
}

// ===== 3. app/root.tsx (Environment Variables) =====

/*
import { json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

export async function loader() {
  return json({
    ENV: {
      PUBLIC_CF_IMAGES_DOMAIN: process.env.PUBLIC_CF_IMAGES_DOMAIN,
      PUBLIC_CF_ACCOUNT_HASH: process.env.PUBLIC_CF_ACCOUNT_HASH
    }
  });
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
*/

// ===== 4. app/routes/upload.tsx (Upload Route) =====

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { CloudflareImage } from '~/components/CloudflareImage';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return json({ error: 'No file selected' }, { status: 400 });
    }

    // 2. Validate file
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 3. Upload to Cloudflare Images
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

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
      return json({ error: 'Upload failed' }, { status: 500 });
    }

    // 4. Optional: Save to database
    // await db.images.create({
    //   data: {
    //     cloudflareId: result.result.id,
    //     filename: file.name,
    //     size: file.size
    //   }
    // });

    return json({
      success: true,
      imageId: result.result.id,
      variants: result.result.variants,
      filename: file.name
    });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export default function UploadPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isUploading = navigation.state === 'submitting';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Image</h1>

      <Form method="post" encType="multipart/form-data" className="space-y-4">
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
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {actionData?.error && (
          <p className="text-red-600">{actionData.error}</p>
        )}
      </Form>

      {actionData?.success && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Upload Successful!</h2>
          <CloudflareImage
            imageId={actionData.imageId}
            alt={actionData.filename}
            width={800}
            className="rounded-lg shadow-lg"
          />
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <p>
              <strong>Image ID:</strong> {actionData.imageId}
            </p>
            <p>
              <strong>Filename:</strong> {actionData.filename}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 5. app/routes/gallery.tsx (Gallery Route) =====

/*
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { CloudflareImage } from '~/components/CloudflareImage';

// Fetch images from your database
export async function loader({ request }: LoaderFunctionArgs) {
  const images = await db.images.findMany({
    select: {
      id: true,
      cloudflareId: true,
      filename: true,
      alt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return json({ images });
}

export default function GalleryPage() {
  const { images } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Image Gallery</h1>

      {images.length === 0 ? (
        <p className="text-gray-600">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="group">
              <CloudflareImage
                imageId={image.cloudflareId}
                alt={image.alt || image.filename}
                width={400}
                className="rounded-lg shadow-lg group-hover:scale-105 transition-transform"
              />
              <p className="mt-2 text-sm text-gray-600">{image.filename}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/

// ===== 6. app/routes/api.direct-upload.tsx (Direct Creator Upload) =====

/*
import { json, type ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Generate one-time upload URL
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false,
          metadata: {
            source: 'remix-app',
            timestamp: new Date().toISOString()
          }
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      return json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    return json({
      uploadURL: result.result.uploadURL,
      id: result.result.id
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/

// ===== 7. app/routes/product.$id.tsx (Product Detail with Images) =====

/*
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { CloudflareImage } from '~/components/CloudflareImage';

export async function loader({ params }: LoaderFunctionArgs) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!product) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ product });
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.images.length > 0 && (
            <CloudflareImage
              imageId={product.images[0].cloudflareId}
              alt={product.name}
              width={800}
              className="rounded-lg shadow-lg"
            />
          )}

          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image) => (
                <CloudflareImage
                  key={image.id}
                  imageId={image.cloudflareId}
                  alt={product.name}
                  width={200}
                  className="rounded cursor-pointer hover:opacity-75"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-4">{product.description}</p>
          <p className="text-2xl font-bold mt-6">${product.price}</p>
        </div>
      </div>
    </div>
  );
}
*/

// ===== 8. TypeScript Types =====

/*
// types/cloudflare-images.ts

export interface CloudflareImage {
  id: string;
  cloudflareId: string;
  filename: string;
  alt: string | null;
  size: number;
  createdAt: Date;
}

export interface CloudflareUploadResult {
  success: boolean;
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  errors?: Array<{ code: number; message: string }>;
}

export interface DirectUploadResult {
  uploadURL: string;
  id: string;
}
*/

// ===== 9. Database Schema (Prisma) =====

/*
// prisma/schema.prisma

model Image {
  id           String   @id @default(cuid())
  cloudflareId String   @unique
  filename     String
  alt          String?
  size         Int
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
*/

// ===== 10. Utility Functions =====

/*
// app/utils/cloudflare-images.server.ts

export async function uploadToCloudflare(
  file: File,
  metadata?: Record<string, string>
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        },
        body: formData
      }
    );

    const result = await response.json();

    if (result.success) {
      return { success: true, imageId: result.result.id };
    } else {
      return { success: false, error: 'Upload failed' };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Internal error' };
  }
}

export async function deleteFromCloudflare(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        }
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
*/

// ===== 11. Progressive Enhancement Example =====

/*
// app/routes/upload-progressive.tsx

import { Form, useActionData } from '@remix-run/react';

export default function UploadProgressivePage() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post" encType="multipart/form-data">
      <input type="file" name="file" required />
      <button type="submit">Upload</button>

      {actionData?.error && <p>{actionData.error}</p>}
      {actionData?.success && <p>Success!</p>}

      {/* Works without JavaScript */}
      <noscript>
        <p>Form works without JavaScript enabled!</p>
      </noscript>
    </Form>
  );
}
*/
