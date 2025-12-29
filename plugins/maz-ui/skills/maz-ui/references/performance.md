# Maz-UI Performance Optimization

Complete guide to optimizing Maz-UI applications for maximum performance, minimal bundle size, and fast loading times.

## Overview

Maz-UI v4 achieves **60-90% bundle size reduction** compared to v3 through optimal tree-shaking, modular architecture, and smart lazy loading. This guide covers all performance optimization techniques.

**Key Metrics**:
- Bundle Size: ~50-200KB (was ~500KB in v3)
- Tree-shaking: Perfect (every export is individually importable)
- Lazy Loading: Intelligent (on-demand component loading)
- TypeScript: Zero runtime overhead

---

## Bundle Optimization

### Auto-Import Resolvers (Recommended)

The **most efficient** way to use Maz-UI is with auto-import resolvers:

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: true, // TypeScript definitions
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true,
    }),
  ],
})
```

**Benefits**:
- ✅ Automatic tree-shaking (only imports what you use)
- ✅ No manual imports needed
- ✅ Perfect TypeScript auto-completion
- ✅ Minimal bundle size

**Bundle Impact**:
```typescript
// Without auto-import
import 'maz-ui/styles' // ~300KB

// With auto-import + only using MazBtn and MazInput
// Bundle size: ~15KB (components + styles)
```

---

#### Webpack Configuration

```typescript
// webpack.config.js
const Components = require('unplugin-vue-components/webpack')
const AutoImport = require('unplugin-auto-import/webpack')
const {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} = require('maz-ui/resolvers')

module.exports = {
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
    }),
  ],
}
```

---

### Manual Tree-Shaking

If not using auto-import resolvers, import components individually:

#### Optimal Import Pattern

```typescript
// ✅ BEST: Individual imports for maximum tree-shaking
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { useToast } from 'maz-ui/composables/useToast'
import { vTooltip } from 'maz-ui/directives/vTooltip'
```

#### Batch Imports (Acceptable)

```typescript
// ✅ GOOD: Batch imports still tree-shake well
import { MazBtn, MazInput } from 'maz-ui/components'
import { useToast, useDialog } from 'maz-ui/composables'
import { vTooltip, vClickOutside } from 'maz-ui/directives'
```

#### Avoid Full Imports

```typescript
// ❌ AVOID: Imports everything (large bundle)
import * as MazUI from 'maz-ui'
```

---

### Style Optimization

#### On-Demand Styles (Auto-Import)

With auto-import resolvers, styles are automatically imported per component:

```vue
<template>
  <!-- Auto-imports MazBtn component + its styles -->
  <MazBtn>Click Me</MazBtn>
</template>
```

**Bundle**: Only MazBtn styles (~2KB)

---

#### Manual Style Imports

Without auto-import, import global styles once:

```typescript
// main.ts
import 'maz-ui/styles' // ~300KB (all component styles)
```

**Optimization**: Load only specific component styles:

```typescript
// ❌ NOT RECOMMENDED: Manual per-component style imports
import 'maz-ui/components/MazBtn/styles'
import 'maz-ui/components/MazInput/styles'

// ✅ RECOMMENDED: Use auto-import resolvers instead
```

---

## Lazy Loading Strategies

### Component Lazy Loading

#### Basic Lazy Loading

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Lazy load heavy components
const MazCarousel = defineAsyncComponent(() =>
  import('maz-ui/components/MazCarousel')
)

const MazGallery = defineAsyncComponent(() =>
  import('maz-ui/components/MazGallery')
)
</script>

<template>
  <Suspense>
    <template #default>
      <MazCarousel :images="images" />
    </template>
    <template #fallback>
      <div>Loading carousel...</div>
    </template>
  </Suspense>
</template>
```

---

#### Route-Level Code Splitting

```typescript
// router/index.ts
import { createRouter } from 'vue-router'

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    // Lazy load entire dashboard component
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  }
]
```

