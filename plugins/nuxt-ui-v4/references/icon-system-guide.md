# Icon System Guide - Nuxt UI v4

Comprehensive guide to using icons in Nuxt UI v4 with Iconify integration.

---

## Overview

Nuxt UI v4 integrates with **Iconify**, providing access to **200,000+ icons** from 150+ icon sets without manual installation. Icons work automatically via the `i-` prefix convention.

**Key Features:**
- 200,000+ icons from popular icon sets
- Zero configuration required
- Automatic tree-shaking (only used icons bundled)
- Works with all Nuxt UI components
- SVG-based for perfect scaling
- Supports both filled and outlined variants

---

## Installation

Icons work out-of-the-box with Nuxt UI v4. No additional packages needed.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
  // Icons work automatically via Iconify integration
})
```

---

## Icon Naming Convention

Use the `i-{collection}-{icon-name}` format:

```
i-lucide-user          // Lucide Icons: user
i-heroicons-envelope   // Heroicons: envelope
i-simple-icons-github  // Simple Icons: GitHub logo
i-mdi-home             // Material Design Icons: home
```

**Pattern:** `i-{collection}-{icon-name}`

---

## Popular Icon Collections

### Lucide Icons (Recommended)
**Collection:** `i-lucide-*`
**Count:** 1,400+ icons
**Style:** Outlined, consistent stroke width
**Best for:** Modern UI, consistent design system

```vue
<UIcon name="i-lucide-user" />
<UIcon name="i-lucide-search" />
<UIcon name="i-lucide-settings" />
<UIcon name="i-lucide-chevron-down" />
<UIcon name="i-lucide-check-circle" />
<UIcon name="i-lucide-alert-triangle" />
```

**Browse:** https://lucide.dev/icons/

### Heroicons
**Collection:** `i-heroicons-*`
**Count:** 290+ icons
**Style:** Outlined and solid variants
**Best for:** Tailwind CSS projects, web applications

```vue
<!-- Outline (default) -->
<UIcon name="i-heroicons-envelope" />
<UIcon name="i-heroicons-user" />

<!-- Solid variant -->
<UIcon name="i-heroicons-envelope-solid" />
<UIcon name="i-heroicons-user-solid" />
```

**Browse:** https://heroicons.com/

### Simple Icons
**Collection:** `i-simple-icons-*`
**Count:** 3,000+ brand icons
**Style:** Monochrome brand logos
**Best for:** Social media, tech brands, company logos

```vue
<UIcon name="i-simple-icons-github" />
<UIcon name="i-simple-icons-twitter" />
<UIcon name="i-simple-icons-google" />
<UIcon name="i-simple-icons-vercel" />
<UIcon name="i-simple-icons-cloudflare" />
```

**Browse:** https://simpleicons.org/

### Material Design Icons (MDI)
**Collection:** `i-mdi-*`
**Count:** 7,000+ icons
**Style:** Filled, comprehensive coverage
**Best for:** Material Design projects, Android apps

```vue
<UIcon name="i-mdi-home" />
<UIcon name="i-mdi-account" />
<UIcon name="i-mdi-cog" />
<UIcon name="i-mdi-email" />
```

**Browse:** https://pictogrammers.com/library/mdi/

### Other Popular Collections
- **Font Awesome**: `i-fa-*` or `i-fa6-*`
- **Tabler Icons**: `i-tabler-*`
- **Bootstrap Icons**: `i-bi-*`
- **Feather Icons**: `i-feather-*`
- **Phosphor Icons**: `i-ph-*`
- **Carbon Icons**: `i-carbon-*`

**Browse all collections:** https://icon-sets.iconify.design/

---

## Using Icons in Components

### Standalone UIcon Component

```vue
<template>
  <!-- Basic usage -->
  <UIcon name="i-lucide-user" />

  <!-- Custom size (default: 1.25rem) -->
  <UIcon name="i-lucide-user" class="size-4" />
  <UIcon name="i-lucide-user" class="size-6" />
  <UIcon name="i-lucide-user" class="size-8" />

  <!-- Custom color -->
  <UIcon name="i-lucide-check-circle" class="text-success" />
  <UIcon name="i-lucide-alert-circle" class="text-warning" />
  <UIcon name="i-lucide-x-circle" class="text-error" />

  <!-- Dynamic icons -->
  <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" />
