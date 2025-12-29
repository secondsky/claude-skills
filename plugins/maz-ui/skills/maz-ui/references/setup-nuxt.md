# Maz-UI Nuxt 3 Setup Guide

Zero-configuration Nuxt module for Maz-UI with auto-imports, theming, and i18n.

## Installation

```bash
# Using pnpm
pnpm add @maz-ui/nuxt

# Using npm
npm install @maz-ui/nuxt

# Using Nuxt CLI
pnpx nuxt@latest module add @maz-ui/nuxt
```

## Basic Setup

Add module to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
  // That's it! 🎉 Everything auto-imports
})
```

## Instant Usage (No Imports Needed)

```vue
<script setup>
// All composables auto-imported
const name = ref('')
const toast = useToast()
const { toggleDarkMode, isDark } = useTheme()
const { start, remainingTime } = useTimer({
  timeout: 4000,
  callback: () => console.log('Done!')
})
</script>

<template>
  <div class="maz-bg-background maz-p-8">
    <!-- All components auto-imported -->
    <MazInput v-model="name" label="Your Name" />

    <MazBtn color="primary" @click="toast.success('Saved!')">
      Save
    </MazBtn>

    <MazBtn @click="toggleDarkMode">
      {{ isDark ? '🌙' : '☀️' }} Toggle Theme
    </MazBtn>

    <!-- Directives available globally -->
    <div v-tooltip="'This is a tooltip'">
      Hover me
    </div>
  </div>
</template>
```

## Advanced Configuration

### Complete Configuration Example

```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    // 🔧 General Settings
    general: {
      autoImportPrefix: 'Maz', // useMazToast instead of useToast
      defaultMazIconPath: '/icons', // Path for <MazIcon />
      devtools: true, // Enable DevTools integration
    },

    // 🎨 CSS & Styling
    css: {
      injectMainCss: true, // Auto-inject Maz-UI styles
    },

    // 🌈 Theming System
    theme: {
      preset: 'maz-ui', // 'maz-ui' | 'dark' | 'ocean' | customTheme
      strategy: 'hybrid', // 'runtime' | 'buildtime' | 'hybrid' (recommended)
      darkModeStrategy: 'class', // 'class' | 'media' | 'auto'
      colorMode: 'auto', // 'light' | 'dark' | 'auto'
      mode: 'both', // 'light' | 'dark' | 'both'
      overrides: {
        foundation: {
          'radius': '0.7rem',
          'border-width': '0.0625rem',
        },
        colors: {
          light: {
            primary: '220 100% 50%',
            secondary: '220 14% 96%',
          },
          dark: {
            primary: '220 100% 70%',
            secondary: '220 14% 4%',
          }
        }
      },
    },

    // 🌐 Translations
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      messages: {
        // Override or add custom messages
      },
    },

    // 📦 Components (enabled by default)
    components: {
      autoImport: true, // All 50+ components globally available
    },

    // 🔌 Plugins (disabled by default, enable as needed)
    plugins: {
      aos: true, // Animations on scroll
      dialog: true, // Programmatic dialogs
      toast: true, // Notifications
      wait: true, // Loading states
    },

    // 🔧 Composables (enabled by default)
    composables: {
      useTheme: true,
      useTranslations: true,
      useToast: true,
      useDialog: true,
      useBreakpoints: true,
      useWindowSize: true,
      useTimer: true,
      useFormValidator: true,
      useIdleTimeout: true,
      useUserVisibility: true,
      useSwipe: true,
      useReadingTime: true,
      useStringMatching: true,
      useDisplayNames: true,
      useFreezeValue: true,
      useInjectStrict: true,
      useInstanceUniqId: true,
      useMountComponent: true,
    },

    // 📌 Directives (disabled by default, enable as needed)
    directives: {
      vTooltip: { position: 'top' },
      vClickOutside: true,
      vLazyImg: { threshold: 0.1 },
      vZoomImg: true,
      vFullscreenImg: true,
    },
  }
})
```

## Theme Strategies

Maz-UI offers three theme strategies optimized for different use cases:

### Hybrid Strategy (Recommended)

**Best for**: SSR/SSG applications with runtime theme switching

```typescript
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

