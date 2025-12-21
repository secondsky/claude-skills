---
name: nuxt-ui-v4
description: Nuxt UI v4 component library with 100+ accessible components, Tailwind v4, Reka UI. Use for design systems, forms, overlays, AI chat integration, or encountering theming, composable, TypeScript errors.

  Keywords: Nuxt v4, Nuxt 4, Nuxt UI v4, Nuxt UI 4, @nuxt/ui, Tailwind v4, Tailwind CSS 4, Reka UI, semantic colors, design system, accessible components, ARIA, WAI-ARIA, dark mode, color mode, theming, component library, form validation, Input, InputDate, InputTime, date picker, time picker, @internationalized/date, Select, Checkbox, Radio, Textarea, Table, Card, Container, Avatar, Badge, Button, Tabs, Breadcrumb, CommandPalette, Pagination, Modal, Drawer, Dialog, Popover, DropdownMenu, Tooltip, Sheet, Alert, Toast, Notification, Progress, Skeleton, Empty, empty state, Carousel, useToast, useNotification, useColorMode, defineShortcuts, UApp wrapper, Tailwind Variants, Tailwind prefix, component customization, component detection, virtualization, tree-shaking, responsive design, mobile patterns, AI SDK v5, chat interface, Zod validation, nested forms, file uploads, keyboard navigation, focus management, CSS variables, Embla carousel, Fuse.js search, template refs, $el accessor, v4.2 migration
license: MIT
metadata:
  version: 1.1.0
  last_verified: 2025-12-15
  nuxt_ui_version: 4.2.1
  nuxt_version: 4.0.0
  vue_version: 3.5.0
  tailwind_version: 4.0.0
  ai_sdk_version: 5.0.0
  author: Claude Skills Maintainers
  repository: https://github.com/secondsky/claude-skills
  production_tested: true
  token_savings: 70%
  errors_prevented: 21+
  component_count: 55
  template_count: 25
  reference_count: 28
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# Nuxt UI v4 - Production Component Library for Nuxt v4

**Version**: Nuxt UI v4.2.1 | Nuxt v4.0.0
**Last Verified**: 2025-12-15

A comprehensive production-ready component library combining 100+ accessible components with Nuxt v4's latest features, Tailwind CSS v4's performance, and Reka UI's accessibility foundation.

---

## When to Use / NOT Use

**Use when**: Setting up Nuxt v4 projects, building design systems with semantic colors, creating accessible forms/data displays, implementing navigation/overlays/feedback UI, integrating AI chat (AI SDK v5), customizing component themes, debugging Nuxt UI issues

**DON'T use**: Vue-only projects (no Nuxt), React projects, Nuxt 3 or earlier, Tailwind CSS v3, need headless-only components

---

## Quick Start

```bash
bunx nuxi init my-app && cd my-app
bun add @nuxt/ui
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({ modules: ['@nuxt/ui'] })
```

```vue
<!-- app.vue -->
<template><UApp><NuxtPage /></UApp></template>
<style>
@import "tailwindcss";
@import "@nuxt/ui";
</style>
```

Done! 100+ components ready: `<UButton>`, `<UCard>`, `<UModal>`, etc.

---

## What's New in v4

### Nuxt UI v4 Unified Release

**Major Changes:**
- **Unified Package**: Combines Nuxt UI (OSS) + Nuxt UI Pro into single `@nuxt/ui` package
- **100+ Components**: Massive expansion from v3's limited set
- **Reka UI Foundation**: Built on Reka UI (replaces Headless UI from v3)
- **Tailwind v4 Required**: CSS-first configuration, 5x faster builds
- **Enhanced Theming**: Tailwind Variants system for powerful customization
- **Better Accessibility**: WAI-ARIA compliant out of the box

**Performance Improvements:**
- Tailwind v4 delivers 5x faster build times
- CSS-first configuration reduces JavaScript overhead
- Optimized component rendering
- Better tree-shaking for smaller bundles

**Breaking Changes from v3:**

