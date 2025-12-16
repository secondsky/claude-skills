# Nuxt v4 Features & Integration

## Overview

This guide covers Nuxt v4-specific features and how they integrate with Nuxt UI v4.

## Key Nuxt v4 Features

### 1. **Improved Performance**
- Faster build times with optimized Vite integration
- Enhanced hot module replacement (HMR)
- Better tree-shaking for smaller bundles

### 2. **Enhanced Type Safety**
- Automatic type generation with `nuxt prepare`
- Better TypeScript inference
- Type-safe component props

### 3. **Module System Updates**
- Simplified module registration
- Better module compatibility
- Enhanced plugin system

## Nuxt UI v4 Integration

### Installation

```bash
npm install @nuxt/ui
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  compatibilityDate: '2024-11-01'
})
```

### Auto-imports

Nuxt v4 auto-imports all Nuxt UI components and composables:
- Components: `UButton`, `UCard`, `UInput`, etc.
- Composables: `useToast`, `useColorMode`, etc.

## Best Practices

1. **Use TypeScript**: Full type safety with Nuxt v4
2. **Run `nuxt prepare`**: Generate types before development
3. **Leverage Auto-imports**: No need to manually import components
4. **Use `UApp` Wrapper**: Required for Nuxt UI to work properly

---

## Migration to v4.2.x

### Overview

Nuxt UI v4.2.x introduces several new features and a few breaking changes. Most applications will upgrade smoothly, but you should be aware of the changes below.

### New Components (v4.2.0)

Three new components are available:

1. **InputDate** - Date picker with calendar UI and range selection
2. **InputTime** - Time picker with 12/24-hour format support
3. **Empty** - Empty state display component

**Installation** (if using date/time components):
```bash
bun add @internationalized/date
```

### Breaking Changes

#### 1. Exposed Refs Consistency (v4.2.0)

**Affected Components**: InputMenu, InputNumber, SelectMenu

Template refs for these components now return HTML elements directly instead of component instances.

**Before (v4.0/v4.1)**:
```vue
<template>
  <UInputMenu ref="inputRef" />
</template>

<script setup lang="ts">
const inputRef = ref()

onMounted(() => {
  // Access via .$el
  inputRef.value.$el.focus()
})
</script>
```

**After (v4.2+)**:
```vue
<template>
  <UInputMenu ref="inputRef" />
</template>

<script setup lang="ts">
const inputRef = ref<HTMLElement>()

onMounted(() => {
  // Direct HTML element access
  inputRef.value?.focus()
})
</script>
```

**Migration Steps**:
1. Remove all `.$el` accessors from affected components
2. Update TypeScript types from component refs to `HTMLElement`
3. Test all imperative DOM operations (focus, scroll, etc.)

#### 2. Composable Imports (v4.2.0)

Composable imports no longer require the `.js` extension.

**Before**:
```typescript
import { useToast } from '#ui/composables/useToast.js'
import { useNotification } from '#ui/composables/useNotification.js'
```

**After**:
```typescript
import { useToast } from '#ui/composables/useToast'
import { useNotification } from '#ui/composables/useNotification'
```

**Migration Steps**:
1. Search for `from '#ui/composables/*.js'` in your codebase
2. Remove `.js` extensions
3. Auto-imports are still recommended (no explicit import needed)

#### 3. Vite Theme Templates (v4.2.0)

Theme files are now properly generated outside the `.nuxt/` directory when using Vite plugin.

**Impact**: Minimal - theme customizations in `app.config.ts` now work correctly with Vite
**Action Required**: None - automatic improvement

### New Features

#### Tailwind CSS Prefix Support (v4.2+)

Configure a prefix for all Tailwind utility classes to avoid conflicts.

**Configuration**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'tw'
    }
  }
})
```

```css
/* app/assets/css/main.css */
@import "tailwindcss" prefix(tw);
@import "@nuxt/ui";
```

**See**: `tailwind-prefix-guide.md` for complete guide

#### Component Virtualization (v4.1+)

Enable virtualization for large lists (1000+ items).

**Usage**:
```vue
<template>
  <UTable
    :rows="largeDataset"
    virtualize
  />
</template>
```

**Supported**: CommandPalette, InputMenu, SelectMenu, Table, Tree

**See**: `performance-optimization.md` for details

#### Experimental Component Detection (v4.1+)

Automatically detect which components are used and generate only necessary CSS.

**Configuration**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    experimental: {
      componentDetection: true
    }
  }
})
```

**Result**: 70%+ CSS bundle size reduction

**See**: `performance-optimization.md` for details

### Upgrade Checklist

- [ ] Update `@nuxt/ui` to v4.2.1: `bun update @nuxt/ui`
- [ ] Search for `.$el` in template refs (InputMenu, InputNumber, SelectMenu)
- [ ] Remove `.$el` accessors, use direct element access
- [ ] Update composable imports (remove `.js` extensions)
- [ ] Install `@internationalized/date` if using InputDate/InputTime
- [ ] Test all form validations
- [ ] Test all imperative DOM operations (focus, etc.)
- [ ] Consider enabling component detection for smaller bundles
- [ ] Review new components: InputDate, InputTime, Empty

### Common Migration Errors

See `COMMON_ERRORS_DETAILED.md` for:
- "Cannot read property 'focus' of undefined" error
- Template ref TypeScript errors
- Composable import errors

### Resources

- **Official Changelog**: https://ui.nuxt.com/releases
- **Migration Guide**: https://ui.nuxt.com/docs/getting-started/migration/v4
- **Component Detection**: `performance-optimization.md`
- **Prefix Guide**: `tailwind-prefix-guide.md`
