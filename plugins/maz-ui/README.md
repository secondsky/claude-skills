# Maz-UI Plugin for Claude Code

Comprehensive skill for building Vue 3 and Nuxt 3 applications with Maz-UI - a modern, standalone component library.

## What is Maz-UI?

Maz-UI is a production-ready Vue/Nuxt component library featuring:

- **50+ Components**: Forms, tables, dialogs, charts, animations, and more
- **14+ Composables**: useToast, useTheme, useBreakpoints, useFormValidator, etc.
- **5 Directives**: Tooltips, click-outside, lazy-loading, image zoom/fullscreen
- **4 Plugins**: Toast, Dialog, AOS (animations), Wait (loading states)
- **4 Theme Presets**: maz-ui, ocean, pristine, obsidian + custom themes
- **i18n Support**: 27 languages built-in
- **840+ Icons**: Optimized SVG icon library (@maz-ui/icons)
- **TypeScript-First**: Full type safety out of the box
- **SSR/SSG Ready**: Perfect for Nuxt 3 with auto-imports
- **Tree-Shakable**: Import only what you need

**Latest Version**: 4.3.3 (as of 2025-12-29)

## When to Use This Skill

Load this skill when:

- Building Vue 3 or Nuxt 3 applications
- Need production-ready UI components
- Implementing forms with validation (phone numbers, dates, prices, tags)
- Adding dialogs, toasts, or loading states
- Creating responsive layouts with dark mode support
- Need internationalization (multi-language) support
- Building data tables, charts, or galleries
- Implementing animations or scroll effects

## Quick Examples

### Vue 3 Setup

```bash
pnpm add maz-ui @maz-ui/themes
```

```typescript
// main.ts
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'
import 'maz-ui/styles'

const app = createApp(App)
app.use(MazUi, {
  theme: { preset: mazUi }
})
app.mount('#app')
```

```vue
<!-- App.vue -->
<script setup>
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { ref } from 'vue'

const name = ref('')
</script>

<template>
  <MazInput v-model="name" label="Name" />
  <MazBtn color="primary">Submit</MazBtn>
</template>
```

### Nuxt 3 Setup

```bash
pnpm add @maz-ui/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
  // Auto-imports enabled! 🎉
})
```

```vue
<!-- pages/index.vue - No imports needed -->
<script setup>
const name = ref('')
const toast = useToast()
</script>

<template>
  <MazInput v-model="name" label="Name" />
  <MazBtn @click="toast.success('Submitted!')">
    Submit
  </MazBtn>
</template>
```

## Key Features Covered

### Components
- **Forms**: MazInput, MazSelect, MazCheckbox, MazRadio, MazSwitch, MazTextarea, MazSlider
- **Specialized Inputs**: MazInputPhoneNumber, MazDatePicker, MazInputPrice, MazInputTags, MazInputCode
- **UI Elements**: MazBtn, MazCard, MazBadge, MazAvatar, MazIcon, MazSpinner
- **Overlays**: MazDialog, MazDrawer, MazBottomSheet, MazPopover, MazDropdown
- **Data Display**: MazTable, MazChart, MazCarousel, MazGallery
- **Navigation**: MazTabs, MazStepper, MazPagination
- **Feedback**: MazFullscreenLoader, MazLoadingBar, MazCircularProgressBar
- **Animation**: MazAnimatedText, MazAnimatedElement, MazCardSpotlight

### Composables
- Theme management: `useTheme()`
- Notifications: `useToast()`
- Dialogs: `useDialog()`
- Responsive: `useBreakpoints()`, `useWindowSize()`
- Forms: `useFormValidator()` (Valibot integration)
- Utilities: `useTimer()`, `useSwipe()`, `useIdleTimeout()`

### Theming
- 4 built-in presets
- Custom theme creation
- Dark mode support
- CSS variable system
- Utility classes

### i18n
- 27 languages included
- Custom translations
- Locale switching
- Component text translation

## Autonomous Agents & Commands (v2.0.0)

### Autonomous Agents

**Component Scaffolder** (`component-scaffolder`)
- Generates production-ready Maz-UI components with TypeScript
- Includes validation, error handling, accessibility, and loading states
- Supports forms, dialogs, data tables, and interactive components
- Best practices built-in: ARIA attributes, proper types, error recovery

**Form Generator** (`form-generator`)
- Creates complete forms with Valibot validation schemas
- All 5 validation modes: lazy, aggressive, eager, blur, progressive
- Async validation, custom validators, cross-field validation
- Complete submit handling with loading/error/success states
- Common templates: login, registration, contact, checkout

**Theme Customizer** (`theme-customizer`)
- Generates custom themes with color palettes (light/dark modes)
- WCAG 2.1 AA accessibility validation (contrast ratios)
- Color harmony strategies: monochromatic, analogous, complementary, triadic
- Foundation customization: typography, borders, spacing
- Integration instructions for Vue 3 and Nuxt 3

### Commands

**Snippets** (`/snippets`)
- Quick code snippets for common Maz-UI patterns
- Categories: forms, dialogs, toasts, validation, components, theme, setup
- Ready-to-use templates with best practices
- Examples: contact form, login with async validation, confirmation dialog, data table

