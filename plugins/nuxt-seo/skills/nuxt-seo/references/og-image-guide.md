# Nuxt OG Image - Complete Guide

Comprehensive guide to generating Open Graph images with Vue templates in Nuxt using nuxt-og-image v5.x.

---

## Table of Contents

1. [Overview](#overview)
2. [Renderers: Satori vs Chromium](#renderers-satori-vs-chromium)
3. [defineOgImage API](#defineogimage-api)
4. [Custom Fonts](#custom-fonts)
5. [Emojis](#emojis)
6. [Icons and Images](#icons-and-images)
7. [Styling with Tailwind/UnoCSS](#styling-with-tailwindunocss)
8. [Caching](#caching)
9. [Community Templates](#community-templates)
10. [Non-English Locales](#non-english-locales)
11. [JPEGs and Image Formats](#jpegs-and-image-formats)
12. [Zero Runtime Mode](#zero-runtime-mode)
13. [Error Pages](#error-pages)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Nuxt OG Image generates Open Graph images dynamically using Vue templates. When links are shared on social media, these images appear in link previews.

### Features

- Create og:image using built-in templates or custom Vue components
- Design and test in Nuxt DevTools OG Image Playground with full HMR
- Render using Satori (Tailwind/UnoCSS, Google fonts, emojis)
- Or prerender using Chromium for complex templates
- Generate page screenshots automatically
- Works on edge: Vercel Edge, Netlify Edge, Cloudflare Workers

### Basic Usage

```vue
<script setup lang="ts">
// Use default NuxtSeo template
defineOgImage({
  title: 'My Page Title',
  description: 'This is my page description'
})
</script>
```

---

## Renderers: Satori vs Chromium

### Satori Renderer (Default)

Satori converts Vue templates to SVG, then to PNG. Fast and works everywhere.

```typescript
// nuxt.config.ts - Satori is default, no config needed
export default defineNuxtConfig({
  ogImage: {
    defaults: {
      renderer: 'satori' // already the default
    }
  }
})
```

**Pros:**
- Fast rendering
- Works on all environments including edge

**Cons:**
- Layout limitations (flexbox only, no grid)
- CSS subset support

**Layout Constraints:**
- Everything is flexbox with `flex-direction: column`
- No `inline`, `block`, or `grid` layouts
- Design templates with flexbox in mind

### Chromium Renderer

Uses Chromium to screenshot Vue components. Better for complex designs.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ogImage: {
    defaults: {
      renderer: 'chromium'
    }
  }
})

// Or per-page
defineOgImage({
  component: 'MyComplexTemplate',
  renderer: 'chromium'
})
```

**Pros:**
- Full CSS support
- Much easier for complex designs
- Can render JPEGs without sharp

**Cons:**
- Requires Chromium binary
- Much slower than Satori
- Doesn't work on most hosting providers at runtime

**When to Use Chromium:**
- Prerendering all images (recommended)
- Complex layouts not possible with Satori
- Development only

**Environment Setup:**

```typescript
// Disable Chromium in CI if not needed
export default defineNuxtConfig({
  ogImage: {
    compatibility: {
      prerender: {
        chromium: false
      }
    }
  }
})
```

For runtime Chromium, install playwright:
```bash
bun add -D playwright
# or: npm install -D playwright
```

---

## defineOgImage API

### Basic Props

```typescript
defineOgImage({
  // Dimensions
  width: 1200,           // default: 1200
  height: 600,           // default: 600

  // Metadata
  alt: 'Image description', // recommended for accessibility

  // Renderer
  renderer: 'satori',    // 'satori' | 'chromium'
  extension: 'png',      // 'png' | 'jpeg' | 'jpg'

  // Caching
  cacheMaxAgeSeconds: 60 * 60 * 24 * 3, // 3 days default

  // Emoji family
  emojis: 'noto',        // see Emojis section

  // Custom component
  component: 'MyOgTemplate',
  props: {
    customProp: 'value'
  }
})
```

### Using Existing Image

```typescript
// Skip generation, use existing image
defineOgImage({
  url: '/my-static-image.png',
  width: 1200,
  height: 600,
  alt: 'My Image'
})

// External URL
defineOgImage({
  url: 'https://example.com/og-image.png'
})
```

### Inline HTML Templates

```typescript
defineOgImage({
  html: `<div class="w-full h-full text-6xl flex justify-end items-end bg-blue-500 text-white">
    <div class="mb-10 underline mr-10">Hello World</div>
  </div>`
})
```

### Disable OG Image

```typescript
// Disable for specific page
defineOgImage(false)
```

### Advanced Options

```typescript
defineOgImage({
  // Satori options
  satori: {
    // See https://github.com/vercel/satori
  },

  // Resvg options (SVG to PNG)
  resvg: {
    // See https://github.com/yisibl/resvg-js
  },

  // Sharp options (image processing)
  sharp: {
    // See https://sharp.pixelplumbing.com/
  },

  // Screenshot options (Chromium only)
  screenshot: {
    delay: 500, // wait before screenshot
    mask: '.hide-me' // CSS selector to hide
  }
})
```

---

## Custom Fonts

Satori requires fonts to be loaded explicitly (no system fonts).

### Google Fonts (Recommended)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ogImage: {
    fonts: [
      'Noto+Sans:400',
      'Noto+Sans:700',
      'Work+Sans:ital:400'
    ]
  }
})
```

### Local Font Files

Font files must be `.otf`, `.ttf`, or `.woff` in the `public` directory.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ogImage: {
    fonts: [
      {
        name: 'CustomFont',
        weight: 800,
        path: '/fonts/CustomFont-Bold.otf'
      }
    ]
  }
})
```

### Per-Template Fonts

```typescript
defineOgImage({
  fonts: [
    {
      name: 'SpecialFont',
      weight: 400,
      path: '/fonts/SpecialFont.ttf'
    }
  ]
})
```

### Using Custom Fonts in Template

```vue
<template>
  <div style="font-family: 'CustomFont'">
    Custom Font Text
  </div>
</template>
```

### Google Font Mirror (for China/blocked regions)

```typescript
export default defineNuxtConfig({
  ogImage: {
    googleFontMirror: 'your-proxy-server.com' // Must serve TTF format
  }
})
```

**Important:** Mirror must serve TTF or OTF format (not WOFF2).

---

## Emojis

Supports 11 emoji families via Iconify API.

### Supported Families

- `noto` (default)
- `twemoji`
- `fluent-emoji`
- `fluent-emoji-flat`
- `fluent-emoji-high-contrast`
- `noto-v1`
- `emojione`
- `emojione-monotone`
- `emojione-v1`
- `streamline-emojis`
- `openmoji`

### Configuration

```typescript
// Global default
export default defineNuxtConfig({
  ogImage: {
    defaults: {
      emojis: 'twemoji'
    }
  }
})

// Per-page
defineOgImage({
  emojis: 'fluent-emoji'
})
```

**Note:** Each emoji makes an API request to Iconify. Minimize emoji count in templates.

---

## Icons and Images

### Nuxt Icon / Nuxt UI Support

```vue
<template>
  <div>
    <!-- Nuxt Icon - mode must be "svg" -->
    <Icon name="carbon:bot" mode="svg" />

    <!-- Nuxt UI - mode must be "svg" -->
    <UIcon name="i-carbon-bot" mode="svg" />
  </div>
</template>
```

**Important:** Always use `mode="svg"` for icons to render correctly.

### Image Best Practices

```vue
<template>
  <!-- Always provide width/height for performance -->
  <img
    src="/logo.png"
    width="200"
    height="200"
    alt="Logo"
  />

  <!-- Base64 images are fastest -->
  <img :src="base64Image" width="100" height="100" />

  <!-- Avoid inlining SVGs in img tags -->
  <!-- BAD -->
  <img src="data:image/svg+xml;base64,..." />

  <!-- GOOD - render SVG directly -->
  <svg width="24" height="24">
    <rect width="24" height="24" />
  </svg>
</template>
```

### Image Resolution

- Paths must be relative to `public` directory or absolute URLs
- Cannot bundle images as part of template
- Always provide dimensions for best performance

---

## Styling with Tailwind/UnoCSS

Works out-of-the-box with `@nuxtjs/tailwind` or `@unocss/nuxt`.

### Basic Styling

```vue
<template>
  <div class="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 p-10">
    <h1 class="text-6xl font-bold text-white">
      {{ title }}
    </h1>
  </div>
</template>
```

### Theme Configuration

Your Tailwind/UnoCSS theme is automatically applied:

```vue
<template>
  <div class="bg-primary-500/50 text-base">
    <h1 class="text-mega-big">
      Custom Theme Classes
    </h1>
  </div>
</template>
```

### Inline Styles

For cases where utility classes aren't enough:

```vue
<template>
  <div :style="{ backgroundImage: 'url(/bg.png)' }">
    <h1 style="color: red; text-shadow: 2px 2px black;">
      Inline Styled
    </h1>
  </div>
</template>
```

### Style Tag Support

Requires `inline-css` dependency with limited WebWorker compatibility.

---

## Caching

SWR caching is enabled by default (72 hours).

### Cache Storage

Default: memory (cleared on server restart).

```typescript
// nuxt.config.ts - Persistent storage
export default defineNuxtConfig({
  ogImage: {
    runtimeCacheStorage: {
      driver: 'cloudflare-kv-binding',
      binding: 'OG_IMAGE_CACHE'
    }
  }
})
```

### Cache Time

```typescript
// Per-image
defineOgImage({
  cacheMaxAgeSeconds: 60 * 60 // 1 hour
})

// Global default
export default defineNuxtConfig({
  ogImage: {
    defaults: {
      cacheMaxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
    }
  }
})
```

### Purge Cache

Append `?purge` to OG image URL:
```
https://example.com/__og-image__/image/page/og.png?purge
```

### Disable Cache

```typescript
// Per-image
defineOgImage({
  cacheMaxAgeSeconds: 0
})

// Globally
export default defineNuxtConfig({
  ogImage: {
    runtimeCacheStorage: false
  }
})
```

---

## Community Templates

Built-in templates ready to use:

### NuxtSeo Template (Default)

```typescript
defineOgImage({
  component: 'NuxtSeo',
  title: 'Page Title',
  description: 'Page description',
  siteName: 'My Site',
  siteLogo: '/logo.png'
})
```

### Creating Custom Templates

Create Vue component in `components/OgImage/`:

```vue
<!-- components/OgImage/BlogPost.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  author: string
  date: string
  coverImage?: string
}>()
</script>

<template>
  <div class="w-full h-full flex flex-col bg-slate-900 text-white p-16">
    <img v-if="coverImage" :src="coverImage" class="absolute inset-0 w-full h-full object-cover opacity-30" />
    <div class="flex-1 flex flex-col justify-center">
      <h1 class="text-6xl font-bold leading-tight">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-4 text-2xl text-slate-300">
      <span>{{ author }}</span>
      <span>|</span>
      <span>{{ date }}</span>
    </div>
  </div>
</template>
```

Usage:
```typescript
defineOgImage({
  component: 'BlogPost',
  title: 'My Article',
  author: 'John Doe',
  date: '2025-01-15'
})
```

---

## Non-English Locales

For CJK (Chinese, Japanese, Korean) and other non-Latin scripts:

### Load Appropriate Fonts

```typescript
export default defineNuxtConfig({
  ogImage: {
    fonts: [
      'Noto+Sans+JP:400', // Japanese
      'Noto+Sans+JP:700',
      'Noto+Sans+SC:400', // Simplified Chinese
      'Noto+Sans+KR:400'  // Korean
    ]
  }
})
```

### Local Fonts for Better Performance

```typescript
export default defineNuxtConfig({
  ogImage: {
    fonts: [
      {
        name: 'Noto Sans JP',
        weight: 400,
        path: '/fonts/NotoSansJP-Regular.ttf'
      }
    ]
  }
})
```

---

## JPEGs and Image Formats

### Using JPEGs

```typescript
defineOgImage({
  extension: 'jpeg', // or 'jpg'
})
```

### JPEG with Satori

Requires `sharp` dependency:
```bash
bun add sharp
```

### JPEG with Chromium

Works without additional dependencies - preferred for JPEGs.

---

## Zero Runtime Mode

Generate all OG images at build time for zero server overhead.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ogImage: {
    zeroRuntime: true
  }
})
```

**Benefits:**
- No server-side image generation
- Faster page loads
- Works with static hosting

**Requirements:**
- All pages must be prerendered
- Dynamic content won't be reflected

---

## Error Pages

### Custom Error Page OG Image

```vue
<!-- error.vue -->
<script setup lang="ts">
defineOgImage({
  component: 'ErrorPage',
  title: 'Page Not Found',
  statusCode: 404
})
</script>
```

### Error Template

```vue
<!-- components/OgImage/ErrorPage.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  statusCode: number
}>()
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-red-600 text-white">
    <div class="text-center">
      <div class="text-9xl font-bold">{{ statusCode }}</div>
      <div class="text-4xl mt-4">{{ title }}</div>
    </div>
  </div>
</template>
```

---

## Troubleshooting

### Image Not Rendering

1. Check DevTools OG Image playground
2. Verify fonts are loaded
3. Check for CSS compatibility with Satori
4. Use Chromium renderer for complex layouts

### Fonts Not Loading

1. Verify font path in `public` directory
2. Check font format (.ttf, .otf, .woff only)
3. Google Fonts: check spelling and weight

### Slow Performance

1. Enable caching
2. Use prerendering for static pages
3. Optimize image sizes
4. Use base64 for small images

### Edge Compatibility

1. Use Satori renderer (not Chromium)
2. Check provider-specific limitations
3. Use zero runtime mode if possible

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Font not found | Wrong path or format | Check public directory and format |
| Layout broken | Grid/block used | Use flexbox only with Satori |
| Image missing | Wrong path | Use absolute path or public directory |
| Emoji not rendering | API blocked | Check network access to Iconify |

---

## Official Documentation

- **Nuxt OG Image**: https://nuxtseo.com/docs/og-image/getting-started/introduction
- **API Reference**: https://nuxtseo.com/docs/og-image/api/define-og-image
- **Satori Docs**: https://github.com/vercel/satori
- **GitHub**: https://github.com/nuxt-modules/og-image
