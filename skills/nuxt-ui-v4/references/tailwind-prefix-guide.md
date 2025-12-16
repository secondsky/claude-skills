# Tailwind CSS Prefix Configuration (v4.2+)

**Feature**: Available since Nuxt UI v4.2.0
**Purpose**: Configure a prefix for all Tailwind utility classes to avoid conflicts with other CSS frameworks

---

## Overview

The `theme.prefix` option allows you to configure a prefix for all Tailwind CSS utility classes used by Nuxt UI components. This is essential when you need to use Nuxt UI alongside other CSS frameworks that might have conflicting class names.

**When to use**:
- Integrating Nuxt UI with legacy CSS frameworks
- Avoiding style conflicts in large applications
- Working with micro-frontends that share global styles
- Migrating incrementally from another UI framework

---

## Configuration

### Nuxt Application

**Step 1**: Configure the prefix in `nuxt.config.ts`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      prefix: 'tw'  // Use 'tw:' prefix for all utilities
    }
  }
})
```

**Step 2**: Add prefix to Tailwind CSS import

```css
/* app/assets/css/main.css */
@import "tailwindcss" prefix(tw);
@import "@nuxt/ui";
```

### Vue Application

**Step 1**: Configure the prefix in `vite.config.ts`

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      theme: {
        prefix: 'tw'
      }
    })
  ]
})
```

**Step 2**: Add prefix to Tailwind CSS import

```css
/* assets/main.css */
@import "tailwindcss" prefix(tw);
@import "@nuxt/ui";
```

---

## How It Works

### Automatic Class Prefixing

When you configure a prefix, Nuxt UI automatically prefixes **all utility classes** in component themes:

**Without prefix**:
```html
<button class="px-2 py-1 text-xs hover:bg-primary/75">Button</button>
```

**With prefix: `tw`**:
```html
<button class="tw:px-2 tw:py-1 tw:text-xs tw:hover:bg-primary/75">Button</button>
```

### CSS Variables Remain Unprefixed

**Important**: CSS variables used by Nuxt UI components (like `--ui-primary`, `--ui-bg`, etc.) are **NOT** prefixed. Only utility classes are affected.

---

## Integration with @nuxt/fonts

If you're using the `@nuxt/fonts` module with a prefix, you'll need to enable `processCSSVariables`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      prefix: 'tw'
    }
  },
  fonts: {
    processCSSVariables: true  // Required for prefix support
  }
})
```

**Why this is needed**: The `@nuxt/fonts` module needs to be aware of the prefix to correctly apply font utilities to Nuxt UI components.

**Reference**: [Nuxt Fonts - processCSSVariables](https://fonts.nuxt.com/get-started/configuration#processcssvariables)

---

## Before & After Examples

### Example 1: Button with Custom Styling

**Without prefix**:
```vue
<template>
  <UButton
    class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
  >
    Gradient Button
  </UButton>
</template>
```

**With prefix: `tw`**:
```vue
<template>
  <UButton
    class="tw:rounded-full tw:bg-gradient-to-r tw:from-blue-500 tw:to-purple-500"
  >
    Gradient Button
  </UButton>
</template>
```

### Example 2: Card with Hover Effects

**Without prefix**:
```vue
<template>
  <UCard class="hover:shadow-lg transition-shadow duration-300">
    <h3 class="text-lg font-semibold">Card Title</h3>
    <p class="text-sm text-gray-600">Card description</p>
  </UCard>
</template>
```

**With prefix: `tw`**:
```vue
<template>
  <UCard class="tw:hover:shadow-lg tw:transition-shadow tw:duration-300">
    <h3 class="tw:text-lg tw:font-semibold">Card Title</h3>
    <p class="tw:text-sm tw:text-gray-600">Card description</p>
  </UCard>
</template>
```

### Example 3: Responsive Layout

**Without prefix**:
```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <UCard v-for="item in items" :key="item.id">
      {{ item.title }}
    </UCard>
  </div>