</template>
```

### Button Icons

Most components accept `icon`, `leading-icon`, or `trailing-icon` props:

```vue
<template>
  <!-- Icon only -->
  <UButton icon="i-lucide-save" />

  <!-- Leading icon -->
  <UButton leading-icon="i-lucide-plus">
    Add Item
  </UButton>

  <!-- Trailing icon -->
  <UButton trailing-icon="i-lucide-arrow-right">
    Continue
  </UButton>

  <!-- Both icons -->
  <UButton
    leading-icon="i-lucide-download"
    trailing-icon="i-lucide-chevron-down"
  >
    Export
  </UButton>

  <!-- Icon variant -->
  <UButton icon="i-lucide-trash" variant="ghost" color="error" />
</template>
```

### Input Icons

```vue
<template>
  <!-- Search input with leading icon -->
  <UInput
    leading-icon="i-lucide-search"
    placeholder="Search..."
  />

  <!-- Email input -->
  <UInput
    type="email"
    leading-icon="i-lucide-mail"
    placeholder="email@example.com"
  />

  <!-- Password with trailing icon -->
  <UInput
    type="password"
    leading-icon="i-lucide-lock"
    trailing-icon="i-lucide-eye"
  />

  <!-- Number input -->
  <UInput
    type="number"
    leading-icon="i-lucide-hash"
    trailing-icon="i-lucide-chevron-down"
  />
</template>
```

### Alert Icons

```vue
<template>
  <UAlert
    icon="i-lucide-info"
    title="Information"
    description="This is an informational message."
  />

  <UAlert
    icon="i-lucide-check-circle"
    title="Success"
    description="Operation completed successfully."
    color="success"
  />

  <UAlert
    icon="i-lucide-alert-triangle"
    title="Warning"
    description="Please review before proceeding."
    color="warning"
  />

  <UAlert
    icon="i-lucide-x-circle"
    title="Error"
    description="Something went wrong."
    color="error"
  />
</template>
```

### Navigation Icons

```vue
<template>
  <UNavigationMenu>
    <UNavigationMenuItem to="/" icon="i-lucide-home">
      Home
    </UNavigationMenuItem>

    <UNavigationMenuItem to="/products" icon="i-lucide-shopping-cart">
      Products
    </UNavigationMenuItem>

    <UNavigationMenuItem to="/settings" icon="i-lucide-settings">
      Settings
    </UNavigationMenuItem>

    <UNavigationMenuItem to="/profile" icon="i-lucide-user">
      Profile
    </UNavigationMenuItem>
  </UNavigationMenu>
</template>
```

### Dropdown Menu Icons

```vue
<template>
  <UDropdownMenu>
    <UButton trailing-icon="i-lucide-chevron-down">
      Actions
    </UButton>

    <template #content>
      <UDropdownMenuItem icon="i-lucide-edit">
        Edit
      </UDropdownMenuItem>

      <UDropdownMenuItem icon="i-lucide-copy">
        Duplicate
      </UDropdownMenuItem>

      <UDropdownMenuSeparator />

      <UDropdownMenuItem icon="i-lucide-trash" color="error">
        Delete
      </UDropdownMenuItem>
    </template>
  </UDropdownMenu>
</template>
```

### Tab Icons

```vue
<template>
  <UTabs :items="tabs" />
</template>

<script setup lang="ts">
const tabs = [
  { label: 'Profile', icon: 'i-lucide-user', value: 'profile' },
  { label: 'Settings', icon: 'i-lucide-settings', value: 'settings' },
  { label: 'Notifications', icon: 'i-lucide-bell', value: 'notifications' }
]
</script>
```

### Card Icons

```vue
<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-file-text" class="size-5" />
        <span>Document Title</span>
      </div>
    </template>

    Card content here...

    <template #footer>
      <div class="flex items-center gap-4">
        <UButton icon="i-lucide-download" variant="ghost" size="sm">
          Download
        </UButton>
        <UButton icon="i-lucide-share" variant="ghost" size="sm">
          Share
        </UButton>
      </div>
    </template>
  </UCard>
