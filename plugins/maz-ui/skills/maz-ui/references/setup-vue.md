# Maz-UI Vue 3 Setup Guide

Complete installation and configuration guide for using Maz-UI in Vue 3 projects.

## Installation

```bash
# Using pnpm (recommended)
pnpm add maz-ui @maz-ui/themes

# Using npm
npm install maz-ui @maz-ui/themes

# Using yarn
yarn add maz-ui @maz-ui/themes
```

## Basic Setup

### 1. Install MazUi Plugin

Create or edit your `main.ts` file:

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'
import { en } from '@maz-ui/translations'
import App from './App.vue'

// Import Maz-UI styles BEFORE your own CSS
import 'maz-ui/styles'
import './style.css'

const app = createApp(App)

app.use(MazUi, {
  theme: {
    preset: mazUi
  },
  translations: {
    messages: { en }
  }
})

app.mount('#app')
```

### 2. Use Components

```vue
<script setup lang="ts">
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { ref } from 'vue'

const name = ref('')

function handleSubmit() {
  console.log('Name:', name.value)
}
</script>

<template>
  <div class="maz-flex maz-flex-col maz-gap-4">
    <MazInput
      v-model="name"
      label="Your Name"
      placeholder="Enter your name"
    />
    <MazBtn color="primary" @click="handleSubmit">
      Submit
    </MazBtn>
  </div>
</template>
```

## Advanced Configuration

### With Custom Theme

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes/presets'
import { fr } from '@maz-ui/translations'
import 'maz-ui/styles'
import './style.css'

app.use(MazUi, {
  theme: {
    preset: mazUi, // or 'ocean' | 'pristine' | 'obsidian'
    overrides: {
      foundation: {
        'radius': '0.7rem',
        'border-width': '0.0625rem',
      },
      colors: {
        light: {
          primary: '220 100% 50%', // Custom blue
        },
        dark: {
          primary: '220 100% 70%',
        }
      }
    }
  },
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    messages: { fr },
  },
})
```

## Translations & i18n

Maz-UI includes 8 built-in languages (en, fr, es, de, it, pt, ja, zh-CN) with automatic lazy loading.

### Basic Setup

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { fr } from '@maz-ui/translations'
import 'maz-ui/styles'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    preloadFallback: true, // Default - preload fallback language
    messages: {
      fr // Immediate load to avoid hydration issues
    }
  }
})
```

### preloadFallback Option

**Default (`preloadFallback: true`)** - Recommended:
- ✅ No delay - Fallback translations immediately available
- ✅ Smooth experience - No missing text even if translation doesn't exist
- ❌ Slightly larger initial bundle

**Disabled (`preloadFallback: false`)** - For bundle size optimization:
- ✅ Smaller initial bundle
- ❌ May temporarily show translation keys
- ❌ Requires loading state management

### Lazy Loading Strategies

#### Method 1: Dynamic Imports (Recommended)

```typescript
app.use(MazUi, {
  translations: {
    locale: 'en',
    fallbackLocale: 'en',
    preloadFallback: false,
    messages: {
      // Built-in languages load automatically
      fr: () => import('@maz-ui/translations/locales/fr'),
      es: () => import('@maz-ui/translations/locales/es'),
      de: () => import('@maz-ui/translations/locales/de'),

      // Custom language files
      nl: () => import('./locales/nl.ts').then(m => m.default)
    }
  }
})
```

#### Method 2: API-Based Loading

```typescript
app.use(MazUi, {
  translations: {
    locale: 'en',
    messages: {
      // Load from API
      fr: async () => {
        const response = await fetch('/api/translations/fr')
        return response.json()
      },

      // Combine multiple sources
      es: async () => {
        const [defaultTranslations, customTranslations] = await Promise.all([
          import('@maz-ui/translations/locales/es').then(m => m.default),
          fetch('/api/translations/es/custom').then(r => r.json())
        ])
        return { ...defaultTranslations, ...customTranslations }
      }
    }
  }
})
```

#### Method 3: Mix Immediate and Lazy Loading

```typescript
import { fr } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    messages: {
      // French: loaded immediately
      fr,

      // Others: loaded lazily
      en: () => import('@maz-ui/translations/locales/en'),
      es: () => import('@maz-ui/translations/locales/es')
    }
  }
})
```

### Using Translations in Components

```vue
<script setup>
import { useTranslations } from '@maz-ui/translations'
import { ref } from 'vue'

