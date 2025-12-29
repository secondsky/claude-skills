# Maz-UI v4 Migration Guide

Complete guide to migrate from Maz-UI v3.x to v4.0.0 with breaking changes, new features, and step-by-step instructions.

## Overview

Maz-UI v4.0.0 is a **complete rebuild** designed for flexibility, performance, and modern development workflows. The library is now split into independent packages with optimal tree-shaking, redesigned theme system, and comprehensive i18n support.

**Key Improvements**:
- 60-90% bundle size reduction
- Modular package architecture
- Runtime theme switching
- 8 languages with custom translation support
- Better TypeScript support
- No external dependencies (dropzone removed)

---

## Why Migrate to v4?

### Performance Gains

| Metric | v3.x | v4.0.0 | Improvement |
|--------|------|--------|-------------|
| **Bundle Size** | ~500KB | ~50-200KB | 60-90% reduction |
| **Tree-shaking** | Limited | Optimal | Perfect |
| **Lazy Loading** | Basic | Advanced | Intelligent |
| **TypeScript** | Good | Excellent | Strict types |

### Architectural Revolution

**Optimized Tree-Shaking**:
- Every component, composable, plugin, directive, and utility is individually importable
- Perfect compatibility with Vite, Webpack 5, Rollup
- Dramatic bundle reduction

**Modular Architecture**:
- Restructured monorepo with specialized packages
- Choose exactly what you need
- Better maintainability

**Advanced Theme System**:
- Predefined presets: `mazUi`, `obsidian`, `ocean`, `pristine`
- Dynamic CSS variable generation
- Runtime theme switching with dark mode strategies

**Complete Internationalization**:
- 8 supported languages (EN, FR, DE, ES, IT, PT, JA, ZH-CN)
- Easy custom translation integration
- Automatic fallback handling

**New & Refactored Components**:
- MazLink (replaces `MazBtn variant="link"`)
- MazExpandAnimation (replaces MazTransitionExpand)
- MazDropzone (rewritten without dropzone dependency)
- MazPopover (versatile overlay with smart positioning)
- MazSelectCountry (country/language selector with i18n)

---

## New Package Architecture

v4.0.0 separates functionality into specialized packages:

| Package | Description | Status |
|---------|-------------|--------|
| **maz-ui** | Vue components, composables, plugins | Refactored |
| **@maz-ui/themes** | Theme system and presets | New |
| **@maz-ui/translations** | i18n translations | New |
| **@maz-ui/utils** | JavaScript/TypeScript utilities | New |
| **@maz-ui/icons** | SVG icons and flags (840+ icons) | New |
| **@maz-ui/cli** | CLI for legacy v3 theme generation | Renamed |
| **@maz-ui/nuxt** | Nuxt module | New |
| **@maz-ui/mcp** | MCP server for AI agents | New |

---

## Migration Checklist

### Step 1: Update Dependencies

```bash
# Uninstall old version
npm uninstall maz-ui

# Install new version
npm install maz-ui@4.0.0

# Optional: Install specialized packages
npm install @maz-ui/themes @maz-ui/translations @maz-ui/utils @maz-ui/icons

# Remove external dependency no longer needed
npm uninstall dropzone
```

**Updated peer dependencies**:
- **Vue**: `^3.5.0` (was `^3.0.0`)
- **unplugin-vue-components**: `>=28.0.0`
- **unplugin-auto-import**: `>=19.0.0`

---

### Step 2: Plugin Configuration

#### Vue Users

**MANDATORY**: v4.0.0 requires Vue plugin for configuration.

**Before (v3.x)**:
```typescript
// main.ts
import { createApp } from 'vue'
import 'maz-ui/css/main.css'
import App from './App.vue'

createApp(App).mount('#app')
```

**After (v4.0.0)**:
```typescript
// main.ts
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes/presets'
import { fr } from '@maz-ui/translations'

// Import styles before your CSS
import 'maz-ui/styles'
import './style.css'

import App from './App.vue'

const app = createApp(App)

// NEW: MazUi plugin required
app.use(MazUi, {
  // Theme configuration (optional)
  theme: {
    preset: mazUi, // or 'ocean' | 'pristine' | 'obsidian'
  },
  // Translation configuration (optional)
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    messages: {
      fr,
    },
  },
})

app.mount('#app')
```

---

#### Nuxt Users

**NEW**: Dedicated Nuxt module with simplified API.

