# Maz-UI SSR & SSG Guide

Complete guide to using Maz-UI with Server-Side Rendering (SSR) and Static Site Generation (SSG) in Nuxt applications.

## Overview

Maz-UI v4 is fully compatible with Nuxt 3's SSR and SSG modes, providing optimal performance through smart theme strategies, critical CSS injection, and hydration optimization.

**Key Features**:
- 🚀 Full SSR/SSG support
- 🎨 Multiple theme strategies (hybrid, runtime, buildtime)
- ⚡ Critical CSS for instant theming
- 🌓 Dark mode without flash
- 💧 Hydration optimization
- 📦 Automatic code splitting

---

## Nuxt Module Installation

### Basic Setup

```bash
npm install @maz-ui/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'hybrid', // ✅ RECOMMENDED for SSR/SSG
    },
  }
})
```

---

## Theme Strategies

Maz-UI offers three theme strategies, each optimized for different use cases:

### Hybrid Strategy (Recommended)

**Best for**: SSR/SSG applications with runtime theme switching

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'hybrid', // ✅ OPTIMAL for SSR/SSG
      darkModeStrategy: 'class' // or 'media'
    }
  }
})
```

**How it works**:
1. **Server**: Generates critical CSS based on user preferences (cookie)
2. **Client**: Injects critical CSS in `<head>` (instant theme)
3. **Hydration**: No flash, theme persists across page loads
4. **Runtime**: Full theme switching without page reload

**Critical CSS injection**:
```html
<!-- Server-rendered -->
<head>
  <style data-maz-ui-critical>
    :root {
      --maz-color-primary: 220 100% 50%;
      --maz-color-secondary: 220 14% 96%;
      /* ... critical theme variables */
    }
  </style>
</head>
```

**Benefits**:
- ✅ Instant theme on server render
- ✅ No flash of unstyled content (FOUC)
- ✅ Runtime theme switching
- ✅ Dark mode toggle works instantly
- ✅ User preference persistence (cookie)

**Bundle Impact**: ~15KB runtime theme logic + critical CSS

---

### Build-time Strategy

**Best for**: Static sites with no runtime theme switching

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'buildtime', // ✅ SMALLEST bundle
    }
  }
})
```

**How it works**:
1. **Build**: All CSS variables pre-generated at build time
2. **Server/Client**: Static CSS loaded (no runtime logic)
3. **Theme switching**: NOT possible (requires full rebuild)

**Benefits**:
- ✅ Smallest bundle size (~5KB smaller than hybrid)
- ✅ Fastest initial load
- ✅ Perfect for static themes
- ❌ No runtime theme switching
- ❌ No dark mode toggle

**Use cases**:
- Marketing sites with fixed branding
- Documentation sites
- Landing pages

---

### Runtime Strategy

**Best for**: Apps with multiple theme presets and user preference

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'runtime', // ⚠️ LARGER bundle
      darkModeStrategy: 'class'
    }
  }
})
```

**How it works**:
1. **Server**: Minimal CSS (base styles only)
2. **Client**: Full theme logic loaded
3. **Runtime**: Complete theme switching (all presets available)

**Benefits**:
- ✅ Full runtime theme switching
- ✅ All theme presets available
- ✅ User preference persistence
- ⚠️ Larger initial bundle (~20KB)
- ⚠️ Possible FOUC on slow connections

**Use cases**:
- Apps with theme marketplace
- Multi-tenant applications
- User-customizable themes

---

## Dark Mode Strategies

### Class Strategy (Recommended)

Uses `class="dark"` on `<html>` element:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      darkModeStrategy: 'class' // ✅ RECOMMENDED
    }
  }
})
```

**How it works**:
```html
<!-- Light mode -->
<html>
  <body>...</body>
</html>

<!-- Dark mode -->
<html class="dark">
  <body>...</body>
</html>
```

**CSS**:
```css
:root {
  --maz-color-bg: 255 255 255; /* white */
}

.dark {
  --maz-color-bg: 20 20 20; /* dark gray */
}
```

**Benefits**:
- ✅ Full control over dark mode
- ✅ Works with JavaScript disabled
- ✅ Persists across page loads (cookie)
- ✅ No flash on page load

---

### Media Strategy