1. **Component Renames:**
   - `ButtonGroup` → `FieldGroup`
   - `PageMarquee` → `Marquee`
   - `PageAccordion` removed (use `Accordion` with `unmount-on-hide="false"`)

2. **Model Modifiers:**
   - `nullify` modifier renamed to `nullable`
   - New `optional` modifier added

3. **Form Changes:**
   - Transformations now apply only to submit data (not internal state)
   - Nested forms require explicit `nested` prop

4. **Content Utilities:**
   - Removed from Nuxt UI (use `@nuxt/content` directly)

### New in v4.2.x (November 2024)

**New Components:**
- **InputDate** - Date picker with calendar UI and range selection (requires `@internationalized/date`)
- **InputTime** - Time picker with 12/24-hour format support (requires `@internationalized/date`)
- **Empty** - Empty state display component with icon, title, description, and actions

**New Features:**
- **Tailwind CSS Prefix** (v4.2+) - Configure utility class prefixing to avoid conflicts → `references/tailwind-prefix-guide.md`
- **Component Virtualization** (v4.1+) - Render only visible items for large datasets (95% faster for 10k+ items) → `references/performance-optimization.md`
- **Experimental Component Detection** (v4.1+) - Auto tree-shaking for 70%+ CSS bundle size reduction → `references/performance-optimization.md`

**Breaking Changes (v4.2.0):**
- **Template Refs**: InputMenu, InputNumber, SelectMenu now return HTML elements directly (not component instances)
  - **Before**: `inputRef.value.$el.focus()` ❌
  - **After**: `inputRef.value?.focus()` ✅
- **Composable Imports**: No longer require `.js` extension
  - **Before**: `import { useToast } from '#ui/composables/useToast.js'` ❌
  - **After**: `import { useToast } from '#ui/composables/useToast'` ✅

**Migration Guide**: See `references/nuxt-v4-features.md` for complete v4.2.x migration steps

### Nuxt v4 Integration

This skill targets **Nuxt v4** with:
- Latest Nuxt v4 features and patterns
- Optimized for Nuxt v4's improved performance
- Compatible with Nuxt v4's module system
- TypeScript support with Nuxt v4's type generation

---

## Component Categories Overview

Nuxt UI v4 includes **55 components** across 7 categories:

### Forms (17 components)
Input, **InputDate (v4.2+)**, **InputTime (v4.2+)**, Select, SelectMenu, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Toggle, Slider, Range, Calendar, ColorPicker, PinInput, InputMenu

### Navigation (7 components)
Tabs, Breadcrumb, Link, Pagination, CommandPalette, NavigationMenu

### Overlays (7 components)
Modal, Drawer, Dialog, Popover, DropdownMenu, ContextMenu, Sheet, Tooltip

### Feedback (7 components)
Alert, Toast, Notification, Progress, Skeleton, **Empty (v4.2+)**

### Layout (4 components)
Card, Container, Divider

### Data (1 component)
Table

### General (12 components)
Button, ButtonGroup (FieldGroup), Avatar, AvatarGroup, Badge, Accordion, Carousel, Chip, Collapsible, Icon, Kbd

**Template Coverage**: This skill provides 15 copy-paste templates covering 30+ of the most commonly used components.

---

## Semantic Color System

Nuxt UI v4 uses **7 semantic color aliases**: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`.

Configure in `app.config.ts`:
```typescript
export default defineAppConfig({
  ui: {
    theme: {
      colors: { primary: 'violet', success: 'emerald' }
    }
  }
})
```

**CSS Utilities**: `text-default/dimmed/muted/inverse`, `bg-default/elevated/sunken/overlay`, `border-default/dimmed`

**Full details**: Load `references/semantic-color-system.md` for complete color configuration, CSS variables, and utility classes

---

## Component Theming & Customization

**Tailwind Variants** system with 3 levels: (1) Global Config (`app.config.ts`), (2) Component `:ui` prop, (3) Slot `class` prop.

```vue
<UButton :ui="{ base: 'font-bold rounded-full' }">Themed Button</UButton>
```

**Advanced theming**: Load `references/component-theming-guide.md` for compound variants, global themes, and customization patterns

---

## Form Components

**17 components**: Input, InputDate (v4.2+), InputTime (v4.2+), Select, SelectMenu, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Toggle, Slider, Range, Calendar, ColorPicker, PinInput, InputMenu

**Quick Example** (Zod validation):
```vue
<UForm :state="state" :schema="schema" @submit="onSubmit">
  <UFormField name="email" label="Email">
    <UInput v-model="state.email" type="email" />
  </UFormField>
  <UButton type="submit">Submit</UButton>