**Before (v3.x)**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['maz-ui/nuxt'],
  mazUi: {
    // v3 configuration
  }
})
```

**After (v4.0.0)**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'], // New package

  mazUi: {
    // New configuration API
    theme: {
      preset: 'maz-ui',
      strategy: 'hybrid',
      darkModeStrategy: 'class',
    },
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
    },
    plugins: {
      aos: true,
      dialog: true,
      toast: true,
      wait: true,
    },
    directives: {
      vTooltip: true,
      vLazyImg: true,
      vClickOutside: true,
    },
  }
})
```

---

### Step 3: Import Migration

#### Components

**Component imports haven't changed** - they work the same as v3.x:

```typescript
// ✅ SAME AS v3.x - Still works
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'

// ✅ NEW - Batch imports for convenience
import { MazBtn, MazInput } from 'maz-ui/components'
```

---

#### Plugins

```typescript
// ❌ BEFORE (v3.x)
import { installToaster, ToastHandler } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import { ToastPlugin, ToastHandler } from 'maz-ui/plugins'
// or for maximum tree-shaking
import { ToastPlugin, ToastHandler } from 'maz-ui/plugins/toast'
```

---

#### Directives

```typescript
// ❌ BEFORE (v3.x)
import { vClickOutside, vTooltip } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import { vClickOutside, vTooltip } from 'maz-ui/directives'
// or for maximum tree-shaking
import { vClickOutside } from 'maz-ui/directives/vClickOutside'
import { vTooltip } from 'maz-ui/directives/vTooltip'
```

---

#### Composables

```typescript
// ❌ BEFORE (v3.x)
import { useTimer, useToast } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import { useTimer, useToast } from 'maz-ui/composables'
// or for maximum tree-shaking
import { useTimer } from 'maz-ui/composables/useTimer'
import { useToast } from 'maz-ui/composables/useToast'
```

---

#### Utilities

```typescript
// ❌ BEFORE (v3.x)
import { currency, date } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import { formatCurrency, formatDate } from 'maz-ui'
// or for better performance
import { formatCurrency, formatDate } from '@maz-ui/utils'
```

---

## Component Breaking Changes

### MazBtn

#### Removed `variant="link"`

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazBtn variant="link" href="/path">
  Link
</MazBtn>

<!-- ✅ AFTER (v4.0.0) - Use MazLink -->
<MazLink href="/path">
  Link
</MazLink>

<!-- Action with click -->
<MazLink @click="handleClick">
  Action
</MazLink>
```

#### Prop Changes

```vue
<!-- CHANGED PROPS -->
<MazBtn
  outlined            <!-- ✅ NEW: was 'outline' -->
  justify="space-between"  <!-- 🆕 NEW: Content alignment -->
  :padding="false"         <!-- 🆕 NEW: Padding control -->
  rounded-size="full"      <!-- 🆕 NEW: Border radius size -->
>
  Button
</MazBtn>
```

---

### MazLink - New Component

Replaces `MazBtn variant="link"` with a richer API:

```vue
<!-- ✅ NEW COMPONENT -->
<MazLink
  href="/path"
  :auto-external="true"           <!-- 🆕 Automatic external icon -->
  :underline-hover="true"         <!-- 🆕 Underline on hover -->
  left-icon="home"                <!-- 🆕 Left icon -->
  right-icon="arrow-right"        <!-- 🆕 Right icon -->
  color="primary"                 <!-- 🆕 Custom color -->
  as="router-link"               <!-- 🆕 Custom component -->
>
  Link with icons
</MazLink>
```

---

### MazPicker → MazDatePicker

**Renamed** with updated props:

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazPicker
  v-model="date"
  :no-header="true"
  input-date-style="DD/MM/YYYY"
/>

<!-- ✅ AFTER (v4.0.0) -->
<MazDatePicker
  v-model="date"
  :hide-header="true"              <!-- 🔄 CHANGED -->
  input-date-format="DD/MM/YYYY"   <!-- 🔄 CHANGED -->
  :min-max-auto="true"             <!-- 🆕 NEW -->
/>
```

---

### MazInputPhoneNumber - Renamed

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazPhoneNumberInput
  v-model="phone"
  v-model:country-code="country"
  :preferred-countries="['FR', 'US']"
  @update="handleUpdate"
/>

<!-- ✅ AFTER (v4.0.0) -->
<MazInputPhoneNumber
  v-model="phone"
  v-model:country-code="country"
  :preferred-countries="['FR', 'US']"
  @data="handleData"            <!-- 🔄 CHANGED: @update → @data -->
/>
```

---

### MazTransitionExpand → MazExpandAnimation

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazTransitionExpand animation-duration="500ms">
  <div v-show="isOpen">Content</div>
</MazTransitionExpand>

<!-- ✅ AFTER (v4.0.0) -->
<MazExpandAnimation
  v-model="isOpen"                <!-- 🆕 v-model for state control -->
  duration="500ms"               <!-- 🔄 CHANGED -->
  timing-function="ease-in-out"  <!-- 🆕 Timing function -->
>
  <div>Content</div>
</MazExpandAnimation>
```