Uses `prefers-color-scheme` media query:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      darkModeStrategy: 'media'
    }
  }
})
```

**How it works**:
```css
:root {
  --maz-color-bg: 255 255 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --maz-color-bg: 20 20 20;
  }
}
```

**Benefits**:
- ✅ Automatic based on system preferences
- ✅ No JavaScript required
- ❌ Cannot be toggled by user
- ❌ Follows system preference only

---

## SSR-Specific Optimizations

### Critical CSS Injection

With **hybrid strategy**, critical CSS is injected during SSR:

```typescript
// plugins/maz-ui.server.ts (auto-generated by @maz-ui/nuxt)
export default defineNuxtPlugin((nuxtApp) => {
  // Server-only plugin
  if (import.meta.server) {
    // Read user preference from cookie
    const darkMode = useCookie('maz-ui-dark-mode').value === 'true'

    // Inject critical CSS based on preference
    nuxtApp.hook('app:rendered', (ctx) => {
      const criticalCss = generateCriticalCss(darkMode)
      ctx.renderContext.head.push(`
        <style data-maz-ui-critical>
          ${criticalCss}
        </style>
      `)
    })
  }
})
```

**Result**: User sees correct theme instantly on server render.

---

### Hydration Prevention

Some Maz-UI components should only render on client to prevent hydration mismatches:

#### Client-Only Components

```vue
<template>
  <!-- ✅ OPTIMAL: Use <ClientOnly> for client-specific components -->
  <ClientOnly>
    <MazDialogConfirm />
    <MazToast />
    <MazWaitOverlay />
  </ClientOnly>
</template>
```

**Why?**:
- Dialog, Toast, Wait plugins use browser APIs (not available on server)
- Prevents hydration warnings
- Improves SSR performance

---

#### Conditional Rendering

```vue
<script setup lang="ts">
const isClient = ref(false)

onMounted(() => {
  isClient.value = true
})
</script>

<template>
  <!-- Only render on client after mount -->
  <div v-if="isClient">
    <MazCarousel :images="images" />
  </div>
</template>
```

---

### Lazy Hydration

For heavy components, defer hydration until visible:

```vue
<template>
  <!-- Lazy hydrate MazGallery when in viewport -->
  <LazyMazGallery
    :images="galleryImages"
    @intersect="onIntersect"
  />
</template>
```

**Benefits**:
- ✅ Faster initial hydration
- ✅ Components hydrate when needed
- ✅ Reduces Time to Interactive (TTI)

---

## Static Site Generation (SSG)

### Prerender Routes

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: [
        '/',
        '/about',
        '/contact',
        '/blog',
        // Dynamic routes
        '/blog/post-1',
        '/blog/post-2'
      ]
    }
  },

  mazUi: {
    theme: {
      strategy: 'buildtime' // ✅ OPTIMAL for SSG
    }
  }
})
```

---

### Crawl Links for Prerendering

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true, // Auto-discover routes
      routes: ['/']
    }
  }
})
```

---

### Dynamic Routes from API

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: async () => {
        // Fetch dynamic routes from API
        const posts = await $fetch('/api/posts')
        return posts.map(post => `/blog/${post.slug}`)
      }
    }
  }
})
```

---

## Performance Optimization for SSR/SSG

### Code Splitting

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'maz-ui-forms': [
              'maz-ui/components/MazInput',
              'maz-ui/components/MazSelect',
              'maz-ui/components/MazTextarea'
            ]
          }
        }
      }
    }
  }
})
```

---

### Resource Hints

```vue
<!-- app.vue -->
<template>
  <Head>
    <!-- Preconnect to external resources -->
    <Link rel="preconnect" href="https://fonts.googleapis.com" />

    <!-- Preload critical assets -->
    <Link
      rel="preload"
      href="/fonts/inter.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
  </Head>

  <NuxtPage />
</template>
```

---

### Inline Critical CSS

For **buildtime strategy**, inline critical CSS:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    inlineSSRStyles: true // ✅ Inline critical CSS
  }
})
```

---

## Common SSR/SSG Issues

### Issue: Hydration Mismatch

**Error**: `Hydration node mismatch: client content does not match server-rendered HTML`

**Cause**: Component renders differently on server vs client

**Solution**:

```vue
<template>
  <!-- ❌ WRONG: window is undefined on server -->
  <div>Window width: {{ window.innerWidth }}</div>

  <!-- ✅ CORRECT: Use onMounted for client-only logic -->
  <div>Window width: {{ windowWidth }}</div>
</template>

<script setup lang="ts">
const windowWidth = ref(0)

onMounted(() => {
  windowWidth.value = window.innerWidth
})
</script>
```

---

### Issue: Flash of Unstyled Content (FOUC)

**Cause**: Theme CSS loads after initial render

**Solution**: Use **hybrid strategy** with critical CSS:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid', // ✅ Prevents FOUC
      darkModeStrategy: 'class'
    }
  }
})
```

---

### Issue: Dark Mode Flash

**Cause**: Server renders light mode, client switches to dark

**Solution 1: Hybrid strategy** (reads cookie on server):

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid', // ✅ Server reads cookie
      darkModeStrategy: 'class'
    }
  }
})
```