const { locale, setLocale } = useTranslations()
const isLoading = ref(false)

// Change language with loading state
async function switchLanguage(newLocale) {
  isLoading.value = true
  try {
    await setLocale(newLocale) // Loads translations if needed
    console.log(`Language changed to ${newLocale}`)
  } catch (error) {
    console.error('Failed to load translations:', error)
    // Handle error (show toast, etc.)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Language switcher -->
    <button
      :disabled="isLoading"
      @click="switchLanguage('fr')"
    >
      🇫🇷 {{ isLoading && locale === 'fr' ? 'Loading...' : 'Français' }}
    </button>
    <button
      :disabled="isLoading"
      @click="switchLanguage('es')"
    >
      🇪🇸 {{ isLoading && locale === 'es' ? 'Cargando...' : 'Español' }}
    </button>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay">
      Loading translations...
    </div>

    <!-- Current language -->
    <p>Current: {{ locale }}</p>

    <!-- Components use translations automatically -->
    <MazInputPhoneNumber />
  </div>
</template>
```

### Error Handling for Async Language Switching

```vue
<script setup>
import { useTranslations } from '@maz-ui/translations'
import { useToast } from 'maz-ui/composables'

const { setLocale } = useTranslations()
const toast = useToast()

async function switchLanguage(locale) {
  try {
    await setLocale(locale)
    toast.success(`Language changed to ${locale}`)
  } catch (error) {
    console.error('Translation loading error:', error)
    toast.error('Failed to load translations. Please try again.')
  }
}
</script>
```

### Browser Language Detection

```typescript
async function detectUserLanguage() {
  try {
    const browserLang = navigator.language.split('-')[0]
    const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh']

    if (supportedLanguages.includes(browserLang)) {
      return browserLang
    }

    return 'en' // Fallback
  } catch {
    return 'en'
  }
}

// Use automatic detection
app.use(MazUi, {
  translations: {
    locale: await detectUserLanguage(),
    messages: {
      fr: () => import('@maz-ui/translations/locales/fr'),
      es: () => import('@maz-ui/translations/locales/es')
    }
  }
})
```

### Custom Translation Files

Create separate files for each language:

```typescript
// locales/fr.ts
export default {
  inputPhoneNumber: {
    countrySelect: {
      placeholder: 'Code pays',
      error: 'Choisir le pays',
      searchPlaceholder: 'Rechercher le pays'
    },
    phoneInput: {
      placeholder: 'Numéro de téléphone',
      example: 'Exemple: {example}'
    }
  },
  dropzone: {
    dragAndDrop: 'Déposez vos fichiers',
    selectFile: 'sélectionner un fichier',
    divider: 'ou'
  }
  // You can omit translations you don't want to override
  // Default Maz-UI translations will be used automatically
}
```

### Important Notes

1. **8 built-in languages load automatically** - fr, es, de, it, pt, ja, zh-CN don't need to be provided unless you want to override them
2. **Lazy loading is asynchronous** - `setLocale()` returns a Promise, use `await`
3. **Translations are cached** - Once loaded, switching back is instant
4. **Partial translations supported** - Provide only what you want to override
5. **Variables replaced automatically** - `{example}`, `{count}`, `{page}` handled by Maz-UI

For complete translation keys reference and advanced patterns, load `references/translations.md`.

## Auto-Import Setup (Recommended)

For optimal DX, use auto-imports to avoid manual component imports.

### Install Dependencies

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

### Configure Vite

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),

    // Auto-import components
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: true, // Generate type definitions
    }),

    // Auto-import composables and utilities
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true,
    }),
  ],
})
```

### Use Without Imports

```vue
<script setup>
// No imports needed! All auto-imported:
const name = ref('')
const toast = useToast() // Auto-imported composable
const { toggleDarkMode } = useTheme()

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)

function handleClickOutside() {
  toast.info('Clicked outside!')
}
</script>

<template>
  <!-- Auto-imported components -->
  <MazInput v-model="name" placeholder="Type here..." />
  <MazBtn @click="toggleDarkMode">Toggle Dark Mode</MazBtn>

  <!-- Auto-imported directives -->
  <div v-click-outside="handleClickOutside">
    Click outside detector
  </div>

  <MazBtn v-tooltip="'This is a tooltip'">
    Hover me
  </MazBtn>
</template>
```

## Available Resolvers

| Resolver | Purpose | Import |
|----------|---------|--------|
| `MazComponentsResolver` | Components (MazBtn, MazInput, etc.) | `'maz-ui/resolvers'` |
| `MazDirectivesResolver` | Directives (v-click-outside, v-tooltip, etc.) | `'maz-ui/resolvers'` |
| `MazModulesResolver` | Composables & utilities (useToast, debounce, etc.) | `'maz-ui/resolvers'` |

### Resolver Options

Each resolver supports advanced configuration:

```typescript
MazComponentsResolver({
  prefix: '',         // Component prefix (default: '')
  exclude: [],        // Exclude specific components
  include: [],        // Only include specific components
})

MazDirectivesResolver({
  prefix: 'Maz',      // Directive prefix (default: '')
})

MazModulesResolver({
  prefix: 'Maz',      // Composable/util prefix (default: '')
  exclude: [],        // Exclude specific modules
})
```

### Avoiding Naming Conflicts

Use the `prefix` option to prevent conflicts with other libraries:

```typescript
export default defineConfig({
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver({ prefix: 'Maz' }), // v-maz-tooltip
      ],
    }),
    AutoImport({
      resolvers: [
        MazModulesResolver({ prefix: 'Maz' }), // useMazToast, useMazTheme
      ],
    }),
  ],
})
```

### Advanced Resolver Configuration

#### Include/Exclude Specific Components

```typescript
Components({
  resolvers: [
    MazComponentsResolver({
      // Only auto-import form components
      include: ['MazInput', 'MazSelect', 'MazTextarea', 'MazCheckbox']
    }),

    // Or exclude heavy components
    MazComponentsResolver({
      exclude: ['MazCarousel', 'MazGallery', 'MazTable']
    })
  ]
})
```

#### Multiple Resolvers for Different Namespaces

```typescript
Components({
  resolvers: [
    // Maz-UI components
    MazComponentsResolver(),

    // Other UI library
    ElementPlusResolver(),
  ]
})
```

#### Webpack Configuration

```javascript
// webpack.config.js
const Components = require('unplugin-vue-components/webpack')
const AutoImport = require('unplugin-auto-import/webpack')
const { MazComponentsResolver, MazModulesResolver } = require('maz-ui/resolvers')

module.exports = {
  plugins: [
    Components({
      resolvers: [MazComponentsResolver()],
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
    }),
  ],
}
```

**For complete resolver documentation** including Rollup, esbuild configurations, and troubleshooting, load `references/resolvers.md`.

## Using Plugins

### Toast Plugin

```typescript
// main.ts
import { MazToast } from 'maz-ui/plugins/toast'
import 'maz-ui/styles' // Already includes toast styles

app.use(MazToast, {
  position: 'top-right',
  timeout: 3000,
})
```

Usage in components:

```vue
<script setup>
import { useToast } from 'maz-ui/composables'

const toast = useToast()

function showNotification() {
  toast.success('Operation successful!')
  toast.error('Something went wrong')
  toast.warning('Please be careful')
  toast.info('Just so you know')
}
</script>
```

### Dialog Plugin

```typescript
// main.ts
import { MazDialog } from 'maz-ui/plugins/dialog'
import 'maz-ui/styles'

app.use(MazDialog)
```

Usage:

```vue
<script setup>
import { useDialog } from 'maz-ui/composables'

const dialog = useDialog()

async function confirmDelete() {
  const confirmed = await dialog.confirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    // Perform deletion
  }
}
</script>
```

### AOS Plugin (Animations on Scroll)

```typescript
// main.ts
import { MazAos } from 'maz-ui/plugins/aos'
import 'maz-ui/styles'

app.use(MazAos, {
  animation: 'fade-in',
  duration: 300,
})
```

Usage:

```vue
<template>
  <div data-maz-aos="fade-in" data-maz-aos-delay="100">
    Content with animation
  </div>
</template>
```

### Wait Plugin (Loading States)

```typescript
// main.ts
import { MazWait } from 'maz-ui/plugins/wait'
import 'maz-ui/styles'

app.use(MazWait)
```

Usage:

```vue
<script setup>
import { useWait } from 'maz-ui/composables'

const wait = useWait()

async function fetchData() {
  wait.start('fetching')
  try {
    const data = await fetch('/api/data')
    return data
  } finally {
    wait.end('fetching')
  }
}
</script>

<template>
  <MazBtn :loading="wait.is('fetching')" @click="fetchData">
    Fetch Data
  </MazBtn>
</template>
```

## Using Directives

### Tooltip

```typescript
// main.ts
import { vTooltip } from 'maz-ui/directives'

app.directive('tooltip', vTooltip)
```

Usage:

```vue
<template>
  <MazBtn v-tooltip="'Click me for action'">
    Action
  </MazBtn>

  <!-- With options -->
  <MazBtn v-tooltip="{ text: 'Bottom tooltip', position: 'bottom' }">
    Hover me
  </MazBtn>
</template>
```

### Click Outside

```typescript
// main.ts
import { vClickOutside } from 'maz-ui/directives'

app.directive('click-outside', vClickOutside)
```

Usage:

```vue
<script setup>
const isOpen = ref(false)

function handleClickOutside() {
  isOpen.value = false
}
</script>

<template>
  <div v-click-outside="handleClickOutside">
    <MazBtn @click="isOpen = true">Open</MazBtn>
    <div v-if="isOpen">
      Dropdown content
    </div>
  </div>
</template>
```

### Lazy Image

```typescript
// main.ts
import { vLazyImg } from 'maz-ui/directives'

app.directive('lazy-img', vLazyImg)
```

Usage:

```vue
<template>
  <img v-lazy-img="imageUrl" alt="Description" />
</template>
```

## Tree-Shaking Optimization

### Direct Imports (Most Optimized)

```typescript
// ✅✅✅ Best - smallest bundle size
import MazBtn from 'maz-ui/components/MazBtn'
import MazCard from 'maz-ui/components/MazCard'
import MazInput from 'maz-ui/components/MazInput'
import { useToast } from 'maz-ui/composables/useToast'
import { vClickOutside } from 'maz-ui/directives/vClickOutside'
```

### Index Imports (Good)

```typescript
// ✅ Good - tree-shakable
import { MazBtn, MazCard, MazInput } from 'maz-ui/components'
import { useToast, useBreakpoints } from 'maz-ui/composables'
```

### Avoid (Not Tree-Shakable)

```typescript
// ❌ Imports everything - large bundle
import * as MazUI from 'maz-ui'
```

## TypeScript Support

Maz-UI is written in TypeScript and provides full type definitions out of the box.

### Type Imports

```typescript
import type { MazBtnProps } from 'maz-ui/components/MazBtn'
import type { ToastOptions } from 'maz-ui/types'

// Component props types
const buttonProps: MazBtnProps = {
  color: 'primary',
  size: 'md',
  loading: false
}

// Toast options type
const toastOptions: ToastOptions = {
  position: 'top-right',
  timeout: 3000,
  persistent: false
}
```

## Performance Optimization

### Bundle Size Optimization

Maz-UI v4 achieves **60-90% bundle size reduction** through optimal tree-shaking and modular architecture.

#### Auto-Import with Resolvers (Recommended)

Using resolvers provides the best bundle optimization:

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { MazComponentsResolver, MazModulesResolver } from 'maz-ui/resolvers'

export default defineConfig({
  plugins: [
    Components({
      resolvers: [MazComponentsResolver()],
      dts: true
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true
    })
  ]
})
```

**Result**: Only imports components you actually use

```vue
<template>
  <!-- Only MazBtn and MazInput are bundled -->
  <MazBtn>Click</MazBtn>
  <MazInput v-model="name" />
</template>
```

**Bundle size**: ~15KB (vs ~300KB without tree-shaking)

---

#### Manual Import Optimization

If not using auto-imports, prefer individual imports:

```typescript
// ✅ BEST: Individual imports
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { useToast } from 'maz-ui/composables/useToast'

// ✅ GOOD: Batch imports (still tree-shakable)
import { MazBtn, MazInput } from 'maz-ui/components'

// ❌ AVOID: Imports everything
import * as MazUI from 'maz-ui'
```

---

### Lazy Loading Components

Defer loading heavy components until needed:

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
      <MazCircularProgressBar />
    </template>
  </Suspense>
</template>
```

---

### Code Splitting

Configure Vite for optimal code splitting:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'maz-ui-core': [
            'maz-ui/components/MazBtn',
            'maz-ui/components/MazInput'
          ],
          'maz-ui-forms': [
            'maz-ui/components/MazSelect',
            'maz-ui/components/MazTextarea',
            'maz-ui/components/MazCheckbox'
          ]
        }
      }
    }
  }
})
```

---

### Theme Optimization

Load only the theme you need:

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes/presets'

app.use(MazUi, {
  theme: {
    preset: mazUi // ~5KB
    // Don't load other presets unless needed
  }
})
```