---

### MazDropzone - Complete Rewrite

**External dependency removed**:

```bash
# ❌ BEFORE (v3.x) - External dependency required
npm install dropzone

# ✅ AFTER (v4.0.0) - No external dependency
npm uninstall dropzone
```

**New Features**:

```vue
<!-- ✅ NEW FEATURES -->
<MazDropzone
  v-model="files"
  :auto-upload="'single'"          <!-- 🆕 Automatic upload -->
  url="/api/upload"                <!-- 🆕 Upload URL -->
  :request-options="{ ... }"       <!-- 🆕 Request options -->
  :transform-body="transformFn"    <!-- 🆕 Body transformation -->
  :min-file-size="0.1"            <!-- 🆕 Min size in MB -->
  @upload-success="onSuccess"      <!-- 🆕 Success event -->
  @upload-error="onError"          <!-- 🆕 Error event -->
/>
```

---

### MazDropdown & MazSelect - Position API

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazDropdown position="bottom right" />
<MazSelect position="bottom right" />

<!-- ✅ AFTER (v4.0.0) -->
<MazDropdown position="bottom-end" />
<MazSelect position="bottom-end" />
```

**New position type**:
```typescript
type MazPopoverPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right' |
  'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' |
  'left-start' | 'left-end' | 'right-start' | 'right-end'
```

---

### MazPopover - New Component

Versatile overlay component with smart positioning:

```vue
<!-- 🆕 NEW COMPONENT -->
<MazPopover
  trigger="click"                 <!-- 🆕 Trigger mode -->
  position="bottom-start"         <!-- 🆕 Smart positioning -->
  :persistent="true"              <!-- 🆕 Keep open for interactions -->
  role="dialog"                   <!-- 🆕 Accessibility role -->
>
  <template #trigger>
    <MazBtn>Open Popover</MazBtn>
  </template>

  <template #default>
    <div class="p-4">
      Popover content
    </div>
  </template>
</MazPopover>
```

---

### MazSelectCountry - New Component

Country/language selector with i18n support:

```vue
<!-- 🆕 NEW COMPONENT -->
<MazSelectCountry
  v-model="selectedCountry"
  :preferred-codes="['US', 'FR']"  <!-- 🆕 Preferred countries -->
  :locale="'fr'"                   <!-- 🆕 Localization -->
  :hide-flags="false"              <!-- 🆕 Flag display -->
  :display-code="false"            <!-- 🆕 Show codes -->
/>
```

---

### MazDialogPromise → MazDialogConfirm

```typescript
// ❌ BEFORE (v3.x)
import { MazDialogPromise } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import { MazDialogConfirm } from 'maz-ui'
```

---

## Composable Breaking Changes

### useDialog - No Longer Promise-Based

To avoid JavaScript console errors, useDialog is now callback-based:

**Before (v3.x)**:
```typescript
const dialog = useDialog()

try {
  const result = await dialog.confirm({
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Yes',
    cancelText: 'No'
  })
  // Handle confirm
} catch (error) {
  // Handle cancel
}
```

**After (v4.0.0)**:
```typescript
const dialog = useDialog()

dialog.confirm({
  title: 'Confirm',
  message: 'Are you sure?',
  buttons: {                      // 🔄 CHANGED
    confirm: 'Yes',
    cancel: 'No'
  },
  onAccept: () => {              // 🆕 NEW: Accept callback
    // Handle confirm
  },
  onReject: () => {              // 🆕 NEW: Reject callback
    // Handle cancel
  },
  onClose: () => {               // 🆕 NEW: Close callback (finally)
    // Handle close
  }
})
```

---

### useDisplayNames - Renamed

```typescript
// ❌ BEFORE (v3.x)
import { useLanguageDisplayNames } from 'maz-ui'

const { getDisplayName } = useLanguageDisplayNames()

// ✅ AFTER (v4.0.0)
import { useDisplayNames } from 'maz-ui/composables'

const { getDisplayName } = useDisplayNames()
```

---

### Helpers → Composables

**MAJOR CHANGE**: Several helpers are now Vue composables and must be used within Vue context.

#### useIdleTimeout

```typescript
// ❌ BEFORE (v3.x)
import { idleTimeout } from 'maz-ui'

const controller = idleTimeout({
  timeout: 5000,
  onTimeout: () => console.log('timeout'),
  onActivity: () => console.log('activity')
})