**Solution 2: Blocking script** (for runtime strategy):

```vue
<!-- app.vue -->
<template>
  <Head>
    <Script>
      (function() {
        const darkMode = document.cookie.includes('maz-ui-dark-mode=true')
        if (darkMode) {
          document.documentElement.classList.add('dark')
        }
      })()
    </Script>
  </Head>
</template>
```

---

### Issue: Client-Only Plugins Not Working

**Cause**: Plugin runs on server where browser APIs don't exist

**Solution**: Mark plugin as client-only:

```typescript
// plugins/client-only.client.ts (note .client suffix)
export default defineNuxtPlugin(() => {
  // This only runs on client
  const toast = useToast()

  return {
    provide: {
      toast
    }
  }
})
```

---

## SSR/SSG Checklist

### Pre-Deployment

- [ ] **Theme strategy** chosen (hybrid recommended for SSR)
- [ ] **Dark mode strategy** configured (class recommended)
- [ ] **Client-only components** wrapped in `<ClientOnly>`
- [ ] **Hydration mismatches** resolved (no server/client differences)
- [ ] **Critical CSS** inlined (hybrid strategy)
- [ ] **Resource hints** added (preconnect, preload)
- [ ] **Code splitting** configured (manual chunks for large components)
- [ ] **SSG routes** prerendered (if using SSG)
- [ ] **No FOUC** verified (critical CSS loaded)
- [ ] **No dark mode flash** verified (server reads cookie)

---

## Advanced SSR Patterns

### Server-Side Data Fetching

```vue
<script setup lang="ts">
// Fetch data on server
const { data: users } = await useFetch('/api/users')
</script>

<template>
  <MazTable :rows="users" />
</template>
```

---

### Async Component with SSR

```vue
<script setup lang="ts">
const MazCarousel = defineAsyncComponent({
  loader: () => import('maz-ui/components/MazCarousel'),
  delay: 200, // Show loading after 200ms
  timeout: 3000 // Error after 3s
})
</script>

<template>
  <Suspense>
    <template #default>
      <MazCarousel :images="images" />
    </template>
    <template #fallback>
      <MazCircularProgressBar />
    </template>
  </Suspense>
</template>
```

---

### Conditional SSR Rendering

```vue
<template>
  <!-- Render on server for SEO -->
  <div v-if="$nuxt.ssrContext">
    <h1>{{ post.title }}</h1>
    <p>{{ post.excerpt }}</p>
  </div>

  <!-- Rich client experience -->
  <div v-else>
    <MazCardSpotlight>
      <h1>{{ post.title }}</h1>
      <MazAnimatedText>{{ post.excerpt }}</MazAnimatedText>
    </MazCardSpotlight>
  </div>
</template>
```

---

## Theme Strategy Comparison

| Feature | Hybrid | Build-time | Runtime |
|---------|--------|------------|---------|
| **Bundle Size** | ~15KB | ~10KB | ~25KB |
| **Critical CSS** | ✅ Yes | ✅ Yes | ❌ No |
| **Theme Switching** | ✅ Yes | ❌ No | ✅ Yes |
| **Dark Mode Toggle** | ✅ Yes | ❌ No | ✅ Yes |
| **FOUC Prevention** | ✅ Yes | ✅ Yes | ⚠️ Partial |
| **SSR Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **SSG Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Use Case** | SSR/SSG apps | Static sites | Multi-theme apps |

---

## Related Documentation

- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt module configuration
- **[Theming](./theming.md)** - Theme customization
- **[Performance](./performance.md)** - Bundle optimization
- **[Composables](./composables.md)** - useTheme, useTranslations
- **[Troubleshooting](./troubleshooting.md)** - Common SSR errors

---

## External Resources

- **[Nuxt SSR](https://nuxt.com/docs/guide/concepts/rendering)** - Official Nuxt SSR guide
- **[Nuxt SSG](https://nuxt.com/docs/guide/concepts/rendering#static-site-generation)** - Static site generation
- **[Critical CSS](https://web.dev/extract-critical-css/)** - Web.dev guide
- **[Hydration](https://nuxt.com/docs/getting-started/data-fetching#clientonly-component)** - Nuxt hydration docs

---

**SSR/SSG Version**: Maz-UI v4.3.3 + Nuxt 3
**Last Updated**: 2025-12-14

::: tip Hybrid Strategy Recommended
For SSR/SSG applications, use `strategy: 'hybrid'` for optimal performance, instant theming, and runtime flexibility.
:::
