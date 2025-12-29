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

### Hybrid (Recommended)

Best performance with zero FOUC (Flash of Unstyled Content):

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid', // ✅ Recommended
      preset: 'maz-ui'
    }
  }
})
```

**How it works**:
- Critical CSS injected immediately (server-side if SSR enabled)
- Full CSS loaded asynchronously via `requestIdleCallback` (100ms timeout)
- Zero visual flash, optimal performance

### Runtime

Immediate CSS injection:

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'runtime', // Use when you need immediate full styling
      preset: 'maz-ui'
    }
  }
})
```

**When to use**: Dynamic themes that change frequently

### Buildtime

Build-time CSS generation (manual inclusion required):

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'buildtime', // Static sites with predefined themes
      preset: 'maz-ui'
    }
  }
})
```

**When to use**: Static sites without theme switching

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
