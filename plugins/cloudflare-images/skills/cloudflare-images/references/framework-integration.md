# Framework Integration Guide for Cloudflare Images

Complete integration patterns for Next.js, Remix, Astro, and other popular frameworks with Cloudflare Images.

---

## Next.js Integration

### Next.js Image Component

**Problem**: Next.js `<Image>` component expects specific loader format

**Solution**: Custom Cloudflare Images loader

#### Loader Configuration

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
  },
};

module.exports = nextConfig;
```

**lib/cloudflare-image-loader.ts**:
```typescript
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
  if (quality) {
    params.set('quality', quality.toString());
  }
  params.set('format', 'auto');

  // Extract image ID from src (assuming src is just the image ID)
  const imageId = src.startsWith('/') ? src.slice(1) : src;

  // Use your custom domain or imagedelivery.net
  const DOMAIN = process.env.NEXT_PUBLIC_CF_IMAGES_DOMAIN;
  const ACCOUNT_HASH = process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH;
  const VARIANT = 'public'; // or make this dynamic

  if (DOMAIN) {
    return `https://${DOMAIN}/${imageId}/${VARIANT}?${params}`;
  }

  return `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${VARIANT}?${params}`;
}
```

**.env.local**:
```env
NEXT_PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
# OR use default
NEXT_PUBLIC_CF_ACCOUNT_HASH=Vi7wi5KSItxGFsWRG2Us6Q
```

#### Usage in Components

```tsx
// app/page.tsx
import Image from 'next/image';

export default function HomePage() {
  return (
    <div>
      <Image
        src="2cdc28f0-017a-49c4-9ed7-87056c83901" // Image ID
        alt="Product photo"
        width={800}
        height={600}
        priority
      />
    </div>
  );
}
```

### App Router with Server Components

**app/components/CloudflareImage.tsx**:
```tsx
import Image from 'next/image';

interface CloudflareImageProps {
  imageId: string;
  alt: string;
  width: number;
  height: number;
  variant?: string;
  priority?: boolean;
  className?: string;
}

export function CloudflareImage({
  imageId,
  alt,
  width,
  height,
  variant = 'public',
  priority = false,
  className
}: CloudflareImageProps) {
  // src is just image ID, loader handles the rest
  return (
    <Image
      src={imageId}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

// Usage
<CloudflareImage
  imageId="2cdc28f0-017a-49c4-9ed7-87056c83901"
  alt="Hero image"
  width={1920}
  height={1080}
  priority
/>
```

### API Route for Uploads

**app/api/upload/route.ts**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload to Cloudflare Images
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        },
        body: cloudflareFormData
      }
    );

    const result = await uploadResponse.json();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageId: result.result.id,
      variants: result.result.variants
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Remix Integration

### Loader Pattern

**app/routes/_index.tsx**:
```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

// Load image metadata from your database
export async function loader({ params }: LoaderFunctionArgs) {
  const images = await db.images.findMany({
    select: {
      id: true,
      cloudflareId: true,
      alt: true
    },
    take: 10
  });

  return json({ images });
}

export default function Index() {
  const { images } = useLoaderData<typeof loader>();

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => (
        <img
          key={image.id}
          src={`https://images.yourdomain.com/${image.cloudflareId}/thumbnail`}
          alt={image.alt}
          loading="lazy"
        />
      ))}
    </div>
  );
}
```

### Action for Uploads

**app/routes/upload.tsx**:
```typescript
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return json({ error: 'No file selected' }, { status: 400 });
  }

  try {
    // Upload to Cloudflare Images
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        },
        body: cloudflareFormData
      }
    );

    const result = await uploadResponse.json();

    if (!result.success) {
      return json({ error: 'Upload failed' }, { status: 500 });
    }

    // Save to database
    await db.images.create({
      data: {
        cloudflareId: result.result.id,
        filename: file.name,
        url: result.result.variants[0]
      }
    });

    return json({
      success: true,
      imageId: result.result.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
}

export default function UploadPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isUploading = navigation.state === 'submitting';

  return (
    <Form method="post" encType="multipart/form-data">
      <input
        type="file"
        name="file"
        accept="image/*"
        required
      />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {actionData?.error && (
        <p className="error">{actionData.error}</p>
      )}
      {actionData?.success && (
        <p className="success">Image uploaded successfully!</p>
      )}
    </Form>
  );
}
```

### Image Component

**app/components/CloudflareImage.tsx**:
```typescript
interface CloudflareImageProps {
  imageId: string;
  variant?: string;
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
  alt: string;
  className?: string;
}