---

### Translation Optimization

Lazy load translations:

```typescript
app.use(MazUi, {
  translations: {
    locale: 'en',
    messages: {
      // Load French only when needed
      fr: () => import('@maz-ui/translations/locales/fr'),
      es: () => import('@maz-ui/translations/locales/es')
    }
  }
})
```

---

### Icon Optimization

Use individual icon imports:

```bash
npm install @maz-ui/icons
```

```typescript
// ✅ OPTIMAL: Import specific icons
import { IconHome, IconUser } from '@maz-ui/icons'
```

```vue
<template>
  <MazIcon :src="IconHome" />
</template>
```

**Bundle**: ~1KB per icon (vs ~50KB for all icons)

---

### Production Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
      }
    },
    cssCodeSplit: true, // Split CSS per component
  }
})
```

---

### Performance Checklist

- [ ] **Auto-import resolvers** configured
- [ ] **Tree-shaking** verified (only used components bundled)
- [ ] **Lazy loading** for heavy components (MazCarousel, MazGallery, MazTable)
- [ ] **Code splitting** configured
- [ ] **Theme** loaded selectively (one preset)
- [ ] **Translations** lazy loaded
- [ ] **Icons** imported individually (@maz-ui/icons)
- [ ] **Production build** minified and optimized
- [ ] **Bundle size** <250KB for full app

**For comprehensive performance optimization**, load `references/performance.md`.

---

## Common Setup Issues

### 1. Styles Not Loading

**Problem**: Components render but have no styling
**Solution**: Ensure `'maz-ui/styles'` is imported in `main.ts` BEFORE your CSS

```typescript
import 'maz-ui/styles' // Must come first
import './style.css'
```

### 2. TypeScript Errors

**Problem**: `Cannot find module 'maz-ui/components/MazBtn'`
**Solution**: Add Maz-UI types to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["maz-ui/types"]
  }
}
```

### 3. Auto-Import Not Working

**Problem**: Components not auto-imported despite resolver configuration
**Solution**:
1. Ensure resolvers are correctly added to `vite.config.ts`
2. Restart dev server
3. Check generated `.d.ts` files are created

### 4. Theme Not Applied

**Problem**: `useTheme()` throws error about plugin not installed
**Solution**: Verify MazUi plugin is installed with theme config:

```typescript
app.use(MazUi, {
  theme: { preset: mazUi }
})
```

## Next Steps

- **Theming**: Load `theming.md` for custom themes and dark mode
- **Components**: Load `components-*.md` for specific component guides
- **i18n**: Load `translations.md` for multi-language support
- **Nuxt**: Load `setup-nuxt.md` for Nuxt-specific setup
