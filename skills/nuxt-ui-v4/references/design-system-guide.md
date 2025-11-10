# Design System Guide - Nuxt UI v4

Complete guide to the Nuxt UI v4 design system, covering semantic colors, Tailwind v4 integration, and design token customization.

---

## Overview

Nuxt UI v4's design system is built on three interconnected layers:

1. **Design Tokens** → Raw color values, spacing, typography
2. **CSS Variables** → Semantic mappings that adapt to light/dark modes
3. **Component Theming** → Component-specific styling using tokens and variables

This layered approach enables:
- **Runtime customization** without rebuilds
- **Automatic dark mode** adaptation
- **Semantic naming** for consistent design
- **Type-safe configuration** with full TypeScript support

---

## Semantic Color System

Nuxt UI v4 uses **7 semantic color aliases** that map to Tailwind color scales:

| Semantic Alias | Default Mapping | Purpose |
|---------------|----------------|---------|
| `primary` | `blue` | Primary actions, links, focus states |
| `secondary` | `gray` or `neutral` | Secondary actions, supporting UI |
| `success` | `green` | Success messages, positive states |
| `info` | `blue` or `sky` | Informational messages |
| `warning` | `yellow` or `amber` | Warning messages, cautionary states |
| `error` | `red` | Error messages, destructive actions |
| `neutral` | `gray` or `zinc` | Neutral backgrounds, borders, text |

---

## Runtime Color Configuration

### Nuxt Configuration (app.config.ts)

For **Nuxt applications**, configure colors in `app.config.ts`:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'purple',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'zinc'
    }
  }
})
```

**Available Tailwind Colors:**
- `slate`, `gray`, `zinc`, `neutral`, `stone`
- `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`
- `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

### Vue Configuration (vite.config.ts)

For **Vue-only applications** (no Nuxt), configure in `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'indigo',
          secondary: 'purple',
          success: 'green',
          error: 'red'
        }
      }
    })
  ]
})
```

---

## Extending the Color System

### Adding Custom Semantic Colors

You can add custom semantic colors beyond the default 7:

**Step 1: Extend theme colors in nuxt.config.ts**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',    // ← New custom color
        'brand',       // ← New custom color
        'info',
        'success',
        'warning',
        'error',
        'neutral'
      ]
    }
  }
})
```

**Step 2: Map custom colors in app.config.ts**
```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'purple',
      tertiary: 'indigo',    // ← Map to Tailwind color
      brand: 'violet',       // ← Map to Tailwind color
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'zinc'
    }
  }
})
```

**Step 3: Use in components**
```vue
<template>
  <!-- New semantic colors work everywhere -->
  <UButton color="tertiary">Tertiary Action</UButton>
  <UButton color="brand">Brand Action</UButton>

  <UAlert color="brand" title="Brand Message" />

  <UBadge color="tertiary">Tertiary Badge</UBadge>
</template>
```

---

## Tailwind CSS v4 Integration

Nuxt UI v4 uses **Tailwind CSS v4** with CSS-first configuration via the `@theme` directive.

### Basic Tailwind v4 Setup

**app.vue or global CSS:**
```vue
<style>
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  /* Custom design tokens here */
}
</style>
```

### Custom Font Configuration

```css
@theme {
  /* Sans-serif font stack */
  --font-sans: 'Public Sans', 'Inter', system-ui, -apple-system, sans-serif;

  /* Monospace font stack */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* Serif font (if needed) */
  --font-serif: 'Merriweather', 'Georgia', serif;
}
```

Fonts automatically apply to Nuxt UI components and can be controlled via `@nuxt/fonts` module.

### Custom Spacing Tokens

```css
@theme {
  /* Override default spacing */
  --spacing-18: 4.5rem;     /* Add custom 18 unit */
  --spacing-22: 5.5rem;     /* Add custom 22 unit */

  /* Custom named spacing */
  --spacing-sidebar: 16rem;
  --spacing-header: 4rem;
}
```

**Usage:**
```vue
<template>
  <div class="mt-18">  <!-- 4.5rem margin-top -->
  <div class="p-22">   <!-- 5.5rem padding -->
</template>
```

### Custom Breakpoints

```css
@theme {
  /* Add custom breakpoints */
  --breakpoint-3xl: 1920px;
  --breakpoint-4xl: 2560px;
}
```

**Usage:**
```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-4">
</template>
```

---

## Color Customization with CSS

### Override Tailwind Color Shades

Use `@theme static` to override specific color shades:

```css
@theme static {
  /* Override green shades for custom success color */
  --color-green-50: #EFFDF5;
  --color-green-100: #D9FBE8;
  --color-green-200: #B3F5D1;
  --color-green-300: #75EDAE;
  --color-green-400: #00DC82;  /* Nuxt green */
  --color-green-500: #00C16A;
  --color-green-600: #00A155;
  --color-green-700: #007F45;
  --color-green-800: #016538;
  --color-green-900: #0A5331;
  --color-green-950: #052E16;
}
```

**Note:** When customizing colors, you must provide **all 11 shades** (50-950) for proper light/dark mode adaptation.

### Add Brand Colors

```css
@theme static {
  /* Add custom brand color */
  --color-brand-50: #FEF2F2;
  --color-brand-100: #FEE2E2;
  --color-brand-200: #FECACA;
  --color-brand-300: #FCA5A5;
  --color-brand-400: #F87171;
  --color-brand-500: #EF4444;  /* Main brand color */
  --color-brand-600: #DC2626;
  --color-brand-700: #B91C1C;
  --color-brand-800: #991B1B;
  --color-brand-900: #7F1D1D;
  --color-brand-950: #450A0A;
}
```

Then map it to a semantic color:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand'  // Use custom brand color as primary
    }
  }
})
```