**Dashboard.vue** (lazy loads Maz-UI components):
```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const MazTable = defineAsyncComponent(() =>
  import('maz-ui/components/MazTable')
)
</script>

<template>
  <Suspense>
    <MazTable :rows="data" />
  </Suspense>
</template>
```

---

### Plugin Lazy Loading

#### Conditional Plugin Loading

```typescript
// main.ts
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import App from './App.vue'

const app = createApp(App)

// Load MazUi plugin
app.use(MazUi, {
  theme: { preset: 'maz-ui' },
  translations: { locale: 'en' }
})

// Conditionally load optional plugins
if (import.meta.env.VITE_ENABLE_AOS === 'true') {
  import('maz-ui/plugins/aos').then(({ AosPlugin }) => {
    app.use(AosPlugin)
  })
}

app.mount('#app')
```

---

#### On-Demand Toast/Dialog

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showToast = async () => {
  // Lazy load Toast plugin when needed
  const { useToast } = await import('maz-ui/composables/useToast')
  const toast = useToast()
  toast.success('Success!')
}

const showDialog = async () => {
  // Lazy load Dialog composable when needed
  const { useDialog } = await import('maz-ui/composables/useDialog')
  const dialog = useDialog()
  dialog.confirm({
    title: 'Confirm',
    message: 'Are you sure?',
    onAccept: () => console.log('Confirmed')
  })
}
</script>

<template>
  <button @click="showToast">Show Toast</button>
  <button @click="showDialog">Show Dialog</button>
</template>
```

---

## Image Optimization

### Lazy Image Loading

```vue
<template>
  <!-- v-lazy-img directive for lazy loading -->
  <img
    v-lazy-img="imageUrl"
    alt="Product"
    class="product-image"
  />

  <!-- Or use MazLazyImg component -->
  <MazLazyImg
    :src="imageUrl"
    :blur-up="true"
    alt="Product"
  />
</template>
```

**Benefits**:
- ✅ Only loads images in viewport
- ✅ Blur-up effect during load
- ✅ Reduces initial page weight

---

### Image Format Optimization

```vue
<script setup lang="ts">
const imageUrl = computed(() => {
  // Serve WebP for browsers that support it
  if (supportsWebP.value) {
    return '/images/product.webp'
  }
  return '/images/product.jpg'
})
</script>

<template>
  <MazLazyImg :src="imageUrl" />
</template>
```

---

## Icon Optimization

### @maz-ui/icons Package

Use the **@maz-ui/icons** package for optimal icon tree-shaking:

```typescript
// ✅ OPTIMAL: Import specific icons
import { IconHome, IconUser, IconSettings } from '@maz-ui/icons'
```

**Bundle**: ~1KB per icon (SVG optimized)

```vue
<template>
  <MazIcon :src="IconHome" />
  <MazIcon :src="IconUser" />
</template>
```

---

### Icon Lazy Loading

For large icon sets:

```vue
<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue'

const IconLarge = shallowRef(null)

const loadIcon = async () => {
  const module = await import('@maz-ui/icons')
  IconLarge.value = module.IconLargeFile
}

// Load on mount or on-demand
onMounted(loadIcon)
</script>

<template>
  <MazIcon v-if="IconLarge" :src="IconLarge" />
</template>
```

---

## Vue 3 Performance Patterns

### Composition API Optimizations

#### Computed vs Reactive

```typescript
import { ref, computed, reactive } from 'vue'

// ✅ OPTIMAL: Use ref for primitives
const count = ref(0)
const doubled = computed(() => count.value * 2)

// ✅ OPTIMAL: Use reactive for objects
const state = reactive({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' }
})

// ❌ AVOID: Reactive for primitives (unnecessary overhead)
const count = reactive({ value: 0 })
```

---

#### Shallow Refs for Large Objects

```typescript
import { shallowRef, triggerRef } from 'vue'

// ✅ OPTIMAL: shallowRef for large objects that change rarely
const largeDataset = shallowRef([/* 10,000 items */])

// Update entire object (triggers reactivity)
largeDataset.value = newDataset