// ✅ AFTER (v4.0.0)
import { useIdleTimeout } from 'maz-ui/composables'

// In a Vue component
const { isIdle } = useIdleTimeout({
  timeout: 5000,
  onTimeout: () => console.log('timeout'),
  onActivity: () => console.log('activity')
})
```

**Other migrated helpers**:
- `userVisibility` → `useUserVisibility`
- `mountComponent` → `useMountComponent`
- `injectStrict` → `useInjectStrict`
- `freezeValue` → `useFreezeValue`

---

## Color System Changes

### Color Removals and Replacements

```typescript
// ❌ REMOVED COLORS
color="theme"     // ✅ REPLACED BY: color="contrast"
color="white"     // ❌ REMOVED
color="black"     // ❌ REMOVED
color="danger"    // ✅ REPLACED BY: color="destructive"
```

### New Color System

**Available colors in v4.0.0**:

```typescript
type MazColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' |
  'warning' | 'destructive' | 'contrast' | 'transparent'
```

**Migration examples**:

```vue
<!-- ❌ BEFORE (v3.x) -->
<MazBtn color="theme">Theme Button</MazBtn>
<MazBtn color="danger">Danger Button</MazBtn>

<!-- ✅ AFTER (v4.0.0) -->
<MazBtn color="contrast">Contrast Button</MazBtn>
<MazBtn color="destructive">Destructive Button</MazBtn>
```

---

## TypeScript Changes

### Type Prefixing

All component types are now prefixed with `Maz`:

```typescript
// ❌ BEFORE (v3.x)
import type { Props } from 'maz-ui/components/MazBtn'
import type { ButtonsRadioOption, Row, Color, Size } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import type { MazBtnProps } from 'maz-ui/components/MazBtn'
import type { MazRadioButtonsOption, MazTableRow, MazColor, MazSize } from 'maz-ui'
```

### Type Import Changes

```typescript
// ❌ BEFORE (v3.x)
import type { Color, Size } from 'maz-ui'

// ✅ AFTER (v4.0.0)
import type { MazColor, MazSize } from 'maz-ui'
```

---

## Theme System Migration

### Basic Configuration

```typescript
// main.ts
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes/presets'

app.use(MazUi, {
  theme: {
    preset: mazUi, // or 'ocean' | 'pristine' | 'obsidian'
  },
})
```

---

### Custom Theme

```typescript
import { definePreset } from '@maz-ui/themes'
import { mazUi } from '@maz-ui/themes/presets'

const customTheme = definePreset({
  base: mazUi,
  name: 'custom-theme',
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
})

app.use(MazUi, {
  theme: {
    preset: customTheme,
  },
})
```

---

### useTheme Composable

```vue
<script setup>
import { useTheme } from 'maz-ui/composables'

const { isDark, toggleDarkMode, setTheme } = useTheme()

// Change theme
setTheme('ocean')

// Toggle dark mode
toggleDarkMode()
</script>

<template>
  <button @click="toggleDarkMode">
    {{ isDark ? '☀️' : '🌙' }}
  </button>
</template>
```

---

## Translation System Migration

### Configuration

```typescript
// main.ts
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { fr, en } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    messages: {
      fr,
      en,
    },
  },
})
```

---

### useTranslations Composable

```vue
<script setup>
import { useTranslations } from 'maz-ui/composables'

const { t, locale, setLocale } = useTranslations()

// Change language
setLocale('fr')
</script>

<template>
  <p>{{ t('button.cancel') }}</p>
</template>
```

---

## Removed Features

### v-closable Directive

```vue
<!-- ❌ REMOVED - v-closable directive -->
<div v-closable="handler">Content</div>

<!-- ✅ ALTERNATIVE - Use v-click-outside -->
<div v-click-outside="handler">Content</div>
```

---

## Common Errors & Solutions

### Error: "idleTimeout is not a function"

```typescript
// ❌ Old way
import { idleTimeout } from 'maz-ui'

// ✅ New way
import { useIdleTimeout } from 'maz-ui/composables'

// In a Vue component
const { isIdle } = useIdleTimeout({ timeout: 5000 })
```

---

### Error: "MazTransitionExpand is not exported"

```vue
<!-- ❌ Removed component -->
<MazTransitionExpand>
  <div v-show="isOpen">Content</div>
</MazTransitionExpand>

<!-- ✅ New component -->
<MazExpandAnimation v-model="isOpen">
  <div>Content</div>
</MazExpandAnimation>
```

---

### Error: "Module not found: Can't resolve 'dropzone'"

```bash
# ❌ Remove old dependency
npm uninstall dropzone