### Dark Mode Strategies

#### Class Strategy (Recommended)

Uses `class="dark"` on `<html>` element:

```typescript
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

**Benefits**:
- ✅ Full control over dark mode
- ✅ Works with JavaScript disabled
- ✅ Persists across page loads (cookie)
- ✅ No flash on page load

---

#### Media Strategy

Uses `prefers-color-scheme` media query:

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      darkModeStrategy: 'media'
    }
  }
})
```

**Benefits**:
- ✅ Automatic based on system preferences
- ✅ No JavaScript required
- ❌ Cannot be toggled by user
- ❌ Follows system preference only

---

### Theme Strategy Comparison

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

**For detailed theme documentation**, load `references/theming.md`.

---

## SSR & SSG Considerations

Maz-UI v4 is fully compatible with Nuxt 3's Server-Side Rendering (SSR) and Static Site Generation (SSG), but requires proper configuration to avoid common pitfalls.

### Critical CSS for Instant Theming

The **hybrid strategy** (recommended) prevents Flash of Unstyled Content (FOUC) by injecting critical CSS during server rendering:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid', // ✅ Injects critical CSS on server
      darkModeStrategy: 'class'
    }
  }
})
```

**How it works**:
1. Server reads user preference from cookie (`maz-ui-dark-mode`)
2. Generates critical CSS with correct theme variables
3. Injects `<style data-maz-ui-critical>` in `<head>`
4. User sees correct theme instantly (no flash)

### Preventing Hydration Mismatches

Some Maz-UI components use browser APIs and must only render on the client:

```vue
<template>
  <!-- ✅ CORRECT: Wrap client-only components -->
  <ClientOnly>
    <MazDialogConfirm />
    <MazToast />
    <MazWaitOverlay />
  </ClientOnly>

  <!-- ❌ WRONG: Dialog/Toast on server causes hydration errors -->
  <MazDialogConfirm />
</template>
```

**Why?** Dialog, Toast, and Wait plugins use `window`, `document` APIs not available during SSR.

### Dark Mode Without Flash

To prevent dark mode flash on page load, use **hybrid strategy** with **class dark mode**:

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid', // Server reads cookie
      darkModeStrategy: 'class' // class="dark" on <html>
    }
  }
})
```

Server checks `maz-ui-dark-mode` cookie → applies correct theme → no flash on hydration.

### Translation Hydration Issues

**CRITICAL**: Always provide initial locale immediately (not as async function) to prevent hydration mismatches:

```typescript
import { fr } from '@maz-ui/translations'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      messages: {
        // ✅ CORRECT: Immediate import
        fr,

        // ✅ Other languages can be lazy
        en: () => import('@maz-ui/translations/locales/en')
      }
    }
  }
})
```

### Static Site Generation (SSG)

For SSG, use **buildtime strategy** for smallest bundle:

```typescript
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/', '/about', '/contact']
    }
  },

  mazUi: {
    theme: {
      strategy: 'buildtime' // ✅ Smallest bundle for static sites
    }
  }
})
```

**Trade-off**: No runtime theme switching, but optimal performance for static content.

### Common SSR/SSG Pitfalls

1. **Hydration mismatch**: Using `window`/`document` in SSR → Use `<ClientOnly>` or `onMounted()`
2. **FOUC (Flash of Unstyled Content)**: Wrong theme strategy → Use `hybrid` strategy
3. **Dark mode flash**: Server/client theme mismatch → Use `hybrid` + `class` dark mode
4. **Translation errors**: Async locale in SSR → Import initial locale immediately

**For comprehensive SSR/SSG patterns, troubleshooting, and advanced configurations**, load `references/ssr-ssg.md`.

---

## Custom Theme Creation