// Or manually trigger after mutation
largeDataset.value.push(newItem)
triggerRef(largeDataset)
```

---

### Component Optimizations

#### Virtual Scrolling for Large Lists

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
})))

const visibleItems = computed(() => {
  // Only render items in viewport
  const start = scrollTop.value / itemHeight
  const end = start + visibleCount
  return items.value.slice(start, end)
})
</script>

<template>
  <div class="virtual-scroll">
    <MazCard
      v-for="item in visibleItems"
      :key="item.id"
    >
      {{ item.name }}
    </MazCard>
  </div>
</template>
```

---

#### Memoization with Computed

```vue
<script setup lang="ts">
import { computed } from 'vue'

const users = ref([/* large array */])

// ✅ OPTIMAL: Memoize expensive operations
const sortedUsers = computed(() => {
  return users.value.slice().sort((a, b) => a.name.localeCompare(b.name))
})

// ❌ AVOID: Re-computing on every render
const getSortedUsers = () => {
  return users.value.slice().sort((a, b) => a.name.localeCompare(b.name))
}
</script>
```

---

### Event Handler Optimizations

#### Debouncing Search

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from '@maz-ui/utils'

const searchQuery = ref('')
const searchResults = ref([])

// ✅ OPTIMAL: Debounce expensive operations
const handleSearch = debounce(async (query: string) => {
  searchResults.value = await fetchResults(query)
}, 300)

watch(searchQuery, (newQuery) => {
  handleSearch(newQuery)
})
</script>

<template>
  <MazInput
    v-model="searchQuery"
    placeholder="Search..."
  />
</template>
```

---

## Theme Optimization

### Runtime vs Build-time Themes

#### Hybrid Strategy (Recommended)

```typescript
// nuxt.config.ts (Nuxt)
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'hybrid', // ✅ OPTIMAL: Critical CSS + runtime
      darkModeStrategy: 'class'
    }
  }
})
```

**Benefits**:
- ✅ Critical CSS in `<head>` (instant theme)
- ✅ Runtime switching (no page reload)
- ✅ Dark mode toggle without flash

---

#### Build-time Only (Fastest)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'buildtime' // ✅ SMALLEST: All CSS pre-generated
    }
  }
})
```

**Benefits**:
- ✅ Smallest bundle (no runtime theme logic)
- ✅ Fastest initial load
- ❌ No runtime theme switching

---

#### Runtime Only (Most Flexible)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'runtime' // ⚠️ LARGER: All themes loaded
    }
  }
})
```

**Benefits**:
- ✅ Full runtime theme switching
- ✅ User preference persistence
- ❌ Larger initial bundle

---

## Translation Optimization

### Lazy Translation Loading

```typescript
// main.ts
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { en } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en, // Load English immediately
      // Lazy load other languages
    },
  },
})

// Lazy load French when needed
const loadFrench = async () => {
  const { fr } = await import('@maz-ui/translations')
  const { setLocale, addMessages } = useTranslations()
  addMessages('fr', fr)
  setLocale('fr')
}
```

---

## Build Configuration

### Vite Optimizations

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // ✅ Rollup optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          'maz-ui-core': ['maz-ui/components/MazBtn', 'maz-ui/components/MazInput'],
          'maz-ui-forms': ['maz-ui/components/MazSelect', 'maz-ui/components/MazTextarea'],
        }
      }
    },
    // ✅ CSS code splitting
    cssCodeSplit: true,
    // ✅ Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      }
    }
  },
  // ✅ Dependency pre-bundling
  optimizeDeps: {
    include: ['maz-ui', '@maz-ui/themes', '@maz-ui/translations']
  }
})
```

---

### Webpack Optimizations

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        mazui: {
          test: /[\\/]node_modules[\\/]maz-ui/,
          name: 'maz-ui',
          priority: 10
        }
      }
    },
    minimize: true,
  },
  performance: {
    maxEntrypointSize: 250000,
    maxAssetSize: 250000
  }
}
```

---

## Performance Monitoring

### Bundle Size Analysis

```bash
# Vite
npm run build
npm run preview