</template>
```

**With prefix: `tw`**:
```vue
<template>
  <div class="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 lg:tw:grid-cols-3 tw:gap-4">
    <UCard v-for="item in items" :key="item.id">
      {{ item.title }}
    </UCard>
  </div>
</template>
```

---

## Common Use Cases

### Use Case 1: Legacy Bootstrap Integration

When integrating Nuxt UI into an existing Bootstrap application:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'nu'  // "nuxt-ui" prefix to avoid Bootstrap conflicts
    }
  }
})
```

Now all Nuxt UI utilities use `nu:` prefix:
```html
<!-- Bootstrap classes (unprefixed) -->
<div class="container">
  <!-- Nuxt UI classes (prefixed) -->
  <UButton class="nu:mt-4 nu:px-4 nu:py-2">Submit</UButton>
</div>
```

### Use Case 2: Micro-Frontend Architecture

In a micro-frontend setup where multiple teams use different UI frameworks:

```ts
// Team A's Nuxt UI config
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'team-a'
    }
  }
})
```

### Use Case 3: Incremental Migration

When migrating from another framework (e.g., Element UI, Ant Design):

```ts
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'v2'  // New Nuxt UI components use v2: prefix
    }
  }
})
```

This allows gradual migration:
```vue
<template>
  <div>
    <!-- Old framework (unprefixed) -->
    <el-button type="primary">Old Button</el-button>

    <!-- New Nuxt UI (prefixed) -->
    <UButton class="v2:mt-4" color="primary">New Button</UButton>
  </div>
</template>
```

---

## Troubleshooting

### Components Not Styled

**Problem**: Nuxt UI components appear unstyled after adding prefix

**Solution**: Ensure both config and CSS import have matching prefix:

```ts
// ❌ INCORRECT: Config has prefix but CSS doesn't
// nuxt.config.ts
ui: { theme: { prefix: 'tw' } }

/* main.css - MISSING prefix! */
@import "tailwindcss";  // ❌ No prefix
@import "@nuxt/ui";
```

```ts
// ✅ CORRECT: Both config and CSS have prefix
// nuxt.config.ts
ui: { theme: { prefix: 'tw' } }

/* main.css - WITH prefix */
@import "tailwindcss" prefix(tw);  // ✅ Prefix matches
@import "@nuxt/ui";
```

### CSS Variables Not Working

**Problem**: Component themes using CSS variables aren't working

**Cause**: CSS variables are NOT prefixed, only utility classes

**Solution**: Don't prefix CSS variable references:

```vue
<template>
  <!-- ✅ CORRECT: Utilities prefixed, CSS vars unprefixed -->
  <div class="tw:bg-[var(--ui-primary)] tw:text-white">
    Content
  </div>

  <!-- ❌ INCORRECT: Trying to prefix CSS variables -->
  <div class="tw:bg-[var(--tw:ui-primary)]">
    Content
  </div>
</template>
```

### @nuxt/fonts Issues

**Problem**: Font utilities not working with prefix

**Solution**: Enable `processCSSVariables`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'tw'
    }
  },
  fonts: {
    processCSSVariables: true  // ← Add this
  }
})
```

---

## Performance Impact

**Build Time**: Negligible impact (<1% increase)
**Runtime**: No impact - prefix is resolved at build time
**Bundle Size**: Slightly larger CSS file due to longer class names (~2-5% increase)

**Recommendation**: Only use prefix when necessary (conflict avoidance). If building a new application with Nuxt UI only, skip the prefix.

---

## Reference

- **Official Docs**: [Nuxt UI - theme.prefix](https://ui.nuxt.com/docs/getting-started/installation#theme-prefix)
- **Tailwind Prefix**: [Using the prefix option](https://tailwindcss.com/docs/styling-with-utility-classes#using-the-prefix-option)
- **Nuxt Fonts**: [processCSSVariables](https://fonts.nuxt.com/get-started/configuration#processcssvariables)