```typescript
import { definePreset } from '@maz-ui/themes'

export const customTheme = definePreset({
  base: 'maz-ui',
  name: 'custom',
  foundation: {
    'base-font-size': '14px',
    'font-family': 'Manrope, sans-serif',
    'radius': '0.7rem',
    'border-width': '0.0625rem',
  },
  colors: {
    light: {
      primary: '350 100% 50%', // Pink
      secondary: '350 14% 96%',
      background: '0 0% 100%',
      foreground: '222 84% 5%',
      muted: '210 40% 96%',
      accent: '210 40% 90%',
      destructive: '0 84% 60%',
      border: '214 32% 91%',
      input: '214 32% 91%',
      ring: '350 100% 50%',
    },
    dark: {
      primary: '350 100% 70%',
      secondary: '350 14% 4%',
      background: '222 84% 5%',
      foreground: '210 40% 98%',
      muted: '217 33% 17%',
      accent: '217 33% 17%',
      destructive: '0 62% 30%',
      border: '217 33% 17%',
      input: '217 33% 17%',
      ring: '350 100% 70%',
    }
  },
})

export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    theme: {
      preset: customTheme,
      strategy: 'hybrid',
    }
  }
})
```

## Translations & i18n

Maz-UI includes 8 built-in languages (en, fr, es, de, it, pt, ja, zh-CN) with automatic lazy loading.

### Basic Setup

```typescript
import { fr, es } from '@maz-ui/translations'

export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      preloadFallback: true, // Default - preload fallback language
      messages: {
        // Import immediately to avoid hydration issues
        fr,
        es
      }
    }
  }
})
```

### preloadFallback Option

**Default (`preloadFallback: true`)** - Recommended:
- ✅ No delay - Fallback translations immediately available
- ✅ Smooth experience - No missing text
- ✅ Zero hydration issues in SSR
- ❌ Slightly larger initial bundle

**Disabled (`preloadFallback: false`)** - For bundle size optimization:
- ✅ Smaller initial bundle
- ❌ May temporarily show translation keys
- ❌ Requires loading state management

```typescript
export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      preloadFallback: false, // Optimize bundle size
      messages: {
        // Still provide initial locale to avoid hydration issues
        fr
      }
    }
  }
})
```

### Lazy Loading Strategies

#### Method 1: Dynamic Imports (Recommended)

```typescript
export default defineNuxtConfig({
  mazUi: {
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
  }
})
```

#### Method 2: API-Based Loading

```typescript
export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'en',
      messages: {
        // Load from API
        fr: async () => {
          const response = await $fetch('/api/translations/fr')
          return response
        },

        // Combine multiple sources
        es: async () => {
          const [defaultTranslations, customTranslations] = await Promise.all([
            import('@maz-ui/translations/locales/es').then(m => m.default),
            $fetch('/api/translations/es/custom')
          ])
          return { ...defaultTranslations, ...customTranslations }
        }
      }
    }
  }
})
```

#### Method 3: Mix Immediate and Lazy Loading

```typescript
import { fr } from '@maz-ui/translations'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      messages: {
        // French: loaded immediately (important for SSR)
        fr,

        // Others: loaded lazily
        en: () => import('@maz-ui/translations/locales/en'),
        es: () => import('@maz-ui/translations/locales/es')
      }
    }
  }
})
```

### Using Translations in Components

