# Maz-UI Troubleshooting Guide

Common errors, solutions, and debugging tips for Maz-UI.

## Installation & Setup Errors

### 1. Module Not Found: 'maz-ui'

**Error**:
```
Cannot find module 'maz-ui' or its corresponding type declarations
```

**Causes & Solutions**:

✅ **Verify installation**:
```bash
# Check if installed
npm list maz-ui

# Reinstall if needed
pnpm add maz-ui @maz-ui/themes
```

✅ **Clear cache** (if using Nuxt):
```bash
rm -rf .nuxt node_modules/.cache
pnpm install
```

✅ **Check import path**:
```typescript
// ✅ Correct
import MazBtn from 'maz-ui/components/MazBtn'

// ❌ Wrong
import MazBtn from 'maz-ui/MazBtn'
```

### 2. useTheme Must Be Used Within MazUi Plugin

**Error**:
```
useTheme must be used within MazUi plugin installation
```

**Vue Solution**:
```typescript
// main.ts
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'

app.use(MazUi, {
  theme: { preset: mazUi } // Must have theme config
})
```

**Nuxt Solution**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    composables: {
      useTheme: true // Must be enabled
    },
    theme: {
      preset: 'maz-ui' // Not false
    }
  }
})
```

### 3. Styles Not Applied / Components Render Unstyled

**Error**: Components render but have no styling

**Vue Solution**:
```typescript
// main.ts - Import CSS BEFORE your own styles
import 'maz-ui/styles' // ✅ Must come first
import './style.css'
```

**Nuxt Solution**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  mazUi: {
    css: {
      injectMainCss: true // ✅ Must be true
    }
  }
})
```

**Verify CSS is loaded**:
1. Open DevTools
2. Check Network tab for `maz-ui` CSS file
3. Inspect element and look for `maz-` CSS classes

## Component-Specific Errors

### 4. MazInputPhoneNumber: Country Detection Fails

**Error**: Phone input doesn't show country flags or validate

**Cause**: Missing `libphonenumber-js` dependency

**Solution**:
```bash
# Install peer dependency
pnpm add libphonenumber-js
```

**Usage**:
```vue
<template>
  <MazInputPhoneNumber
    v-model="phone"
    default-country-code="US"
    :preferred-countries="['US', 'CA', 'GB']"
    @update="handleUpdate"
  />
</template>
```

### 5. MazDialog/MazToast Not Working

**Error**: Toast/Dialog functions throw errors

**Vue Solution**:
```typescript
// Install plugins
import { MazToast } from 'maz-ui/plugins/toast'
import { MazDialog } from 'maz-ui/plugins/dialog'

app.use(MazToast)
app.use(MazDialog)
```

**Nuxt Solution**:
```typescript
export default defineNuxtConfig({
  mazUi: {
    plugins: {
      toast: true,
      dialog: true
    }
  }
})
```

### 6. MazIcon: Icons Not Displaying

**Error**: Icons show as empty squares or don't render

**Cause**: Icon path not configured or SVG files missing

**Solution**:

Option 1: **Use @maz-ui/icons package**:
```bash
pnpm add @maz-ui/icons
```

```vue
<script setup>
import MazStar from '@maz-ui/icons/star'
</script>

<template>
  <MazIcon :src="MazStar" />
</template>
```

Option 2: **Configure icon path**:
```typescript
// Nuxt
export default defineNuxtConfig({
  mazUi: {
    general: {
      defaultMazIconPath: '/icons' // Point to your icons folder
    }
  }
})
```

## Auto-Import Issues (Nuxt)

### 7. Components Not Auto-Importing

**Error**: `MazBtn is not defined` despite Nuxt module installed

**Solutions**:

✅ **Verify module is added**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'] // Must be present
})
```

✅ **Clear Nuxt cache**:
```bash
rm -rf .nuxt node_modules/.cache
pnpm install
pnpm dev
```

✅ **Check generated types**:
```bash
# Regenerate types
pnpm nuxi prepare
```

✅ **Restart IDE** (VSCode, etc.) to reload type definitions

### 8. Composables Not Auto-Importing

**Error**: `useToast is not defined`

**Solution**: Enable composables in config:
```typescript
export default defineNuxtConfig({
  mazUi: {
    composables: {
      useToast: true,
      useTheme: true,
      // Enable others as needed
    }
  }
})
```

### 9. Directives Not Working

**Error**: `v-tooltip` or other directives not recognized

**Nuxt Solution**:
```typescript
export default defineNuxtConfig({
  mazUi: {
    directives: {
      vTooltip: true,
      vClickOutside: true,
      vLazyImg: true
    }
  }
})
```

**Vue Solution**:
```typescript
import { vTooltip, vClickOutside } from 'maz-ui/directives'