</template>
```

---

## Icon Sizing

Icons automatically scale with component size variants:

```vue
<template>
  <!-- Size variants -->
  <UButton size="xs" icon="i-lucide-plus" />  <!-- Smallest -->
  <UButton size="sm" icon="i-lucide-plus" />  <!-- Small -->
  <UButton size="md" icon="i-lucide-plus" />  <!-- Medium (default) -->
  <UButton size="lg" icon="i-lucide-plus" />  <!-- Large -->
  <UButton size="xl" icon="i-lucide-plus" />  <!-- Extra large -->

  <!-- Manual sizing with UIcon -->
  <UIcon name="i-lucide-star" class="size-3" />  <!-- 12px -->
  <UIcon name="i-lucide-star" class="size-4" />  <!-- 16px -->
  <UIcon name="i-lucide-star" class="size-5" />  <!-- 20px (default) -->
  <UIcon name="i-lucide-star" class="size-6" />  <!-- 24px -->
  <UIcon name="i-lucide-star" class="size-8" />  <!-- 32px -->
  <UIcon name="i-lucide-star" class="size-12" /> <!-- 48px -->
</template>
```

---

## Icon Colors

Icons inherit text color by default:

```vue
<template>
  <!-- Inherit text color -->
  <div class="text-primary">
    <UIcon name="i-lucide-heart" />  <!-- Blue (primary color) -->
  </div>

  <!-- Semantic colors -->
  <UIcon name="i-lucide-check-circle" class="text-success" />
  <UIcon name="i-lucide-info" class="text-info" />
  <UIcon name="i-lucide-alert-triangle" class="text-warning" />
  <UIcon name="i-lucide-x-circle" class="text-error" />

  <!-- Custom colors -->
  <UIcon name="i-lucide-star" class="text-yellow-500" />
  <UIcon name="i-lucide-heart" class="text-red-500" />
  <UIcon name="i-lucide-bell" class="text-purple-500" />

  <!-- Dark mode aware -->
  <UIcon name="i-lucide-moon" class="text-default" />
  <!-- Light mode: neutral-900, Dark mode: white -->
</template>
```

---

## Filled vs Outlined Variants

Some icon sets provide multiple variants:

```vue
<template>
  <!-- Heroicons: Outline (default) vs Solid -->
  <UIcon name="i-heroicons-heart" />          <!-- Outline -->
  <UIcon name="i-heroicons-heart-solid" />    <!-- Filled -->

  <!-- Font Awesome: Regular vs Solid -->
  <UIcon name="i-fa6-regular-star" />         <!-- Outline -->
  <UIcon name="i-fa6-solid-star" />           <!-- Filled -->

  <!-- Material Design Icons: Outline vs Filled -->
  <UIcon name="i-mdi-heart-outline" />        <!-- Outline -->
  <UIcon name="i-mdi-heart" />                <!-- Filled -->

  <!-- Lucide: All outlined (no filled variants) -->
  <UIcon name="i-lucide-star" />
</template>
```

---

## Dynamic Icons

### Based on State

```vue
<script setup lang="ts">
const isLiked = ref(false)
const isBookmarked = ref(false)
</script>

<template>
  <!-- Toggle heart icon -->
  <UButton
    :icon="isLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
    :class="isLiked ? 'text-red-500' : 'text-neutral-500'"
    @click="isLiked = !isLiked"
  />

  <!-- Toggle bookmark -->
  <UButton
    :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
    @click="isBookmarked = !isBookmarked"
  />
</template>
```

### Based on Item Type

```vue
<script setup lang="ts">
const fileIcons: Record<string, string> = {
  pdf: 'i-lucide-file-text',
  doc: 'i-lucide-file-text',
  xls: 'i-lucide-sheet',
  jpg: 'i-lucide-image',
  png: 'i-lucide-image',
  mp4: 'i-lucide-video',
  zip: 'i-lucide-file-archive'
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return fileIcons[ext] || 'i-lucide-file'
}
</script>

<template>
  <div v-for="file in files" :key="file.name">
    <UIcon :name="getFileIcon(file.name)" />
    {{ file.name }}
  </div>
</template>
```

---

## Best Practices

### 1. Choose One Icon Set for Consistency

```vue
<!-- ✅ GOOD: Consistent icon set -->
<UButton icon="i-lucide-home" />
<UButton icon="i-lucide-user" />
<UButton icon="i-lucide-settings" />

