# Inspira UI Complete Setup Guide

This guide contains the complete setup instructions for integrating Inspira UI into your Vue 3 or Nuxt 4 project.

## Prerequisites

Before starting, ensure you have:
- **Vue 3** or **Nuxt 4** project
- **TailwindCSS v4** (required - for v3, use [Inspira UI v1](https://v1.inspira-ui.com))
- **Node.js 18+**
- **Bun** (recommended) or npm/pnpm

## Step 1: Install TailwindCSS v4

Follow the official [TailwindCSS installation guide](https://tailwindcss.com/docs/installation).

## Step 2: Install Core Dependencies

Install utility libraries and TailwindCSS animation utilities:

```bash
bun add -d clsx tailwind-merge class-variance-authority tw-animate-css
```

Install VueUse and Motion-V for animations:

```bash
bun add @vueuse/core motion-v
```

Follow the [Motion-V Vue/Nuxt setup guide](https://motion.dev/docs/vue) to configure motion-v in your project.

## Step 3: Configure CSS Variables

Add the following to your `main.css` or global CSS file:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.141 0.005 285.823);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.141 0.005 285.823);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.21 0.006 285.885);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.274 0.006 286.033);
  --input: oklch(0.274 0.006 286.033);
  --ring: oklch(0.442 0.017 285.786);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

html {
  color-scheme: light dark;
}
html.dark {
  color-scheme: dark;
}
html.light {
  color-scheme: light;
}
```

**CRITICAL BUG FIX**: The CSS variables above have been corrected from the original Inspira UI documentation. The original docs have an accessibility bug where `--destructive-foreground` in light mode is set to the same value as `--destructive` (both `oklch(0.577 0.245 27.325)`), making destructive text invisible. This version uses `oklch(0.985 0 0)` for proper contrast.

## Step 4: Setup CN Utility

Create `lib/utils.ts` (or appropriate location in your project):

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ObjectValues<T> = T[keyof T];
```

## Step 5: Optional Icon Support

Many components use icons. Install Iconify Vue for optimal experience:

Follow the [Iconify Vue guide](https://iconify.design/docs/icon-components/vue/) for installation.

## Step 6: Optional Dependencies

Install based on the components you need:

### For 3D Components (Globe, Cosmic Portal, 3D Carousel, etc.)
```bash
bun add three @types/three
```

### For OGL/WebGL Components (Fluid Cursor, Liquid Background, Neural Background, etc.)
```bash
bun add ogl
```

### For GSAP Animations (certain advanced animations)
```bash
bun add gsap
```

### For Confetti Effect
```bash
bun add canvas-confetti
```

## Verification Checklist

After setup, verify:
- [ ] TailwindCSS v4 is installed and configured
- [ ] `@import "tailwindcss"` is in your CSS
- [ ] `@import "tw-animate-css"` is in your CSS
- [ ] CSS variables are defined in `:root` and `.dark`
- [ ] `@theme inline` block is present
- [ ] `cn()` utility is created and accessible
- [ ] Motion-V is configured per their docs
- [ ] Optional dependencies installed for your components

## Quick Verification Command

After setup, run the verification script:

```bash
./scripts/verify-setup.sh
```

This will check that all required dependencies are installed and configured correctly.

## Nuxt-Specific Setup

For Nuxt 4 projects, additional configuration:

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  // Enable TypeScript
  typescript: {
    strict: true,
  },

  // Configure motion-v if using as module
  modules: [
    // Add any Nuxt modules needed
  ],

  // Tailwind v4 is auto-configured in Nuxt 4
});
```

### ClientOnly Wrapper

For browser-only components (WebGL, Canvas, etc.):

```vue
<template>
  <ClientOnly>
    <FluidCursor />
  </ClientOnly>
</template>
```

## Project Structure

Recommended file organization after setup:

```
your-project/
├── assets/
│   └── main.css                 # CSS variables and imports
├── components/
│   └── ui/                      # Inspira UI components
│       ├── AuroraBackground.vue
│       ├── ShimmerButton.vue
│       └── ...
├── lib/
│   └── utils.ts                 # cn() utility
└── package.json                 # Dependencies
```

## Using Components

Inspira UI is a **copy-paste library**:

1. **Browse**: Visit [inspira-ui.com/components](https://inspira-ui.com/components)
2. **Select**: Choose the component you need
3. **Copy**: Copy the component code
4. **Paste**: Add to your `components/ui/` directory
5. **Import**: Import and use in your pages/components
6. **Customize**: Modify to fit your design

## Next Steps

- Browse components: https://inspira-ui.com/components
- Check component dependencies: [components-list.md](components-list.md)
- Learn code patterns: [CODE_PATTERNS.md](CODE_PATTERNS.md)
- Troubleshoot issues: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Last Updated**: 2025-11-12
