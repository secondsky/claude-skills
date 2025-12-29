---
name: maz-ui
description: Maz-UI v4 - Modern Vue & Nuxt component library with 50+ standalone components, composables, directives, theming, i18n, and SSR support. Use when building Vue/Nuxt applications with forms, dialogs, tables, animations, or need responsive design system with dark mode.
---

# Maz-UI v4 - Vue & Nuxt Component Library

Maz-UI is a comprehensive, standalone component library for Vue 3 and Nuxt 3 applications, offering 50+ production-ready components, powerful theming, internationalization, and exceptional developer experience.

**Latest Version**: 4.3.2 (as of 2025-12-14)
**Package**: `maz-ui` | `@maz-ui/nuxt` | `@maz-ui/themes` | `@maz-ui/translations` | `@maz-ui/icons`

## Quick Start

### Vue 3 Installation

```bash
# Install core packages
pnpm add maz-ui @maz-ui/themes

# Or with npm
npm install maz-ui @maz-ui/themes
```

**Setup** in `main.ts`:

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'
import { en } from '@maz-ui/translations'
import 'maz-ui/styles'
import App from './App.vue'

const app = createApp(App)

app.use(MazUi, {
  theme: { preset: mazUi },
  translations: { messages: { en } }
})

app.mount('#app')
```

**Use Components**:

```vue
<script setup>
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { ref } from 'vue'

const inputValue = ref('')
</script>

<template>
  <MazInput v-model="inputValue" label="Name" />
  <MazBtn color="primary">Submit</MazBtn>
</template>
```

###  Nuxt 3 Installation

```bash
# Install Nuxt module
pnpm add @maz-ui/nuxt
```

**Setup** in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
  // That's it! Auto-imports enabled 🎉
})
```

**Use Components** (no imports needed):

```vue
<script setup>
// Auto-imported composables
const theme = useTheme()
const toast = useToast()
const inputValue = ref('')
</script>

<template>
  <!-- Auto-imported components -->
  <MazInput v-model="inputValue" label="Name" />
  <MazBtn color="primary" @click="toast.success('Submitted!')">
    Submit
  </MazBtn>
</template>
```

## Core Capabilities

### 🎨 Components (50+)

**Forms & Inputs**:
- `MazInput` - Text input with validation states
- `MazSelect` - Dropdown select
- `MazTextarea` - Multi-line text input
- `MazCheckbox` - Checkbox with label
- `MazRadio` - Radio buttons
- `MazSwitch` - Toggle switch
- `MazSlider` - Range slider
- `MazInputPhoneNumber` - International phone input with validation
- `MazInputCode` - Code/PIN input
- `MazInputPrice` - Currency input with formatting
- `MazInputTags` - Tag/chip input
- `MazDatePicker` - Date picker
- `MazChecklist` - Searchable checklist

**UI Elements**:
- `MazBtn` - Button with variants
- `MazCard` - Container card
- `MazBadge` - Label badge
- `MazAvatar` - User avatar
- `MazIcon` - Icon display
- `MazSpinner` - Loading spinner
- `MazTable` - Data table with sorting/pagination
- `MazTabs` - Tab navigation
- `MazStepper` - Step indicator
- `MazPagination` - Pagination controls

**Overlays & Modals**:
- `MazDialog` - Modal dialog
- `MazDialogConfirm` - Confirmation dialog
- `MazDrawer` - Slide-out drawer
- `MazBottomSheet` - Mobile bottom sheet
- `MazBackdrop` - Overlay backdrop
- `MazPopover` - Floating popover
- `MazDropdown` - Dropdown menu

**Feedback & Animation**:
- `MazFullscreenLoader` - Loading overlay
- `MazLoadingBar` - Progress bar
- `MazCircularProgressBar` - Circular progress
- `MazReadingProgressBar` - Reading progress indicator
- `MazAnimatedText` - Text animations
- `MazAnimatedElement` - Element animations
- `MazAnimatedCounter` - Number counter animation
- `MazCardSpotlight` - Card with spotlight effect

**Layout & Display**:
- `MazCarousel` - Image carousel
- `MazGallery` - Image gallery
- `MazAccordion` - Collapsible panels
- `MazExpandAnimation` - Expand/collapse animation
- `MazLazyImg` - Lazy-loaded image
- `MazPullToRefresh` - Pull-to-refresh gesture
- `MazChart` - Chart.js integration

### 🔧 Composables (14+)

**Theming**:
- `useTheme()` - Theme and dark mode management

**Translations**:
- `useTranslations()` - i18n management

**UI Interactions**:
- `useToast()` - Toast notifications
- `useDialog()` - Programmatic dialogs
- `useWait()` - Loading states

**Utilities**:
- `useBreakpoints()` - Responsive breakpoints
- `useWindowSize()` - Window dimensions
- `useTimer()` - Timer/countdown
- `useFormValidator()` - Form validation (Valibot)
- `useIdleTimeout()` - Idle detection
- `useUserVisibility()` - Page visibility
- `useSwipe()` - Swipe gestures
- `useReadingTime()` - Reading time calculation
- `useStringMatching()` - String utilities
- `useDisplayNames()` - Localized display names

### 📌 Directives (5)

- `v-tooltip` - Tooltips
- `v-click-outside` - Outside click detection
- `v-lazy-img` - Lazy loading
- `v-zoom-img` - Image zoom
- `v-fullscreen-img` - Fullscreen image viewer

### 🔌 Plugins (4)

- **AOS** - Animations on scroll
- **Dialog** - Template-free dialogs
- **Toast** - Notifications
- **Wait** - Global loading states

## Key Features

