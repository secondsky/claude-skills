# Nuxt UI v4 - Common Errors & Detailed Solutions

Complete troubleshooting guide for Nuxt UI v4 with 20 common errors and their solutions.

**Last Updated**: 2025-11-22

---

## Error Index

Jump to specific errors:
- [1. Missing UApp Wrapper](#1-missing-uapp-wrapper)
- [2. Module Not Registered](#2-module-not-registered)
- [3. CSS Import Order](#3-css-import-order)
- [4. useToast Not Imported](#4-usetoast-not-imported)
- [5. Toast Positioning Conflicts](#5-toast-positioning-conflicts)
- [6. CommandPalette Shortcuts Not Working](#6-commandpalette-shortcuts-not-working)
- [7. Carousel Not Displaying](#7-carousel-not-displaying)
- [8. Drawer Not Responsive](#8-drawer-not-responsive)
- [9. Modal vs Dialog Confusion](#9-modal-vs-dialog-confusion)
- [10. Popover Positioning Issues](#10-popover-positioning-issues)
- [11. Skeleton Dimensions Wrong](#11-skeleton-dimensions-wrong)
- [12. Card Slots Not Working](#12-card-slots-not-working)
- [13. Avatar Fallback Missing](#13-avatar-fallback-missing)
- [14. Badge Positioning Wrong](#14-badge-positioning-wrong)
- [15. Form Nested Prop Missing](#15-form-nested-prop-missing)
- [16. Table Pagination State](#16-table-pagination-state)
- [17. Color Mode Not Persisting](#17-color-mode-not-persisting)
- [18. TypeScript Types Not Generated](#18-typescript-types-not-generated)
- [19. Theme Variants Not Applying](#19-theme-variants-not-applying)
- [20. Responsive Patterns Broken](#20-responsive-patterns-broken)

---

## 1. Missing UApp Wrapper

**Error**: Components not rendering or styles missing

**Symptoms**:
- Nuxt UI components render without styles
- Dark mode not working
- Components appear as unstyled HTML
- Console errors about missing context

**Root Cause**: `<UApp>` provides the required Vue context for all Nuxt UI components, including color mode, toast container, and global styles.

**Solution**: Wrap your entire app with `<UApp>` in `app.vue`:

```vue
<!-- app.vue -->
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

**Why this works**: `<UApp>` initializes:
- Color mode provider (`useColorMode`)
- Toast notification container
- Global CSS variables
- Component context

---

## 2. Module Not Registered

**Error**: "Cannot find module @nuxt/ui" or components not recognized

**Symptoms**:
- TypeScript errors for component names
- Components don't render
- Module import errors in console
- Auto-imports not working

**Root Cause**: `@nuxt/ui` module not registered in Nuxt configuration.

**Solution**: Add module to `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```

**Additional troubleshooting**:
```bash
# Verify installation
bun list | grep @nuxt/ui

# Reinstall if necessary
bun remove @nuxt/ui
bun add @nuxt/ui

# Clear .nuxt cache
rm -rf .nuxt
bunx nuxt prepare
```

---

## 3. CSS Import Order

**Error**: Styles not applying correctly, Tailwind classes overridden

**Symptoms**:
- Component styles look broken
- Tailwind utilities don't work
- Dark mode colors incorrect
- Custom theme not applying

**Root Cause**: Incorrect CSS import order causes Tailwind to override Nuxt UI styles.

**Solution**: Import Tailwind CSS before Nuxt UI in your global CSS file:

```vue
<!-- app.vue or layouts/default.vue -->
<style>
@import "tailwindcss";  /* First - base Tailwind */
@import "@nuxt/ui";     /* Second - Nuxt UI components */
</style>
```

**Why this matters**: Nuxt UI's component styles should override Tailwind's base styles to ensure proper theming.

---

## 4. useToast Not Imported

**Error**: "useToast is not defined" or "Cannot read property 'add' of undefined"

**Symptoms**:
- Runtime error when calling toast functions
- TypeScript error in IDE
- Toast notifications don't appear

**Root Cause**: `useToast` composable not imported (not auto-imported in some contexts).

**Solution**: Explicitly import or use auto-import:

```typescript
// Auto-import (recommended in components)
const { add } = useToast()

add({
  title: 'Success',
  description: 'Operation completed'
})

// Explicit import (needed in utils/stores)
import { useToast } from '#app'

const toast = useToast()
toast.add({ title: 'Message' })
```

---

## 5. Toast Positioning Conflicts

**Error**: Toasts appearing in wrong location or overlapping with other UI

**Symptoms**:
- Toasts appear in unexpected corner
- Multiple toasts stack incorrectly
- Toasts hidden behind other elements
- Z-index conflicts

**Root Cause**: Default toast position conflicts with app layout or not configured.

**Solution**: Configure position in `app.config.ts`:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    toast: {
      position: 'top-right', // Options: top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
      container: 'fixed z-50 inset-0 pointer-events-none p-4',
      wrapper: 'w-full pointer-events-auto'
    }
  }
})
```

**Per-toast positioning**:
```typescript
const { add } = useToast()

add({
  title: 'Custom positioned',
  position: 'bottom-center' // Override global setting
})
```

---

## 6. CommandPalette Shortcuts Not Working

**Error**: Keyboard shortcuts (Cmd+K) not triggering CommandPalette

**Symptoms**:
- Keyboard shortcuts don't open palette
- Other shortcuts conflict
- Shortcuts work in some components but not others

**Root Cause**: Shortcuts not registered with `defineShortcuts` composable.

**Solution**: Use `defineShortcuts` composable:

```vue
<script setup lang="ts">
const isOpen = ref(false)

defineShortcuts({
  'meta_k': {
    handler: () => {
      isOpen.value = !isOpen.value
    }
  },
  'ctrl_k': { // Alternative for non-Mac
    handler: () => {
      isOpen.value = !isOpen.value
    }
  }
})
</script>

<template>
  <UCommandPalette v-model="isOpen" :groups="groups" />
</template>
```

**Global shortcuts** (in `app.vue`):
```typescript
defineShortcuts({
  'escape': () => closeAllModals(),
  'meta_/': () => openSearch()
})
```

---

## 7. Carousel Not Displaying

**Error**: Carousel components not working or slides not navigating

**Symptoms**:
- Carousel renders blank
- Slides don't transition
- Navigation arrows don't work
- Console error about Embla

**Root Cause**: Missing `embla-carousel-vue` peer dependency.

**Solution**: Install Embla Carousel:

```bash
bun add embla-carousel-vue
```

**Usage**:
```vue
<template>
  <UCarousel :items="slides" />
</template>

<script setup lang="ts">
const slides = [
  { id: 1, content: 'Slide 1' },
  { id: 2, content: 'Slide 2' },
  { id: 3, content: 'Slide 3' }
]
</script>
```

---

## 8. Drawer Not Responsive

**Error**: Drawer doesn't adapt to mobile screen sizes

**Symptoms**:
- Drawer too wide on mobile
- Drawer opens from wrong side
- Backdrop doesn't cover full screen on mobile

**Root Cause**: No responsive breakpoint handling for overlay components.

**Solution**: Use responsive patterns with `useMediaQuery`:

```vue
<template>
  <!-- Desktop: Modal, Mobile: Drawer -->
  <UModal v-if="!isMobile" v-model="isOpen">
    <UCard>
      <p>Desktop modal content</p>
    </UCard>
  </UModal>

  <UDrawer v-else v-model="isOpen" side="right">
    <UCard>
      <p>Mobile drawer content</p>
    </UCard>
  </UDrawer>
</template>

<script setup lang="ts">
const isOpen = ref(false)
const isMobile = useMediaQuery('(max-width: 768px)')
</script>
```

**Alternative: Sheet for mobile-first**:
```vue
<USheet v-model="isOpen">
  <!-- Automatically becomes bottom sheet on mobile -->
</USheet>
```

---

## 9. Modal vs Dialog Confusion

**Error**: Using wrong overlay component for the use case

**Symptoms**:
- Overlay doesn't behave as expected
- Too much or too little functionality
- Accessibility issues

**Root Cause**: Not understanding component purposes.

**Decision Guide**:

| Component | Use Case | Features |
|-----------|----------|----------|
| **Modal** | Full-featured overlays, forms, content | Backdrop, keyboard nav, header/footer slots |
| **Dialog** | Confirmation prompts, alerts | Simple yes/no, auto-focus confirm button |
| **Drawer** | Side panels, filters, navigation | Slides from edge, mobile-friendly |
| **Popover** | Contextual info, tooltips with interaction | Positioned relative to trigger, auto-dismiss |
| **Sheet** | Bottom drawers, mobile actions | Bottom slide-up, iOS-style |
| **Tooltip** | Hover-only info | No interaction, auto-hide on unhover |

**Examples**:

```vue
<!-- ✓ Modal: Complex form -->
<UModal v-model="showEditForm">
  <UForm @submit="onSubmit">
    <UFormGroup label="Name">
      <UInput v-model="name" />
    </UFormGroup>
  </UForm>
</UModal>

<!-- ✓ Dialog: Confirmation -->
<UDialog
  title="Delete item?"
  description="This action cannot be undone"
  :actions="[
    { label: 'Cancel', color: 'neutral' },
    { label: 'Delete', color: 'red', onClick: deleteItem }
  ]"
/>

<!-- ✓ Drawer: Filters -->
<UDrawer v-model="showFilters" side="right">
  <UCard>
    <template #header>Filters</template>
    <!-- Filter options -->
  </UCard>
</UDrawer>

<!-- ✓ Popover: Contextual actions -->
<UPopover>
  <UButton>Options</UButton>
  <template #panel>
    <div class="p-2">
      <UButton variant="ghost">Edit</UButton>
      <UButton variant="ghost">Delete</UButton>
    </div>
  </template>
</UPopover>
```

---

## 10. Popover Positioning Issues

**Error**: Popover appears in wrong position or gets cut off

**Symptoms**:
- Popover off-screen
- Popover covers trigger button
- Incorrect alignment

**Root Cause**: Default positioning doesn't account for viewport edges or scroll.

**Solution**: Configure placement and flip behavior:

```vue
<UPopover
  placement="bottom-start"
  :flip="true"
  :offset="8"
>
  <UButton>Trigger</UButton>
  <template #panel>
    <div class="p-4">Content</div>
  </template>
</UPopover>
```

**All placement options**:
- `top`, `top-start`, `top-end`
- `bottom`, `bottom-start`, `bottom-end`
- `left`, `left-start`, `left-end`
- `right`, `right-start`, `right-end`

**Auto-flip** (default `true`): Automatically flips to opposite side if no space

---

## 11. Skeleton Dimensions Wrong

**Error**: Skeleton loader doesn't match actual content dimensions

**Symptoms**:
- Layout shift when content loads
- Skeleton too small or too large
- Poor loading UX

**Root Cause**: Skeleton dimensions don't match real content.

**Solution**: Match exact dimensions of actual elements:

```vue
<template>
  <!-- Loading state -->
  <div v-if="loading">
    <USkeleton class="h-12 w-64 mb-4" /> <!-- Matches heading -->
    <USkeleton class="h-4 w-full mb-2" /> <!-- Matches paragraph -->
    <USkeleton class="h-4 w-3/4" /> <!-- Matches paragraph -->
  </div>

  <!-- Actual content -->
  <div v-else>
    <h1 class="h-12 w-64 mb-4">{{ title }}</h1>
    <p class="h-4 w-full mb-2">{{ paragraph1 }}</p>
    <p class="h-4 w-3/4">{{ paragraph2 }}</p>
  </div>
</template>
```

**Card skeleton example**:
```vue
<UCard v-if="loading">
  <USkeleton class="h-40 w-full mb-4" /> <!-- Image -->
  <USkeleton class="h-6 w-3/4 mb-2" /> <!-- Title -->
  <USkeleton class="h-4 w-full" /> <!-- Description -->
</UCard>
```

---

## 12. Card Slots Not Working

**Error**: Card header/footer not rendering

**Symptoms**:
- Header or footer content missing
- Slots don't appear
- Layout broken

**Root Cause**: Incorrect slot syntax or slot names.

**Solution**: Use proper named slot syntax:

```vue
<UCard>
  <template #header>
    <div class="flex items-center justify-between">
      <h3>Card Header</h3>
      <UButton size="xs">Action</UButton>
    </div>
  </template>

  <!-- Default slot: card body -->
  <p>This is the main card content</p>

  <template #footer>
    <div class="flex gap-2">
      <UButton>Cancel</UButton>
      <UButton color="primary">Save</UButton>
    </div>
  </template>
</UCard>
```

**Available slots**:
- `header`: Top section
- `default`: Main content (unnamed slot)
- `footer`: Bottom section

---

## 13. Avatar Fallback Missing

**Error**: Broken image icon when avatar image fails to load

**Symptoms**:
- Broken image placeholder
- No fallback text
- Poor UX for missing avatars

**Root Cause**: No `alt` text provided for fallback initials.

**Solution**: Add `alt` text (generates initials automatically):

```vue
<!-- ✓ With fallback -->
<UAvatar
  src="/nonexistent.jpg"
  alt="John Doe"
/>
<!-- Shows "JD" if image fails -->

<!-- ✗ Without fallback -->
<UAvatar src="/nonexistent.jpg" />
<!-- Shows broken image icon -->
```

**Avatar with explicit initials**:
```vue
<UAvatar :text="getUserInitials(user.name)" />
```

**Avatar groups**:
```vue
<UAvatarGroup :max="3">
  <UAvatar v-for="user in users" :key="user.id" :alt="user.name" />
</UAvatarGroup>
```

---

## 14. Badge Positioning Wrong

**Error**: Badge not positioned correctly on buttons/avatars

**Symptoms**:
- Badge inside element instead of overlaid
- Badge not in corner
- Badge positioning breaks on resize

**Root Cause**: Missing `relative` positioning on parent element.

**Solution**: Use `relative` positioning on parent:

```vue
<!-- Notification badge on button -->
<div class="relative">
  <UButton>Messages</UButton>
  <UBadge class="absolute -top-2 -right-2" color="red">5</UBadge>
</div>

<!-- Status badge on avatar -->
<div class="relative">
  <UAvatar src="/avatar.jpg" alt="User" />
  <UBadge class="absolute bottom-0 right-0" color="green" />
</div>
```

**Using `position` prop** (Nuxt UI v4+):
```vue
<UBadge position="top-right" color="red">New</UBadge>
```

---

## 15. Form Nested Prop Missing

**Error**: Nested form validation fails or doesn't trigger

**Symptoms**:
- Inner form validation not working
- Submit button doesn't respect nested validation
- Console errors about duplicate form context

**Root Cause**: Missing `nested` prop on inner `<UForm>`.

**Solution**: Add `nested` prop to inner forms:

```vue
<UForm :state="outerState" @submit="onSubmit">
  <UFormGroup label="Parent Field">
    <UInput v-model="outerState.parentField" />
  </UFormGroup>

  <!-- Nested form -->
  <UForm :state="innerState" nested>
    <UFormGroup label="Child Field">
      <UInput v-model="innerState.childField" />
    </UFormGroup>
  </UForm>

  <UButton type="submit">Submit All</UButton>
</UForm>
```

**Why this works**: The `nested` prop prevents the inner form from creating its own submit context.

---

## 16. Table Pagination State

**Error**: Pagination controls not updating when page changes

**Symptoms**:
- Page number doesn't update
- Can't navigate between pages
- `page` prop not reactive

**Root Cause**: Not using `v-model` for pagination state.

**Solution**: Use `v-model` for reactive pagination:

```vue
<template>
  <UTable
    v-model:page="page"
    v-model:page-count="pageCount"
    :rows="paginatedRows"
    :columns="columns"
  >
    <template #pagination>
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="totalRows"
      />
    </template>
  </UTable>
</template>

<script setup lang="ts">
const page = ref(1)
const pageSize = 10
const totalRows = computed(() => allRows.value.length)
const pageCount = computed(() => Math.ceil(totalRows.value / pageSize))

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return allRows.value.slice(start, start + pageSize)
})
</script>
```

---

## 17. Color Mode Not Persisting

**Error**: Dark mode setting resets on page reload

**Symptoms**:
- User's color preference forgotten
- Always starts in light mode
- Toggle doesn't save

**Root Cause**: This is actually NOT an error - color mode auto-persists by default.

**How it works**:
```typescript
const colorMode = useColorMode()

// Automatically persisted to localStorage
colorMode.value = 'dark'

// Preference key: 'nuxt-color-mode'
```

**If persistence isn't working**, check:
1. localStorage is enabled (not in incognito mode)
2. Not overriding with `preference: 'system'`
3. Browser allows localStorage

**Force system preference**:
```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colorMode: {
      preference: 'system' // Always use system preference
    }
  }
})
```

---

## 18. TypeScript Types Not Generated

**Error**: TypeScript errors for component types or auto-imports

**Symptoms**:
- Red squiggles in IDE
- "Cannot find name 'UButton'"
- Auto-imports not working
- `.nuxt/` directory missing types

**Root Cause**: Types not generated or stale.

**Solution**: Run type generation:

```bash
# Generate types
bunx nuxt prepare

# Or run dev (auto-generates types)
bunx nuxt dev
```

**Persistent issues**:
```bash
# Clear cache and regenerate
rm -rf .nuxt
bunx nuxt prepare

# Check tsconfig.json extends
{
  "extends": "./.nuxt/tsconfig.json"
}
```

**Add to `.gitignore`**:
```
.nuxt/
```

---

## 19. Theme Variants Not Applying

**Error**: Custom theme configuration not working

**Symptoms**:
- `ui` prop changes ignored
- Global theme not applied
- Component still uses default theme

**Root Cause**: Incorrect customization order or syntax.

**Customization hierarchy** (lowest to highest priority):
1. Global theme (`app.config.ts`)
2. Component `ui` prop
3. Tailwind classes

**Solution**: Check customization order:

```vue
<template>
  <!-- Method 1: Global theme (lowest priority) -->
  <!-- See app.config.ts -->

  <!-- Method 2: ui prop (medium priority) -->
  <UButton
    :ui="{
      base: 'font-bold',
      variant: {
        solid: 'bg-custom-500'
      }
    }"
  >
    Custom Button
  </UButton>

  <!-- Method 3: class (highest priority) -->
  <UButton class="!bg-red-500 !text-white">
    Override All
  </UButton>
</template>
```

**Global theme** (`app.config.ts`):
```typescript
export default defineAppConfig({
  ui: {
    button: {
      base: 'font-semibold',
      variant: {
        solid: 'bg-primary-600 hover:bg-primary-700'
      }
    }
  }
})
```

---

## 20. Responsive Patterns Broken

**Error**: Mobile layouts not working as expected

**Symptoms**:
- Grid doesn't stack on mobile
- Text too small on mobile
- Buttons too close together
- Horizontal scroll on mobile

**Root Cause**: Not using Tailwind responsive utilities.

**Solution**: Use responsive breakpoint prefixes:

```vue
<template>
  <!-- Responsive grid: 1 col mobile, 2 tablet, 3 desktop -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <UCard v-for="item in items" :key="item.id">
      {{ item.title }}
    </UCard>
  </div>

  <!-- Responsive text sizes -->
  <h1 class="text-2xl md:text-3xl lg:text-4xl">
    Responsive Heading
  </h1>

  <!-- Responsive spacing -->
  <div class="p-4 md:p-6 lg:p-8">
    Content with responsive padding
  </div>

  <!-- Responsive flex direction -->
  <div class="flex flex-col md:flex-row gap-4">
    <UButton>Action 1</UButton>
    <UButton>Action 2</UButton>
  </div>
</template>
```

**Tailwind breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Mobile-first approach**: Always style mobile first, then add `md:`, `lg:` overrides.

---

## 21. Cannot read property 'focus' of undefined (v4.2+)

**Error**: `TypeError: Cannot read properties of undefined (reading 'focus')` or `inputRef.value.$el is undefined`

**Symptoms**:
- Template refs not working after upgrading to v4.2.0+
- `.$el` accessor returns undefined
- TypeScript errors on component refs
- Focus/scroll operations failing

**Root Cause**: Breaking change in v4.2.0 - InputMenu, InputNumber, and SelectMenu now expose HTML elements directly instead of component instances.

**Affected Components**:
- `UInputMenu`
- `UInputNumber`
- `USelectMenu`

**Solution**: Remove the `.$el` accessor and use direct element access:

**Before (v4.0/v4.1)** ❌:
```vue
<template>
  <UInputMenu ref="inputRef" />
</template>

<script setup lang="ts">
const inputRef = ref()

onMounted(() => {
  // Old way - component instance
  inputRef.value.$el.focus()  // ❌ Breaks in v4.2+
})
</script>
```

**After (v4.2+)** ✅:
```vue
<template>
  <UInputMenu ref="inputRef" />
</template>

<script setup lang="ts">
const inputRef = ref<HTMLElement>()

onMounted(() => {
  // New way - direct element access
  inputRef.value?.focus()  // ✅ Works in v4.2+
})
</script>
```

**Migration steps**:
1. Search codebase for `.$el` usage on InputMenu, InputNumber, SelectMenu
2. Remove all `.$el` accessors
3. Update TypeScript types from component refs to `HTMLElement`
4. Test all imperative DOM operations (focus, scroll, etc.)

**Complete migration example**:
```vue
<template>
  <div class="space-y-4">
    <UInputMenu ref="menuRef" />
    <UInputNumber ref="numberRef" />
    <USelectMenu ref="selectRef" />
    <UButton @click="focusAll">Focus All</UButton>
  </div>
</template>

<script setup lang="ts">
// ✅ Correct types for v4.2+
const menuRef = ref<HTMLElement>()
const numberRef = ref<HTMLElement>()
const selectRef = ref<HTMLElement>()

function focusAll() {
  // ✅ Direct element access
  menuRef.value?.focus()
  numberRef.value?.focus()
  selectRef.value?.focus()

  // ✅ Scrolling also works
  menuRef.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>
```

**Why this change?**: Consistency with other Nuxt UI components and HTML standards. Most components already exposed HTML elements directly.

**See also**: `nuxt-v4-features.md` for complete v4.2.x migration guide

---

**See also:**
- `COMPONENT_EXAMPLES_DETAILED.md` for component-specific examples
- `RESPONSIVE_ACCESSIBILITY.md` for responsive patterns and accessibility
- `ADVANCED_CUSTOMIZATION.md` for theming details