# Analyze bundle
npx vite-bundle-visualizer
```

---

### Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-app.com --view
```

**Target Metrics**:
- Performance: >90
- First Contentful Paint: <1.8s
- Time to Interactive: <3.8s
- Total Blocking Time: <300ms

---

## Production Checklist

### Pre-Deployment Optimizations

- [ ] **Auto-import resolvers** configured (Vite/Webpack)
- [ ] **Tree-shaking** verified (bundle analyzer)
- [ ] **Lazy loading** for heavy components (MazCarousel, MazGallery, MazTable)
- [ ] **Image optimization** (v-lazy-img, WebP format)
- [ ] **Icon tree-shaking** (@maz-ui/icons individual imports)
- [ ] **Theme strategy** optimized (hybrid/buildtime)
- [ ] **Translation lazy loading** for non-default locales
- [ ] **Code splitting** configured (route-level)
- [ ] **Minification** enabled (production build)
- [ ] **Console.log removal** in production
- [ ] **Bundle size** <250KB initial load
- [ ] **Lighthouse score** >90

---

## Performance Anti-Patterns

### Avoid These Mistakes

#### ❌ Importing Everything

```typescript
// ❌ BAD: Imports entire library
import * as MazUI from 'maz-ui'

// ✅ GOOD: Import only what you need
import { MazBtn, MazInput } from 'maz-ui/components'
```

---

#### ❌ Not Using Auto-Import

```vue
<script setup>
// ❌ BAD: Manual imports for every component
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import MazSelect from 'maz-ui/components/MazSelect'
</script>

<template>
  <MazBtn>Click</MazBtn>
  <MazInput />
  <MazSelect />
</template>
```

```vue
<script setup>
// ✅ GOOD: Auto-import with resolvers
// No imports needed!
</script>

<template>
  <MazBtn>Click</MazBtn>
  <MazInput />
  <MazSelect />
</template>
```

---

#### ❌ Loading All Translations

```typescript
// ❌ BAD: Load all 9 languages upfront
import { en, fr, de, es, it, pt, ja, zhCN } from '@maz-ui/translations'

// ✅ GOOD: Load default + lazy load others
import { en } from '@maz-ui/translations'
// Lazy load other languages on demand
```

---

#### ❌ Not Lazy Loading Heavy Components

```vue
<script setup>
// ❌ BAD: Load MazCarousel even if not visible
import MazCarousel from 'maz-ui/components/MazCarousel'
</script>

<template>
  <div v-if="showCarousel">
    <MazCarousel :images="images" />
  </div>
</template>
```

```vue
<script setup>
// ✅ GOOD: Lazy load when needed
import { defineAsyncComponent } from 'vue'

const MazCarousel = defineAsyncComponent(() =>
  import('maz-ui/components/MazCarousel')
)
</script>

<template>
  <Suspense>
    <div v-if="showCarousel">
      <MazCarousel :images="images" />
    </div>
  </Suspense>
</template>
```

---

## Benchmarks

### v3 vs v4 Performance

| Metric | v3.x | v4.0.0 | Improvement |
|--------|------|--------|-------------|
| **Bundle Size (all components)** | ~500KB | ~300KB | 40% |
| **Bundle Size (5 components)** | ~500KB | ~50KB | 90% |
| **Bundle Size (with auto-import)** | ~500KB | ~30KB | 94% |
| **First Load** | 3.2s | 1.1s | 66% |
| **Time to Interactive** | 4.5s | 1.8s | 60% |

---

## Related Documentation

- **[Resolvers](./resolvers.md)** - Auto-import configuration
- **[Setup Vue](./setup-vue.md)** - Vite configuration
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt module with theme strategies
- **[Theming](./theming.md)** - Theme strategy comparison
- **[SSR & SSG](./ssr-ssg.md)** - Server-side rendering optimization
- **[Icons](./icons.md)** - Icon tree-shaking

---

**Performance Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-14

::: tip Bundle Size Tip
Use auto-import resolvers for automatic tree-shaking and minimal bundle size. With resolvers, you only pay for what you use.
:::