# ✅ MazDropzone has no external dependency
```

---

### Error: "useTheme must be used within MazUi plugin"

```typescript
// ❌ Missing plugin
import { createApp } from 'vue'

// ✅ Add MazUi plugin
import { MazUi } from 'maz-ui/plugins/maz-ui'

app.use(MazUi)
```

---

### Error: "Property 'outline' does not exist"

```vue
<!-- ❌ Old prop name -->
<MazBtn outline>Button</MazBtn>

<!-- ✅ New prop name -->
<MazBtn outlined>Button</MazBtn>
```

---

## Complete Migration Checklist

### Dependencies
- [ ] Update maz-ui to v4.0.0+
- [ ] Remove `dropzone` dependency
- [ ] Update Vue to v3.5+
- [ ] Update unplugin-auto-import to v19+
- [ ] Update unplugin-vue-components to v28+

### Configuration
- [ ] Add MazUi plugin in main.ts
- [ ] Configure theme with new system
- [ ] Configure translations with new system
- [ ] Migrate Nuxt configuration to @maz-ui/nuxt (if using Nuxt)

### Imports
- [ ] Migrate plugin imports to `maz-ui/plugins/*`
- [ ] Migrate directive imports to `maz-ui/directives/*`
- [ ] Migrate composable imports to `maz-ui/composables/*`
- [ ] Update utility imports (currency → formatCurrency, etc.)

### Components
- [ ] Replace `MazBtn variant="link"` with `MazLink`
- [ ] Update `MazBtn outline` to `outlined`
- [ ] Rename `MazPhoneNumberInput` to `MazInputPhoneNumber`
- [ ] Rename `MazPicker` to `MazDatePicker`
- [ ] Replace `MazTransitionExpand` with `MazExpandAnimation`
- [ ] Update `MazDropdown`/`MazSelect` position props
- [ ] Rename `MazDialogPromise` to `MazDialogConfirm`
- [ ] Check new `MazDropzone` props

### API Changes
- [ ] Migrate `useDialog` from Promise to callback API
- [ ] Rename `useLanguageDisplayNames` to `useDisplayNames`
- [ ] Update `@update` to `@data` in `MazInputPhoneNumber`
- [ ] Replace removed colors (theme → contrast, danger → destructive)
- [ ] Remove `v-closable` directive usage

### Helpers → Composables
- [ ] Migrate `idleTimeout` to `useIdleTimeout`
- [ ] Migrate `userVisibility` to `useUserVisibility`
- [ ] Migrate `mountComponent` to `useMountComponent`
- [ ] Migrate `injectStrict` to `useInjectStrict`
- [ ] Migrate `freezeValue` to `useFreezeValue`

### TypeScript
- [ ] Update all type imports to use `Maz` prefix
- [ ] Update prop type imports (Props → MazBtnProps)
- [ ] Update generic types (Color → MazColor, Size → MazSize)

### Testing & Validation
- [ ] Test TypeScript compilation
- [ ] Test production build
- [ ] Check bundle size
- [ ] Run unit tests
- [ ] Test in development and production
- [ ] Test SSR/Nuxt if applicable
- [ ] Validate critical functionality

---

## Migration Benefits

### Performance
- 60-90% bundle size reduction
- Perfect tree-shaking
- Intelligent lazy loading
- Strict TypeScript support

### Developer Experience
- Auto-imports with resolvers
- Perfect TypeScript auto-completion
- Nuxt DevTools integration
- Interactive documentation

### Maintainability
- Separate packages for better maintenance
- Semantic versioning per package
- Mature, tested architecture

---

## Additional Resources

- **[Official v4 Documentation](https://maz-ui.com/)** - Complete documentation
- **[Theme Guide](./theming.md)** - Advanced theme system
- **[Translation Guide](./translations.md)** - Internationalization
- **[Setup Vue](./setup-vue.md)** - Vue installation guide
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt module setup
- **[Resolvers Guide](./resolvers.md)** - Smart auto-imports
- **[Complete Changelog](https://github.com/LouisMazel/maz-ui/blob/master/CHANGELOG.md)** - All changes

---

## Need Help?

- **[Create Issue](https://github.com/LouisMazel/maz-ui/issues)** - Report bugs
- **[Discussions](https://github.com/LouisMazel/maz-ui/discussions)** - Ask questions
- **[MCP Server](./mcp.md)** - AI-powered migration assistance

---

**Migration Version**: v3.x → v4.0.0
**Last Updated**: 2025-12-14

::: tip Connect to MCP
Follow the [MCP guide](./mcp.md) to connect your AI assistant to Maz-UI's documentation for smooth migration assistance.
:::