app.directive('tooltip', vTooltip)
app.directive('click-outside', vClickOutside)
```

## TypeScript Errors

### 10. Cannot Find Type Declarations

**Error**:
```
Could not find a declaration file for module 'maz-ui/components/MazBtn'
```

**Solutions**:

✅ **Add types to tsconfig.json**:
```json
{
  "compilerOptions": {
    "types": ["maz-ui/types"]
  }
}
```

✅ **Restart TypeScript server** in IDE

✅ **Update dependencies**:
```bash
pnpm update maz-ui @maz-ui/nuxt
```

### 11. Type Errors with v-model

**Error**: Type errors when using `v-model` with Maz-UI components

**Solution**: Ensure ref types match component expectations:
```typescript
// ✅ Correct
const inputValue = ref<string>('')
const selectValue = ref<number | null>(null)
const checkboxValue = ref<boolean>(false)

// ❌ Wrong
const inputValue = ref() // Type is 'any'
```

## Theme & Styling Issues

### 12. Dark Mode Not Working

**Error**: Dark mode toggle doesn't switch themes

**Solutions**:

✅ **Check dark mode strategy**:
```typescript
// Nuxt
export default defineNuxtConfig({
  mazUi: {
    theme: {
      darkModeStrategy: 'class', // or 'auto' or 'media'
      mode: 'both' // Must support both light and dark
    }
  }
})
```

✅ **Verify HTML class**:
```javascript
// Should toggle .dark class on <html>
document.documentElement.classList.contains('dark')
```

✅ **Use useTheme composable correctly**:
```vue
<script setup>
const { toggleDarkMode, isDark } = useTheme()

// Verify it's enabled
console.log('Dark mode enabled:', isDark.value)
</script>
```

### 13. Custom Theme Colors Not Applied

**Error**: Custom colors in theme overrides don't show

**Cause**: HSL format incorrect or CSS variables not loading

**Solution**:
```typescript
// ✅ Correct HSL format (no 'hsl()' wrapper, space-separated)
colors: {
  light: {
    primary: '220 100% 50%' // ✅ Correct
  }
}

// ❌ Wrong formats
colors: {
  light: {
    primary: 'hsl(220, 100%, 50%)' // ❌ Wrong
    primary: '#3b82f6' // ❌ Use HSL, not hex
  }
}
```

## Build & Bundle Errors

### 14. Bundle Size Too Large

**Problem**: Maz-UI adds significant bundle size

**Solutions**:

✅ **Use direct imports**:
```typescript
// ✅ Tree-shakable
import MazBtn from 'maz-ui/components/MazBtn'

// ❌ Imports everything
import * as MazUI from 'maz-ui'
```

✅ **Disable unused features (Nuxt)**:
```typescript
export default defineNuxtConfig({
  mazUi: {
    composables: {
      // Disable unused composables
      useIdleTimeout: false,
      useReadingTime: false
    },
    plugins: {
      // Enable only needed plugins
      toast: true,
      dialog: false,
      aos: false,
      wait: false
    }
  }
})
```

### 15. SSR Hydration Mismatch

**Error**: Hydration errors in Nuxt

**Cause**: Client/server mismatch with theme or content

**Solution**:
```typescript
// Use ClientOnly for client-specific content
<template>
  <ClientOnly>
    <MazComponent />
  </ClientOnly>
</template>
```

## Performance Issues

### 16. Slow Initial Load

**Problem**: Page loads slowly with Maz-UI

**Solutions**:

✅ **Use hybrid theme strategy (Nuxt)**:
```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid' // Best performance
    }
  }
})
```

✅ **Lazy load heavy components**:
```vue
<script setup>
const MazChart = defineAsyncComponent(() =>
  import('maz-ui/components/MazChart')
)
</script>
```

✅ **Reduce auto-imports**:
```typescript
// Only import what you use
import MazBtn from 'maz-ui/components/MazBtn'
```

## Debugging Tips

### Enable Debug Mode

```typescript
// Vue
app.use(MazUi, {
  debug: true // Logs theme and config info
})

// Nuxt
export default defineNuxtConfig({
  mazUi: {
    debug: true
  }
})
```

### Check Theme Variables

```javascript
// In browser console
const root = document.documentElement
const primary = getComputedStyle(root).getPropertyValue('--maz-primary')
console.log('Primary color:', primary)
```

### Verify Plugin Installation

```javascript
// Check if plugins are installed
console.log('Toast:', app.config.globalProperties.$toast)
console.log('Dialog:', app.config.globalProperties.$dialog)
```

## Getting Help

If issues persist:

1. **Check GitHub Issues**: https://github.com/LouisMazel/maz-ui/issues
2. **Join Discord**: https://discord.gg/maz-ui
3. **Review Documentation**: https://maz-ui.com
4. **Check Changelog**: Look for breaking changes in updates

## Common Version Conflicts

```bash
# Check installed versions
npm list maz-ui @maz-ui/nuxt @maz-ui/themes

# Update all Maz-UI packages
pnpm update maz-ui @maz-ui/nuxt @maz-ui/themes @maz-ui/translations @maz-ui/icons

# Or install specific version
pnpm add maz-ui@4.3.3
```
