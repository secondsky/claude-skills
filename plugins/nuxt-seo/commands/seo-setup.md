---
name: nuxt-seo:setup
description: Quick setup for Nuxt SEO with best practices
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
arguments:
  - name: site-url
    description: Your site's production URL (e.g., https://example.com)
    required: true
  - name: site-name
    description: Your site's name
    required: true
---

# SEO Setup Command

Quickly set up comprehensive SEO for a Nuxt project using @nuxtjs/seo.

## Arguments

- `site-url`: Your production URL (required)
- `site-name`: Your site name (required)

## Setup Steps

### Step 1: Install @nuxtjs/seo

```bash
bunx nuxi module add @nuxtjs/seo
# or: npx nuxi module add @nuxtjs/seo
```

### Step 2: Configure nuxt.config.ts

Add site configuration:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: '${site-url}',
    name: '${site-name}',
    description: 'Your site description here',
    defaultLocale: 'en'
  },

  // Optional: Organization identity for Schema.org
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: '${site-name}',
      url: '${site-url}',
      logo: '${site-url}/logo.png'
    }
  },

  // Optional: Route-specific SEO rules
  routeRules: {
    '/admin/**': { robots: 'noindex, nofollow' },
    '/api/**': { robots: 'noindex' }
  }
})
```

### Step 3: Add Default OG Image

Create a default OG image template in `components/OgImage/`:

```vue
<!-- components/OgImage/Default.vue -->
<template>
  <div class="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-green-500 to-blue-600 p-16">
    <h1 class="text-6xl font-bold text-white text-center">
      {{ title }}
    </h1>
    <p v-if="description" class="text-2xl text-white/80 text-center mt-4">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
defineProps<{
  title: string
  description?: string
}>()
</script>
```

### Step 4: Set Up app.vue Meta Defaults

```vue
<!-- app.vue -->
<script setup>
useSeoMeta({
  titleTemplate: '%s | ${site-name}',
  ogSiteName: '${site-name}',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### Step 5: Verify Setup

After setup, verify:

1. Visit `http://localhost:3000/robots.txt`
2. Visit `http://localhost:3000/sitemap.xml`
3. Check page source for meta tags
4. Use browser dev tools to verify OG tags

## Post-Setup Checklist

- [ ] Restart dev server after config changes
- [ ] Add page-specific meta using `useSeoMeta()`
- [ ] Create OG images for key pages with `defineOgImage()`
- [ ] Add structured data with `useSchemaOrg()`
- [ ] Test with Google Rich Results Test
- [ ] Submit sitemap to Google Search Console

## Quick Reference

```vue
<!-- Example page SEO -->
<script setup>
useSeoMeta({
  title: 'Page Title',
  description: 'Page description for search results',
  ogImage: '/images/og-page.jpg'
})

defineOgImage({
  component: 'Default',
  title: 'Page Title',
  description: 'For social sharing'
})

useSchemaOrg([
  defineWebPage({
    name: 'Page Title'
  })
])
</script>
```