```vue
<script setup>
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
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Language switcher -->
    <MazBtn
      :disabled="isLoading"
      @click="switchLanguage('fr')"
    >
      🇫🇷 {{ isLoading && locale === 'fr' ? 'Loading...' : 'Français' }}
    </MazBtn>
    <MazBtn
      :disabled="isLoading"
      @click="switchLanguage('es')"
    >
      🇪🇸 {{ isLoading && locale === 'es' ? 'Cargando...' : 'Español' }}
    </MazBtn>

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

### SSR Considerations

**CRITICAL**: In SSR/SSG, always provide the initial locale in `messages` to avoid hydration mismatches:

```typescript
import { fr } from '@maz-ui/translations'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      messages: {
        // ✅ Provide initial locale immediately (not as function)
        fr,

        // ✅ Other languages can be lazy-loaded
        en: () => import('@maz-ui/translations/locales/en'),
        es: () => import('@maz-ui/translations/locales/es')
      }
    }
  }
})
```

**Why?** If translations load asynchronously during SSR, the server-rendered HTML won't match client-side rendering, causing hydration warnings.

### Browser Language Detection

```typescript
// composables/useLanguageDetection.ts
export function useLanguageDetection() {
  function detectUserLanguage() {
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

  return { detectUserLanguage }
}
```

Usage in plugin:

```typescript
// plugins/language-detection.client.ts
export default defineNuxtPlugin(() => {
  const { detectUserLanguage } = useLanguageDetection()
  const { setLocale } = useTranslations()

  // Detect and set language on client side
  const detectedLang = detectUserLanguage()
  setLocale(detectedLang)
})
```

### Custom Translation Files

Create separate files in your Nuxt project:

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

Then import in config:

```typescript
import customFr from './locales/fr'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      messages: {
        fr: customFr // Use your custom translations
      }
    }
  }
})
```

### Important Notes

1. **8 built-in languages load automatically** - fr, es, de, it, pt, ja, zh-CN don't need to be provided unless you want to override them
2. **Lazy loading is asynchronous** - `setLocale()` returns a Promise, use `await`
3. **Translations are cached** - Once loaded, switching back is instant
4. **SSR requires immediate initial locale** - Provide initial locale as object, not function
5. **Partial translations supported** - Provide only what you want to override
6. **Variables replaced automatically** - `{example}`, `{count}`, `{page}` handled by Maz-UI

For complete translation keys reference and advanced patterns, load `references/translations.md`.

## Using Composables

All composables are auto-imported:

```vue
<script setup>
// Theme management
const { toggleDarkMode, isDark, setColorMode } = useTheme()

// Toast notifications
const toast = useToast()
toast.success('Operation successful!')
toast.error('Something went wrong')
toast.warning('Please be careful')
toast.info('Just so you know')

// Dialog prompts
const dialog = useDialog()
const confirmed = await dialog.confirm({
  title: 'Delete Item',
  message: 'Are you sure?',
  confirmText: 'Delete',
  cancelText: 'Cancel'
})

// Responsive breakpoints
const { isMobile, isTablet, isDesktop } = useBreakpoints()

// Window size
const { width, height } = useWindowSize()

// Timer
const { start, stop, pause, resume, remainingTime } = useTimer({
  timeout: 5000,
  callback: () => console.log('Timer ended!')
})

// Form validation (Valibot)
import { string, email } from 'valibot'

const { errors, validate } = useFormValidator({
  schema: {
    email: [string(), email()],
    password: [string(), minLength(8)]
  }
})

// Translations
const { t, locale, setLocale } = useTranslations()
const greeting = t('common.greeting')
</script>
```

## Using Plugins

### Toast Plugin

Enable in config:

```typescript
export default defineNuxtConfig({
  mazUi: {
    plugins: {
      toast: true
    }
  }
})
```

Usage:

```vue
<script setup>
const toast = useToast()

function notify() {
  toast.success('Saved successfully!', {
    timeout: 3000,
    position: 'top-right',
    button: {
      text: 'Undo',
      onClick: () => console.log('Undone'),
      closeToast: true
    }
  })
}
</script>
```

### Dialog Plugin

Enable in config:

```typescript
export default defineNuxtConfig({
  mazUi: {
    plugins: {
      dialog: true
    }
  }
})
```

Usage:

```vue
<script setup>
const dialog = useDialog()

async function confirmDelete() {
  const result = await dialog.confirm({
    title: 'Confirm Delete',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'destructive'
  })

  if (result) {
    // Perform deletion
  }
}
</script>
```

### AOS Plugin (Animations on Scroll)

Enable in config:

```typescript
export default defineNuxtConfig({
  mazUi: {
    plugins: {
      aos: true
    }
  }
})
```

Usage in templates:

```vue
<template>
  <div
    data-maz-aos="fade-in"
    data-maz-aos-delay="100"
    data-maz-aos-duration="300"
  >
    Animated content
  </div>
</template>
```

### Wait Plugin (Loading States)

Enable in config:

```typescript
export default defineNuxtConfig({
  mazUi: {
    plugins: {
      wait: true
    }
  }
})
```

Usage:

```vue
<script setup>
const wait = useWait()