---

## Typography Tokens

### Font Size Scale

Tailwind v4 provides these font sizes as CSS variables:

```css
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-lg: 1.125rem;     /* 18px */
--font-size-xl: 1.25rem;      /* 20px */
--font-size-2xl: 1.5rem;      /* 24px */
--font-size-3xl: 1.875rem;    /* 30px */
--font-size-4xl: 2.25rem;     /* 36px */
--font-size-5xl: 3rem;        /* 48px */
--font-size-6xl: 3.75rem;     /* 60px */
--font-size-7xl: 4.5rem;      /* 72px */
--font-size-8xl: 6rem;        /* 96px */
--font-size-9xl: 8rem;        /* 128px */
```

### Custom Typography

```css
@theme {
  /* Override base font size */
  --font-size-base: 1.0625rem;  /* 17px instead of 16px */

  /* Add custom sizes */
  --font-size-xxs: 0.625rem;    /* 10px */
}
```

### Line Heights

```css
--line-height-none: 1;
--line-height-tight: 1.25;
--line-height-snug: 1.375;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
--line-height-loose: 2;
```

---

## Using Semantic Tokens in Templates

Semantic color tokens work across all Nuxt UI components:

### Text Colors

```vue
<template>
  <!-- Semantic text colors -->
  <p class="text-primary">Primary text</p>
  <p class="text-secondary">Secondary text</p>
  <p class="text-success">Success text</p>
  <p class="text-info">Info text</p>
  <p class="text-warning">Warning text</p>
  <p class="text-error">Error text</p>

  <!-- Neutral text levels -->
  <p class="text-highlighted">Highest emphasis</p>
  <p class="text-default">Default text</p>
  <p class="text-muted">Muted text</p>
  <p class="text-dimmed">Lowest emphasis</p>
</template>
```

### Background Colors

```vue
<template>
  <!-- Semantic backgrounds -->
  <div class="bg-primary text-white">Primary background</div>
  <div class="bg-success text-white">Success background</div>
  <div class="bg-error text-white">Error background</div>

  <!-- Surface backgrounds -->
  <div class="bg-default">Page background</div>
  <div class="bg-elevated">Card background</div>
  <div class="bg-accented">Highlighted background</div>
</template>
```

### Border Colors

```vue
<template>
  <!-- Semantic borders -->
  <div class="border border-primary">Primary border</div>
  <div class="border border-success">Success border</div>
  <div class="border border-error">Error border</div>

  <!-- Neutral borders -->
  <div class="border border-default">Default border</div>
  <div class="border border-muted">Muted border</div>
</template>
```

---

## Design Token Interconnections

Understanding how the three layers work together:

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: Design Tokens (Tailwind Color Scale)          │
│ --color-blue-500: #3B82F6                              │
│ --color-blue-400: #60A5FA                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: CSS Variables (Semantic Mapping)              │
│ Light: --ui-primary: var(--color-blue-500)             │
│ Dark:  --ui-primary: var(--color-blue-400)             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: Component Theming                             │
│ UButton uses: background-color: var(--ui-primary)      │
│ Adapts automatically to light/dark mode                │
└─────────────────────────────────────────────────────────┘
```

### Flow Example

**Configuration:**
```typescript
// app.config.ts
ui: {
  colors: {
    primary: 'indigo'  // Step 1: Choose Tailwind color
  }
}
```

**Generated CSS Variables:**
```css
/* Light mode */
--ui-primary: var(--color-indigo-500);  /* Step 2: Map to shade 500 */

/* Dark mode */
.dark {
  --ui-primary: var(--color-indigo-400);  /* Automatically shifts to 400 */
}
```

**Component Usage:**
```vue
<!-- Step 3: Components use the variable -->
<UButton>Primary Action</UButton>
<!-- Button background uses var(--ui-primary) -->
<!-- Automatically blue-500 (light) or blue-400 (dark) -->
```

---

## Auto-Adaptation for Light/Dark Modes

All design tokens automatically adapt between color modes:

### Color Shifts

**Semantic Colors:**
- Light mode: Uses `*-500` shade
- Dark mode: Uses `*-400` shade (lighter for contrast)

**Text Colors:**
- Light mode: `neutral-700` to `neutral-900`
- Dark mode: `neutral-200` to `white`

**Backgrounds:**
- Light mode: `white` to `neutral-100`
- Dark mode: `neutral-950` to `neutral-800`

**Borders:**
- Light mode: `neutral-200` to `neutral-300`
- Dark mode: `neutral-800` to `neutral-700`

### Example: Button Adaptation

```vue
<template>
  <UButton color="primary">Click Me</UButton>