export function CloudflareImage({
  imageId,
  variant = 'public',
  width,
  quality = 85,
  format = 'auto',
  alt,
  className
}: CloudflareImageProps) {
  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('format', format);

  const DOMAIN = 'images.yourdomain.com'; // or from env
  const url = `https://${DOMAIN}/${imageId}/${variant}?${params}`;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
```

---

## Astro Integration

### Component

**src/components/CloudflareImage.astro**:
```astro
---
interface Props {
  imageId: string;
  variant?: string;
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
  alt: string;
  class?: string;
}

const {
  imageId,
  variant = 'public',
  width,
  quality = 85,
  format = 'auto',
  alt,
  class: className
} = Astro.props;

const params = new URLSearchParams();
if (width) params.set('width', width.toString());
params.set('quality', quality.toString());
params.set('format', format);

const DOMAIN = import.meta.env.PUBLIC_CF_IMAGES_DOMAIN || 'imagedelivery.net';
const ACCOUNT_HASH = import.meta.env.PUBLIC_CF_ACCOUNT_HASH;

const url = DOMAIN.includes('imagedelivery.net')
  ? `https://${DOMAIN}/${ACCOUNT_HASH}/${imageId}/${variant}?${params}`
  : `https://${DOMAIN}/${imageId}/${variant}?${params}`;
---

<img
  src={url}
  alt={alt}
  class={className}
  loading="lazy"
/>
```

**.env**:
```env
PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
PUBLIC_CF_ACCOUNT_HASH=Vi7wi5KSItxGFsWRG2Us6Q
```

### Usage in Pages

**src/pages/index.astro**:
```astro
---
import CloudflareImage from '../components/CloudflareImage.astro';
import { getImages } from '../lib/db';

const images = await getImages();
---

<html>
  <head>
    <title>Gallery</title>
  </head>
  <body>
    <div class="gallery">
      {images.map((image) => (
        <CloudflareImage
          imageId={image.cloudflareId}
          variant="thumbnail"
          width={400}
          alt={image.alt}
        />
      ))}
    </div>
  </body>
</html>
```

### API Endpoint for Uploads

**src/pages/api/upload.ts**:
```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400 }
      );
    }

    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${import.meta.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.CF_API_TOKEN}`
        },
        body: cloudflareFormData
      }
    );

    const result = await uploadResponse.json();

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Upload failed' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        imageId: result.result.id,
        variants: result.result.variants
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
```

---

## SvelteKit Integration

### Image Component

**src/lib/components/CloudflareImage.svelte**:
```svelte
<script lang="ts">
  export let imageId: string;
  export let variant = 'public';
  export let width: number | undefined = undefined;
  export let quality = 85;
  export let format: 'auto' | 'webp' | 'avif' = 'auto';
  export let alt: string;
  export let className = '';

  const DOMAIN = import.meta.env.VITE_CF_IMAGES_DOMAIN;

  $: params = new URLSearchParams();
  $: {
    if (width) params.set('width', width.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
  }

  $: imageUrl = `https://${DOMAIN}/${imageId}/${variant}?${params}`;
</script>

<img src={imageUrl} {alt} class={className} loading="lazy" />
```

### Upload Endpoint

**src/routes/api/upload/+server.ts**:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        },
        body: cloudflareFormData
      }
    );

    const result = await uploadResponse.json();

    if (!result.success) {
      return json({ error: 'Upload failed' }, { status: 500 });
    }

    return json({
      imageId: result.result.id,
      variants: result.result.variants
    });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

---

## Environment Variables

### Development (.env.local)

```env
# Cloudflare Images Configuration
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
CF_ACCOUNT_HASH=your_account_hash

# Public variables (exposed to browser)
NEXT_PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
# OR
VITE_CF_IMAGES_DOMAIN=images.yourdomain.com
# OR
PUBLIC_CF_IMAGES_DOMAIN=images.yourdomain.com
```

### Production

Set environment variables in deployment platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Cloudflare Pages**: Settings → Environment Variables

---

## Best Practices

### 1. Use Environment Variables

```typescript
// ✅ GOOD
const DOMAIN = process.env.NEXT_PUBLIC_CF_IMAGES_DOMAIN;

// ❌ BAD
const DOMAIN = 'images.yourdomain.com'; // Hardcoded
```

### 2. Lazy Loading

```tsx
// Next.js
<Image src={imageId} loading="lazy" />

// React/Remix
<img src={url} loading="lazy" />
```

### 3. Responsive Images

```tsx
<CloudflareImage
  imageId={id}
  width={800}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 4. Error Handling

```typescript
try {
  const response = await uploadImage(file);
  if (!response.success) {
    throw new Error('Upload failed');
  }
} catch (error) {
  console.error('Upload error:', error);
  // Show user-friendly error message
}
```

---

## Performance Optimization

### 1. Format Auto-Detection

```typescript
// Always use format=auto for automatic WebP/AVIF
params.set('format', 'auto');
```

### 2. Quality Settings

```typescript
// Balance quality and file size
const quality = width > 1200 ? 90 : 85;
```

### 3. Preloading Critical Images

**Next.js**:
```tsx
<Image src={heroImageId} priority />
```

**HTML**:
```html
<link
  rel="preload"
  as="image"
  href="https://images.yourdomain.com/hero-id/public"
/>
```

---

## TypeScript Types

**types/cloudflare-images.ts**:
```typescript
export interface CloudflareImageProps {
  imageId: string;
  variant?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  alt: string;
  loading?: 'lazy' | 'eager';
  className?: string;
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
}
```

---

## Related References

- **Upload API**: See `references/api-reference.md`
- **Custom Domains**: See `references/custom-domains.md`
- **Transformations**: See `references/transformation-options.md`

---

## Official Documentation

- **Next.js Image**: https://nextjs.org/docs/api-reference/next/image
- **Remix**: https://remix.run/docs
- **Astro**: https://docs.astro.build
- **SvelteKit**: https://kit.svelte.dev/docs