</UForm>

<script setup lang="ts">
const schema = z.object({
  email: z.string().email('Invalid email')
})
</script>
```

**New in v4.2**: `InputDate`, `InputTime` (require `@internationalized/date`)
```vue
<UInputDate v-model="date" range />
<UInputTime v-model="time" :hour-cycle="12" />
```

**Details**: Load `references/form-components-reference.md` for all 17 components, props, slots, and events
**Validation**: Load `references/form-validation-patterns.md` for Zod schemas, nested forms, and date/time validation
**Templates**: `templates/components/ui-form-example.vue`, `ui-input-date.vue`, `ui-input-time.vue`

---

## Data Display Components

**Table** with sorting, filtering, pagination:
```vue
<UTable :rows="rows" :columns="columns" :loading="loading" />
```

**Card** with header/footer slots, **Avatar**, **Badge** for status indicators.

**Details**: Load `references/data-display-components.md` for Table virtualization (v4.1+), Card layouts, Avatar groups, Badge variants
**Templates**: `templates/components/ui-data-table.vue`, `ui-card-layouts.vue`

---

## Navigation Components

**7 components**: Tabs, Breadcrumb, Link, Pagination, CommandPalette, NavigationMenu

**Quick Examples**:
```vue
<UTabs v-model="selected" :items="items" />
<UCommandPalette :groups="groups" placeholder="Search..." />
```

**Details**: Load `references/navigation-components-reference.md` for all navigation patterns, CommandPalette with Fuse.js, keyboard shortcuts
**Templates**: `templates/components/ui-navigation-tabs.vue`, `ui-command-palette.vue`

---

## Overlay Components

**7 components**: Modal, Drawer, Dialog, Popover, DropdownMenu, ContextMenu, Sheet, Tooltip

**Quick Examples**:
```vue
<UModal v-model="isOpen"><UCard>...</UCard></UModal>
<UDrawer v-model="isOpen" side="right">...</UDrawer>
<UDropdownMenu><UButton>Actions</UButton>...</UDropdownMenu>
<UTooltip text="Help"><UButton>Hover</UButton></UTooltip>
```

**Details**: Load `references/overlay-components.md` for all 7 overlay types, positioning, animations, accessibility
**Templates**: `templates/components/ui-modal-dialog.vue`, `ui-drawer-mobile.vue`, `ui-dropdown-menu.vue`

---

## Feedback Components

**7 components**: Alert, Toast, Notification, Progress, Skeleton, **Empty (v4.2+)**

**Quick Examples**:
```vue
<!-- Toast (via composable) -->
<script setup>
const { add } = useToast()
add({ title: 'Success!', color: 'success' })
</script>

<!-- Alert, Progress, Skeleton -->
<UAlert color="warning" title="Warning" />
<UProgress :value="60" :max="100" />
<USkeleton class="h-8 w-48" />

<!-- Empty state (v4.2+) -->
<UEmpty icon="i-heroicons-inbox" title="No messages" :actions="[...]" />
```

**Details**: Load `references/feedback-components-reference.md` for all 7 components, Empty state patterns, Toast/Notification API
**Templates**: `templates/components/ui-feedback-states.vue`, `ui-empty-state.vue`, `ui-toast-notifications.vue`

---

## Layout Components

**4 components**: Card, Container, Divider, with **Avatar** & **Badge** for UI elements.

```vue
<UContainer><div>...</div></UContainer>
<UAvatar src="/avatar.jpg" size="lg" />
<UBadge color="success">Online</UBadge>
```

**Details**: Load `references/layout-components-reference.md` for Container max-widths, Card slots, Avatar groups, Badge variants
**Templates**: `templates/components/ui-avatar-badge.vue`

---

## Composables

**Key composables**: `useToast`, `useNotification`, `useColorMode`, `defineShortcuts`

```typescript
const { add } = useToast()
add({ title: 'Success', color: 'success' })