</template>
```

**Light Mode:**
- Background: `blue-500` (vibrant)
- Text: `white`
- Border: `blue-500`

**Dark Mode:**
- Background: `blue-400` (lighter, more visible)
- Text: `neutral-900` (dark text on light background)
- Border: `blue-400`

No manual dark mode selectors needed!

---

## Complete Customization Example

Create a fully custom design system:

**app.config.ts:**
```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'violet',
      secondary: 'fuchsia',
      success: 'emerald',
      info: 'cyan',
      warning: 'amber',
      error: 'rose',
      neutral: 'slate'
    },
    theme: {
      defaultVariants: {
        Button: {
          size: 'lg',
          rounded: 'full'  // All buttons rounded-full by default
        },
        Input: {
          size: 'lg',
          variant: 'outline'
        }
      }
    }
  }
})
```

**app.vue:**
```vue
<style>
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  /* Custom fonts */
  --font-sans: 'Sora', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Custom radius */
  --ui-radius: 0.75rem;  /* More rounded */

  /* Custom container */
  --ui-container: 90rem;  /* Wider */

  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;
}

@theme static {
  /* Custom violet shades for primary */
  --color-violet-50: #FAF5FF;
  --color-violet-100: #F3E8FF;
  --color-violet-200: #E9D5FF;
  --color-violet-300: #D8B4FE;
  --color-violet-400: #C084FC;
  --color-violet-500: #A855F7;  /* Main violet */
  --color-violet-600: #9333EA;
  --color-violet-700: #7E22CE;
  --color-violet-800: #6B21A8;
  --color-violet-900: #581C87;
  --color-violet-950: #3B0764;
}
</style>
```

**Result:**
- Primary color: Violet
- All buttons: Large + fully rounded
- Custom fonts throughout
- Wider container (1440px)
- Custom breakpoint at 1920px

---

## Best Practices

### 1. Use Semantic Colors

```vue
<!-- ✅ GOOD: Semantic -->
<UButton color="primary">Save</UButton>
<UButton color="error">Delete</UButton>

<!-- ❌ AVOID: Direct colors -->
<UButton color="blue">Save</UButton>
<UButton color="red">Delete</UButton>
```

### 2. Configure at Runtime

```typescript
// ✅ GOOD: Runtime config
// app.config.ts
ui: {
  colors: {
    primary: 'indigo'
  }
}

// ❌ AVOID: Hardcoded in components
```

### 3. Use @theme for Global Changes

```css
/* ✅ GOOD: Global tokens */
@theme {
  --ui-radius: 0.5rem;
}

/* ❌ AVOID: Component-by-component overrides */
```

### 4. Provide All Color Shades

When adding custom colors with `@theme static`, **always provide all 11 shades** (50-950):

```css
/* ✅ GOOD: Complete scale */
@theme static {
  --color-brand-50: #...;
  --color-brand-100: #...;
  /* ... all the way to ... */
  --color-brand-950: #...;
}

/* ❌ INCOMPLETE: Missing shades breaks dark mode */
@theme static {
  --color-brand-500: #EF4444;  /* Only one shade */
}
```

### 5. Test Both Color Modes

Always test your design system in both light and dark modes:

```vue
<script setup lang="ts">
const { toggleColorMode } = useColorMode()
</script>

<template>
  <UButton @click="toggleColorMode">
    Toggle Mode (Test Design)
  </UButton>
</template>
```

---

## Troubleshooting

### Semantic Color Not Working

**Problem:** `color="tertiary"` doesn't work on components.

**Solution:** Add to theme colors array:
```typescript
// nuxt.config.ts
ui: {
  theme: {
    colors: ['primary', 'secondary', 'tertiary', ...]
  }
}
```

### Custom Font Not Applying

**Problem:** Font specified in `@theme` doesn't apply.

**Solution 1:** Ensure font is imported:
```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'Sora', system-ui, sans-serif;
}
```

**Solution 2:** Use `@nuxt/fonts` module:
```typescript
// nuxt.config.ts
modules: ['@nuxt/ui', '@nuxt/fonts']
```

### Dark Mode Colors Look Wrong

**Problem:** Colors don't look good in dark mode.

**Solution:** Dark mode automatically uses lighter shades (400 instead of 500). If still bad, choose a different base color that has better dark mode shades.

---

## Resources

- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors
- **Nuxt UI Theming**: https://ui.nuxt.com/getting-started/theme
- **@nuxt/fonts**: https://fonts.nuxt.com/

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
**Tailwind CSS Version**: 4.0.0