### Templates

⚠️ **BREAKING CHANGE (v4.3.3)** ⚠️

Templates have been reorganized into framework-specific directories for better optimization:

**Old structure** (deprecated):
```
templates/
├── components/
└── setup/
```

**New structure**:
```
templates/
├── vue/        # Vue 3 + Vite (explicit imports, fetch())
│   ├── components/
│   └── setup/
└── nuxt/       # Nuxt 3 (auto-imports, $fetch)
    ├── components/
    └── setup/
```

**Migration**: Change template references from `templates/components/X.vue` to:
- `templates/vue/components/X.vue` (for Vue 3 projects)
- `templates/nuxt/components/X.vue` (for Nuxt 3 projects)

**Why separate templates?**
Each framework gets optimized, production-ready examples:
- **Vue templates**: Use `fetch()`, explicit imports, Vite optimizations
- **Nuxt templates**: Use `$fetch`, auto-imports, SSR patterns

No compromises. No conditional logic. Just best practices for each framework.

---

**10 Production-Ready Templates** (5 Vue + 5 Nuxt):

**Vue 3 + Vite** (`templates/vue/`):
- `setup/vite.config.ts` - Vite configuration with auto-import resolvers
- `components/form-basic.vue` - Basic form with Valibot validation
- `components/form-multi-step.vue` - Multi-step wizard with stepper
- `components/dialog-confirm.vue` - Confirmation dialogs (both patterns)
- `components/data-table.vue` - Data table with pagination/sort/search

**Nuxt 3** (`templates/nuxt/`):
- `setup/nuxt.config.ts` - Nuxt module configuration with Maz-UI
- `components/form-basic.vue` - Basic form (auto-imports, $fetch)
- `components/form-multi-step.vue` - Multi-step wizard (auto-imports)
- `components/dialog-confirm.vue` - Confirmation dialogs (auto-imports)
- `components/data-table.vue` - Data table with reactive data loading

## Reference Files

The skill includes 21 comprehensive reference guides:

**Components** (4 files):
- `components-forms.md` - All form components and validation
- `components-feedback.md` - Loaders, progress, animations
- `components-navigation.md` - Tabs, steppers, pagination
- `components-layout.md` - Cards, drawers, carousels, galleries

**Setup & Configuration** (2 files):
- `setup-vue.md` - Complete Vue 3 installation and configuration
- `setup-nuxt.md` - Nuxt 3 module setup with auto-imports

**Core Features** (5 files):
- `composables.md` - All 14 composables with API tables
- `directives.md` - All 5 directives (tooltip, click-outside, lazy-img, etc.)
- `plugins.md` - All 4 plugins (Toast, Dialog, AOS, Wait)
- `resolvers.md` - **CRITICAL**: Auto-import resolvers for tree-shaking
- `translations.md` - Multi-language support, lazy loading, SSR hydration

**Tools & Integrations** (3 files):
- `icons.md` - @maz-ui/icons package (840+ icons)
- `cli.md` - @maz-ui/cli (legacy) and v4 migration
- `mcp.md` - Model Context Protocol server for AI assistants

**Advanced Topics** (5 files):
- `theming.md` - Theme customization and dark mode
- `performance.md` - Bundle optimization (300KB → 15KB)
- `ssr-ssg.md` - Comprehensive SSR/SSG guide
- `accessibility.md` - WCAG 2.1 AA compliance
- `form-validation.md` - useFormValidator with Valibot

**Troubleshooting** (2 files):
- `migration-v4.md` - v3 to v4 upgrade guide
- `troubleshooting.md` - Common errors and solutions

## Common Use Cases

1. **Form-Heavy Applications**: Use MazInput, MazSelect, MazInputPhoneNumber, and useFormValidator for robust form handling

2. **Dashboard/Admin Panels**: Leverage MazTable, MazChart, MazCard, and theme system for data-rich interfaces

3. **E-Commerce**: Use MazInputPrice, MazCarousel, MazDialog for product displays and checkout flows

4. **Multi-Language Apps**: Utilize built-in i18n support with @maz-ui/translations

5. **Mobile-First PWAs**: Benefit from MazBottomSheet, MazPullToRefresh, and responsive utilities

## Installation

```bash
# Vue 3
pnpm add maz-ui @maz-ui/themes

# Nuxt 3
pnpm add @maz-ui/nuxt

# Optional packages
pnpm add @maz-ui/icons          # 840+ icons
pnpm add @maz-ui/translations   # i18n support
pnpm add libphonenumber-js      # For MazInputPhoneNumber
pnpm add valibot                # For useFormValidator
```

## Official Resources

- **Documentation**: https://maz-ui.com
- **GitHub**: https://github.com/LouisMazel/maz-ui
- **NPM**: https://www.npmjs.com/package/maz-ui
- **Discord**: https://discord.gg/maz-ui
- **Changelog**: https://github.com/LouisMazel/maz-ui/blob/master/CHANGELOG.md

## License

This skill is MIT licensed. Maz-UI library is also MIT licensed.

## Maintainers

Claude Skills Maintainers | https://github.com/secondsky/claude-skills