async function fetchData() {
  wait.start('loading-data')
  try {
    const data = await $fetch('/api/data')
    return data
  } finally {
    wait.end('loading-data')
  }
}
</script>

<template>
  <MazBtn
    :loading="wait.is('loading-data')"
    @click="fetchData"
  >
    Fetch Data
  </MazBtn>
</template>
```

## Using Directives

Enable directives in config:

```typescript
export default defineNuxtConfig({
  mazUi: {
    directives: {
      vTooltip: true,
      vClickOutside: true,
      vLazyImg: true,
      vZoomImg: true,
      vFullscreenImg: true,
    }
  }
})
```

Usage:

```vue
<template>
  <!-- Tooltip -->
  <MazBtn v-tooltip="'Click me for action'">
    Action
  </MazBtn>

  <!-- With options -->
  <MazBtn v-tooltip="{ text: 'Bottom tooltip', position: 'bottom' }">
    Hover me
  </MazBtn>

  <!-- Click outside detector -->
  <div v-click-outside="handleClickOutside">
    <MazBtn @click="isOpen = true">Open</MazBtn>
    <div v-if="isOpen">Dropdown content</div>
  </div>

  <!-- Lazy image loading -->
  <img v-lazy-img="imageUrl" alt="Description" />

  <!-- Zoom image on click -->
  <img v-zoom-img="imageUrl" alt="Zoomable" />

  <!-- Fullscreen image viewer -->
  <img v-fullscreen-img="imageUrl" alt="Fullscreen" />
</template>
```

## Translations (i18n)

Configure locales:

```typescript
export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      messages: {
        // Add custom messages or override defaults
        fr: {
          custom: {
            greeting: 'Bonjour'
          }
        }
      }
    }
  }
})
```

Usage:

```vue
<script setup>
const { t, locale, setLocale } = useTranslations()
</script>

<template>
  <div>
    <p>{{ t('custom.greeting') }}</p>
    <p>Current locale: {{ locale }}</p>

    <MazBtn @click="setLocale('en')">English</MazBtn>
    <MazBtn @click="setLocale('fr')">Français</MazBtn>
  </div>
</template>
```

## Common Issues

### 1. `useTheme` Error

**Error**: `"useTheme must be used within MazUi plugin installation"`
**Solution**: Ensure theme composable is enabled:

```typescript
export default defineNuxtConfig({
  mazUi: {
    composables: {
      useTheme: true
    },
    theme: {
      preset: 'maz-ui' // Not false
    }
  }
})
```

### 2. Auto-Imports Not Working

**Error**: Components/composables not found
**Solution**:
1. Clear Nuxt cache: `rm -rf .nuxt node_modules/.cache`
2. Reinstall: `pnpm install`
3. Restart dev server

### 3. Styles Not Applied

**Error**: Components render without styling
**Solution**: Ensure CSS injection is enabled:

```typescript
export default defineNuxtConfig({
  mazUi: {
    css: {
      injectMainCss: true // Must be true
    }
  }
})
```

### 4. TypeScript Errors

**Error**: Type errors with components
**Solution**: Ensure `.nuxt` folder exists and types are generated.
Run: `pnpm nuxi prepare`

## Performance Optimization

### Enable Only What You Need

```typescript
export default defineNuxtConfig({
  mazUi: {
    // Disable unused composables
    composables: {
      useIdleTimeout: false,
      useReadingTime: false,
      useStringMatching: false,
    },
    // Enable only required plugins
    plugins: {
      toast: true,
      dialog: false,
      aos: false,
      wait: false,
    }
  }
})
```

### Prefix to Avoid Conflicts

```typescript
export default defineNuxtConfig({
  mazUi: {
    general: {
      autoImportPrefix: 'Maz' // useMazToast, useMazTheme, etc.
    }
  }
})
```

## Next Steps

- **Theming**: Load `theming.md` for custom themes and dark mode
- **Components**: Load `components-*.md` for component guides
- **Troubleshooting**: Load `troubleshooting.md` for common issues