<!-- ❌ AVOID: Mixing icon sets -->
<UButton icon="i-lucide-home" />
<UButton icon="i-heroicons-user" />
<UButton icon="i-mdi-cog" />
```

**Recommendation:** Use **Lucide** or **Heroicons** for application UI.

### 2. Use Semantic Naming

```vue
<script setup lang="ts">
// ✅ GOOD: Named constants
const icons = {
  add: 'i-lucide-plus',
  edit: 'i-lucide-pencil',
  delete: 'i-lucide-trash',
  save: 'i-lucide-check'
}
</script>

<template>
  <UButton :icon="icons.add">Add</UButton>
  <UButton :icon="icons.save">Save</UButton>
</template>
```

### 3. Match Icon Variant to Design

```vue
<!-- ✅ GOOD: Outlined buttons with outlined icons -->
<UButton variant="outline" icon="i-lucide-plus" />

<!-- ✅ GOOD: Solid/filled buttons with solid icons (if available) -->
<UButton variant="solid" icon="i-heroicons-heart-solid" />

<!-- ⚠️ OK but less consistent: Mixing styles -->
<UButton variant="solid" icon="i-lucide-plus" />
```

### 4. Use Appropriate Icon Sizes

```vue
<!-- ✅ GOOD: Icon size matches context -->
<h1 class="flex items-center gap-2">
  <UIcon name="i-lucide-home" class="size-6" />
  Dashboard
</h1>

<p class="flex items-center gap-1">
  <UIcon name="i-lucide-info" class="size-4" />
  <span class="text-sm">Additional info</span>
</p>

<!-- ❌ AVOID: Icon too large for context -->
<p class="text-sm">
  <UIcon name="i-lucide-info" class="size-8" />
  Small text with huge icon
</p>
```

### 5. Provide Accessible Labels

```vue
<!-- ✅ GOOD: Accessible icon button -->
<UButton
  icon="i-lucide-settings"
  aria-label="Open settings"
/>

<!-- ✅ GOOD: Icon with visible label -->
<UButton leading-icon="i-lucide-download">
  Download
</UButton>

<!-- ❌ AVOID: Icon button without label -->
<UButton icon="i-lucide-settings" />
<!-- Screen readers don't know what this does -->
```

### 6. Tree-Shaking is Automatic

Icons are automatically tree-shaken. Only icons actually used in your code are bundled.

```vue
<!-- No configuration needed -->
<UIcon name="i-lucide-user" />
<!-- Only the 'user' icon is bundled, not all 1,400+ Lucide icons -->
```

---

## Troubleshooting

### Icon Not Displaying

**Problem:** Icon shows as broken or empty.

**Solution 1:** Verify icon name is correct:
- Check https://icon-sets.iconify.design/
- Ensure proper format: `i-{collection}-{name}`
- Use kebab-case for icon names

**Solution 2:** Check icon collection is available:
```bash
# Icons work automatically, but you can verify:
bun add @iconify/json
# This includes ALL icon sets (optional, only for offline usage)
```

### Icon Size Not Changing

**Problem:** Icon size doesn't respond to class utilities.

**Solution:** Use `size-*` utilities (not `w-*` and `h-*`):
```vue
<!-- ✅ GOOD -->
<UIcon name="i-lucide-user" class="size-6" />

<!-- ❌ DOESN'T WORK -->
<UIcon name="i-lucide-user" class="w-6 h-6" />
```

### Icon Color Not Changing

**Problem:** Icon color doesn't update.

**Solution:** Icons inherit `currentColor`. Ensure parent has text color:
```vue
<!-- ✅ GOOD -->
<div class="text-primary">
  <UIcon name="i-lucide-star" />
</div>

<!-- ✅ ALSO GOOD -->
<UIcon name="i-lucide-star" class="text-primary" />
```

---

## Resources

- **Iconify Icon Sets**: https://icon-sets.iconify.design/
- **Lucide Icons**: https://lucide.dev/
- **Heroicons**: https://heroicons.com/
- **Simple Icons**: https://simpleicons.org/
- **Material Design Icons**: https://pictogrammers.com/library/mdi/

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
**Icon Count**: 200,000+
**Collections**: 150+