const colorMode = useColorMode()
colorMode.preference = 'dark'

defineShortcuts({ 'meta_k': () => openCommandPalette() })
```

**Details**: Load `references/composables-guide.md` for all composable APIs, keyboard shortcuts, dark mode patterns
**Templates**: `templates/components/ui-dark-mode-toggle.vue`

---

## AI SDK v5 Integration

Build AI chat interfaces with Nuxt UI + AI SDK v5:

```vue
<script setup>
import { Chat } from '@ai-sdk/vue'
const chat = new Chat({ api: '/api/chat' })
</script>

<template>
  <div v-for="msg in chat.messages">
    <UCard><UAvatar />{{ msg.content }}</UCard>
  </div>
  <UInput v-model="input" @submit="chat.append({ role: 'user', content: input })" />
</template>
```

**Details**: Load `references/ai-sdk-v5-integration.md` for streaming chat, tool calling, embeddings, error handling
**Templates**: `templates/components/ui-chat-interface.vue`

---

## Dark Mode

**Enable** (default: true):
```typescript
// nuxt.config.ts
export default defineNuxtConfig({ ui: { colorMode: true } })
```

**Toggle**: `<UColorModeSwitch />` (built-in) or `useColorMode()` composable

**Details**: Load `references/dark-mode-guide.md` for auto-detection, localStorage persistence, CSS variables, theme switching

---

## TypeScript

Generate types: `bunx nuxt prepare`

```typescript
import type { Button } from '#ui/types'
const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>
```

**Details**: Load `references/typescript-setup.md` for type-safe props, Zod inference, tsconfig setup

---

## Common Errors (Top 3)

This skill prevents **21+ errors** (see `references/COMMON_ERRORS_DETAILED.md` for all 21).

**Top 3 Critical Errors**:

**1. Missing UApp Wrapper**
- **Symptom**: Components render without styles, dark mode broken
- **Fix**: Wrap app with `<UApp>` in app.vue:
  ```vue
  <template><UApp><NuxtPage /></UApp></template>
  ```

**2. CSS Import Order Wrong**
- **Symptom**: Styles not applying, themes broken
- **Fix**: Import tailwindcss FIRST, then @nuxt/ui:
  ```vue
  <style>
  @import "tailwindcss";  /* FIRST */
  @import "@nuxt/ui";     /* SECOND */
  </style>
  ```

**3. Template Refs Changed (v4.2+)**
- **Symptom**: `Cannot read property 'focus' of undefined` after upgrading to v4.2
- **Fix**: Remove `.$el` accessor on InputMenu, InputNumber, SelectMenu:
  ```typescript
  // Before: inputRef.value.$el.focus()
  // After:  inputRef.value?.focus()
  ```

**All 21 errors**: Load `references/COMMON_ERRORS_DETAILED.md` for complete solutions with symptoms, causes, and fixes

---

## When to Load References

**28 reference files** organized by task. Load only when needed to optimize tokens.

**Core Setup** (new projects, themes):
- `nuxt-v4-features.md`, `semantic-color-system.md`, `component-theming-guide.md`

**Components** (building UI):
- `form-components-reference.md`, `data-display-components.md`, `navigation-components-reference.md`, `overlay-components.md`, `feedback-components-reference.md`, `layout-components-reference.md`

**Features** (specific capabilities):
- `form-validation-patterns.md`, `dark-mode-guide.md`, `composables-guide.md`, `ai-sdk-v5-integration.md`, `tailwind-prefix-guide.md`, `performance-optimization.md`, `typescript-setup.md`

**Troubleshooting** (errors/debugging):
- `COMMON_ERRORS_DETAILED.md` (21 errors), `loading-feedback-patterns.md`

**Pro Tip**: Load references progressively as you encounter specific tasks to save tokens