✅ **Standalone Components** - Import only what you need, zero bloat
✅ **SSR/SSG Ready** - Full Nuxt 3 support with auto-imports
✅ **TypeScript-First** - Complete type safety out of the box
✅ **Dark Mode** - Built-in dark/light theme switching
✅ **Tree-Shakable** - Optimized bundle sizes
✅ **Responsive** - Mobile-first design
✅ **Accessible** - ARIA-compliant components
✅ **Themeable** - 4 built-in presets + custom themes
✅ **i18n** - Multi-language support with @maz-ui/translations
✅ **840+ Icons** - Optimized SVG icon library (@maz-ui/icons)

## When to Load References

Load reference files based on what you're implementing:

### Components
- **`references/components-forms.md`** - When building forms, inputs, validation, phone numbers, dates, file uploads
- **`references/components-feedback.md`** - When adding toasts, dialogs, loading states, progress indicators
- **`references/components-navigation.md`** - When implementing tabs, steppers, pagination, breadcrumbs
- **`references/components-layout.md`** - When working with cards, grids, containers, spacing

### Setup & Configuration
- **`references/setup-vue.md`** - When setting up Maz-UI in Vue 3 project (with/without auto-imports)
- **`references/setup-nuxt.md`** - When integrating with Nuxt 3, configuring module options
- **`references/theming.md`** - When customizing themes, dark mode, color schemes, CSS variables
- **`references/translations.md`** - When implementing multi-language support, custom locales

### Advanced Features
- **`references/composables.md`** - When using composable APIs (useToast, useTheme, useBreakpoints, etc.)
- **`references/directives.md`** - When adding directives (tooltip, click-outside, lazy-img)
- **`references/plugins.md`** - When enabling plugins (AOS, dialog, toast, wait)
- **`references/icons.md`** - When using @maz-ui/icons package
- **`references/migration-v4.md`** - When upgrading from Maz-UI v3 to v4
- **`references/troubleshooting.md`** - When encountering errors, debugging issues

## Top 5 Common Errors

### 1. Missing Theme Plugin Error
**Error**: `"useTheme must be used within MazUi plugin installation"`
**Cause**: MazUi plugin not installed or theme composable disabled
**Fix**:
```typescript
// Vue
app.use(MazUi, { theme: { preset: mazUi } })

// Nuxt
export default defineNuxtConfig({
  mazUi: {
    composables: { useTheme: true },
    theme: { preset: 'maz-ui' }
  }
})
```

### 2. Auto-Import Not Working (Nuxt)
**Error**: Components/composables not found despite Nuxt module installed
**Cause**: Module not properly configured or cache issue
**Fix**:
```bash
# Clear Nuxt cache
rm -rf .nuxt node_modules/.cache
pnpm install
```
**Verify** `nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
})
```

### 3. Styles Not Applied
**Error**: Components render but have no styling
**Cause**: CSS not imported
**Fix Vue**:
```typescript
import 'maz-ui/styles' // Add this line
```
**Fix Nuxt**:
```typescript
export default defineNuxtConfig({
  mazUi: {
    css: { injectMainCss: true } // Ensure this is true
  }
})
```

### 4. TypeScript Errors with Components
**Error**: `Cannot find module 'maz-ui/components/MazBtn'`
**Cause**: Missing type definitions or incorrect import path
**Fix**:
```typescript
// Correct import
import MazBtn from 'maz-ui/components/MazBtn'

// Or with auto-import (Nuxt)
// No import needed, just use <MazBtn>
```
**Ensure** `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "types": ["maz-ui/types"]
  }
}
```

### 5. Phone Input Country Detection Fails
**Error**: `MazInputPhoneNumber` doesn't detect country or shows wrong flag
**Cause**: Missing libphonenumber-js dependency or country data not loaded
**Fix**:
```bash
# Install peer dependency
pnpm add libphonenumber-js
```
```vue
<MazInputPhoneNumber
  v-model="phone"
  default-country-code="US"
  preferred-countries="['US', 'CA', 'GB']"
/>
```

## Tree-Shaking Best Practices

**Direct Imports** (Most Optimized):
```typescript
// ✅✅✅ Best - smallest bundle
import MazBtn from 'maz-ui/components/MazBtn'
import { useToast } from 'maz-ui/composables/useToast'
import { vClickOutside } from 'maz-ui/directives/vClickOutside'
```

**Index Imports** (Good):
```typescript
// ✅ Good - tree-shakable
import { MazBtn, MazInput } from 'maz-ui/components'
import { useToast, useTheme } from 'maz-ui/composables'
```

**Avoid** (Not Tree-Shakable):
```typescript
// ❌ Imports everything
import * as MazUI from 'maz-ui'
```

## Progressive Disclosure Summary

This SKILL.md provides:
1. **Quick Start** - Get running in <5 minutes
2. **Core Capabilities** - Overview of all features
3. **Error Prevention** - Top 5 common issues solved

For detailed implementation:
- Load **reference files** based on your current task (see "When to Load References" above)
- Each reference contains comprehensive guides, code examples, and advanced configurations
- References are organized by domain (components, setup, theming, etc.) for easy navigation

## Package Ecosystem

- **maz-ui** - Core component library
- **@maz-ui/nuxt** - Nuxt 3 module with auto-imports
- **@maz-ui/themes** - Theming system and presets
- **@maz-ui/translations** - i18n support (27 languages)
- **@maz-ui/icons** - 840+ optimized SVG icons
- **@maz-ui/mcp** - AI agent documentation server

## Official Resources

- **Documentation**: https://maz-ui.com
- **GitHub**: https://github.com/LouisMazel/maz-ui
- **NPM**: https://www.npmjs.com/package/maz-ui
- **Discord**: https://discord.gg/maz-ui
- **Changelog**: https://github.com/LouisMazel/maz-ui/blob/master/CHANGELOG.md
