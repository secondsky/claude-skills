# CSS Variables Reference - Nuxt UI v4

Complete reference for all CSS variables in Nuxt UI v4 and how to use them for custom styling.

---

## Overview

Nuxt UI v4 uses CSS variables for theming, enabling:
- **Runtime customization** without recompilation
- **Dark mode** automatic adaptation
- **Semantic naming** for consistent design
- **Direct CSS usage** in custom components

All variables automatically adjust for light/dark color modes.

---

## Semantic Color Variables

### Primary, Secondary, and Semantic Colors

These map to your configured theme colors and adjust between light/dark modes.

**Light Mode:**
```css
:root {
  --ui-primary: var(--ui-color-primary-500);
  --ui-secondary: var(--ui-color-secondary-500);
  --ui-success: var(--ui-color-success-500);
  --ui-info: var(--ui-color-info-500);
  --ui-warning: var(--ui-color-warning-500);
  --ui-error: var(--ui-color-error-500);
  --ui-neutral: var(--ui-color-neutral-500);
}
```

**Dark Mode:**
```css
.dark {
  --ui-primary: var(--ui-color-primary-400);
  --ui-secondary: var(--ui-color-secondary-400);
  --ui-success: var(--ui-color-success-400);
  --ui-info: var(--ui-color-info-400);
  --ui-warning: var(--ui-color-warning-400);
  --ui-error: var(--ui-color-error-400);
  --ui-neutral: var(--ui-color-neutral-400);
}
```

**Note:** Dark mode shifts from 500 → 400 for better contrast on dark backgrounds.

### Usage in Custom CSS

```css
/* Custom button using semantic colors */
.my-custom-button {
  background-color: var(--ui-primary);
  color: white;
  border: 1px solid var(--ui-primary);
}

.my-custom-button:hover {
  background-color: color-mix(in srgb, var(--ui-primary) 90%, black);
}

/* Success state */
.success-badge {
  background-color: var(--ui-success);
  color: white;
}

/* Error message */
.error-text {
  color: var(--ui-error);
}
```

---

## Text Color Variables

Used for typography with semantic naming based on emphasis level.

### Complete Text Variable List

**Light Mode:**
```css
:root {
  --ui-text-highlighted: var(--ui-color-neutral-900);
  --ui-text: var(--ui-color-neutral-700);
  --ui-text-toned: var(--ui-color-neutral-600);
  --ui-text-muted: var(--ui-color-neutral-500);
  --ui-text-dimmed: var(--ui-color-neutral-400);
  --ui-text-inverted: white;
}
```

**Dark Mode:**
```css
.dark {
  --ui-text-highlighted: white;
  --ui-text: var(--ui-color-neutral-200);
  --ui-text-toned: var(--ui-color-neutral-300);
  --ui-text-muted: var(--ui-color-neutral-400);
  --ui-text-dimmed: var(--ui-color-neutral-500);
  --ui-text-inverted: var(--ui-color-neutral-900);
}
```

### Utility Class Mapping

| CSS Variable | Utility Class | Use Case |
|--------------|---------------|----------|
| `--ui-text-highlighted` | `text-highlighted` | Primary headings, emphasized text |
| `--ui-text` | `text-default` | Body text, default paragraphs |
| `--ui-text-toned` | `text-toned` | Slightly subdued text |
| `--ui-text-muted` | `text-muted` | Secondary information |
| `--ui-text-dimmed` | `text-dimmed` | Tertiary info, placeholders |
| `--ui-text-inverted` | `text-inverted` | Text on dark backgrounds |

### Usage Examples

```vue
<template>
  <!-- Using utility classes -->
  <h1 class="text-highlighted">Main Heading</h1>
  <p class="text-default">Body paragraph text.</p>
  <span class="text-muted">Secondary info</span>
  <small class="text-dimmed">Helper text</small>

  <!-- Using CSS variables directly -->
  <div :style="{ color: 'var(--ui-text-muted)' }">
    Custom styled text
  </div>
</template>

<style scoped>
/* Custom component using variables */
.my-label {
  color: var(--ui-text);
  font-weight: 500;
}

.my-description {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.my-placeholder {
  color: var(--ui-text-dimmed);
}
</style>
```

---

## Background Color Variables

Used for surfaces, cards, and container backgrounds.

### Complete Background Variable List

**Light Mode:**
```css
:root {
  --ui-bg: white;
  --ui-bg-elevated: var(--ui-color-neutral-50);
  --ui-bg-muted: var(--ui-color-neutral-50);
  --ui-bg-accented: var(--ui-color-neutral-100);
  --ui-bg-inverted: var(--ui-color-neutral-900);
}
```

**Dark Mode:**
```css
.dark {
  --ui-bg: var(--ui-color-neutral-950);
  --ui-bg-elevated: var(--ui-color-neutral-900);
  --ui-bg-muted: var(--ui-color-neutral-900);
  --ui-bg-accented: var(--ui-color-neutral-800);
  --ui-bg-inverted: white;
}
```

### Utility Class Mapping

| CSS Variable | Utility Class | Use Case |
|--------------|---------------|----------|
| `--ui-bg` | `bg-default` | Page background |
| `--ui-bg-elevated` | `bg-elevated` | Cards, modals (higher elevation) |
| `--ui-bg-muted` | `bg-muted` | Subtle backgrounds |
| `--ui-bg-accented` | `bg-accented` | More prominent backgrounds |
| `--ui-bg-inverted` | `bg-inverted` | Inverse backgrounds |

### Additional Background Variables

```css
:root {
  --ui-bg-overlay: rgba(0, 0, 0, 0.5);     /* Modal/dialog overlays */
  --ui-bg-disabled: var(--ui-color-neutral-100);
}

.dark {
  --ui-bg-overlay: rgba(0, 0, 0, 0.75);
  --ui-bg-disabled: var(--ui-color-neutral-800);
}
```

### Usage Examples

```vue
<template>
  <!-- Using utility classes -->
  <div class="bg-default">Page container</div>
  <div class="bg-elevated">Card with elevation</div>
  <div class="bg-accented">Highlighted section</div>
</template>

<style scoped>
/* Custom card component */
.custom-card {
  background-color: var(--ui-bg-elevated);
  padding: 1.5rem;
  border-radius: var(--ui-radius);
}

/* Hover state */
.custom-card:hover {
  background-color: var(--ui-bg-accented);
}

/* Modal overlay */
.modal-backdrop {
  background-color: var(--ui-bg-overlay);
}
</style>
```

---

## Border Color Variables

Used for borders, dividers, and outlines.

### Complete Border Variable List

**Light Mode:**
```css
:root {
  --ui-border: var(--ui-color-neutral-200);
  --ui-border-muted: var(--ui-color-neutral-200);
  --ui-border-accented: var(--ui-color-neutral-300);
  --ui-border-inverted: var(--ui-color-neutral-900);
}
```

**Dark Mode:**
```css
.dark {
  --ui-border: var(--ui-color-neutral-800);
  --ui-border-muted: var(--ui-color-neutral-800);
  --ui-border-accented: var(--ui-color-neutral-700);
  --ui-border-inverted: white;
}
```

### Utility Class Mapping

| CSS Variable | Utility Class | Use Case |
|--------------|---------------|----------|
| `--ui-border` | `border-default` | Standard borders |
| `--ui-border-muted` | `border-muted` | Subtle dividers |
| `--ui-border-accented` | `border-accented` | Emphasized borders |
| `--ui-border-inverted` | `border-inverted` | Inverse borders |

### Usage Examples

```vue
<template>
  <!-- Using utility classes -->
  <div class="border border-default">Default border</div>
  <hr class="border-t border-muted" />
  <div class="border-2 border-accented">Emphasized</div>
</template>

<style scoped>
/* Custom divider */
.section-divider {
  border-top: 1px solid var(--ui-border-muted);
  margin: 2rem 0;
}

/* Input with border */
.custom-input {
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
}

.custom-input:focus {
  border-color: var(--ui-primary);
  outline: none;
}
</style>
```

---

## Border Radius System

Nuxt UI v4 uses a single radius variable that scales across all components.

### Radius Variable

```css
:root {
  --ui-radius: 0.375rem;  /* 6px - default */
}
```

### Radius Multipliers

All `rounded-*` utilities scale from `--ui-radius`:

```css
.rounded-sm  { border-radius: calc(var(--ui-radius) * 0.5); }   /* 3px */
.rounded     { border-radius: var(--ui-radius); }                /* 6px */
.rounded-md  { border-radius: calc(var(--ui-radius) * 1.33); }  /* 8px */
.rounded-lg  { border-radius: calc(var(--ui-radius) * 2); }     /* 12px */
.rounded-xl  { border-radius: calc(var(--ui-radius) * 3); }     /* 18px */
.rounded-2xl { border-radius: calc(var(--ui-radius) * 4); }     /* 24px */
.rounded-3xl { border-radius: calc(var(--ui-radius) * 6); }     /* 36px */
.rounded-full{ border-radius: 9999px; }
```

### Customizing Global Radius

**Method 1: CSS (Tailwind v4)**
```css
/* app.vue <style> */
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --ui-radius: 0.5rem;  /* 8px - more rounded */
}
```

**Method 2: app.config.ts (if supported)**
```typescript
export default defineAppConfig({
  ui: {
    theme: {
      radius: '0.5rem'
    }
  }
})
```

### Usage Examples

```vue
<template>
  <!-- Using utility classes -->
  <div class="rounded">Standard radius</div>
  <div class="rounded-lg">Large radius</div>
  <div class="rounded-full">Circular</div>
</template>

<style scoped>
/* Custom component using radius variable */
.custom-card {
  border-radius: var(--ui-radius);
}

/* Slightly more rounded */
.custom-button {
  border-radius: calc(var(--ui-radius) * 1.5);
}
</style>
```

---

## Layout Variables

Used for consistent spacing and sizing across the application.

### Container Width

```css
:root {
  --ui-container: 80rem;  /* 1280px - default max width */
}
```

**Usage:**
```css
.container {
  max-width: var(--ui-container);
  margin-inline: auto;
}
```

### Header Height

```css
:root {
  --ui-header-height: 4rem;  /* 64px - default header height */
}
```

**Usage:**
```css
.main-content {
  /* Account for fixed header */
  padding-top: var(--ui-header-height);
}

.sticky-header {
  height: var(--ui-header-height);
  position: sticky;
  top: 0;
}
```

### Spacing Variables

Tailwind CSS v4 spacing uses CSS variables:

```css
:root {
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  /* ... and more */
}
```

---

## Ring (Focus) Variables

Used for focus rings and outlines.

```css
:root {
  --ui-ring: var(--ui-primary);
  --ui-ring-offset: white;
}

.dark {
  --ui-ring: var(--ui-primary);
  --ui-ring-offset: var(--ui-color-neutral-950);
}
```

**Usage:**
```css
.custom-input:focus {
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}

/* Or with Tailwind utilities */
.focus\:ring {
  box-shadow: 0 0 0 3px var(--ui-ring);
}
```

---

## Shadow Variables

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

---

## Complete Variable Usage Example

```vue
<template>
  <div class="custom-component">
    <div class="custom-header">
      <h2>Component Title</h2>
    </div>

    <div class="custom-body">
      <p>Component content</p>
    </div>

    <div class="custom-footer">
      <button class="custom-button">Action</button>
    </div>
  </div>
</template>

<style scoped>
.custom-component {
  /* Layout */
  max-width: var(--ui-container);
  margin: 0 auto;

  /* Background */
  background-color: var(--ui-bg-elevated);

  /* Border */
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);

  /* Shadow */
  box-shadow: var(--shadow-md);
}

.custom-header {
  /* Background (slightly different) */
  background-color: var(--ui-bg-accented);

  /* Border bottom */
  border-bottom: 1px solid var(--ui-border-muted);

  /* Spacing */
  padding: var(--spacing-4) var(--spacing-6);
}

.custom-header h2 {
  /* Text */
  color: var(--ui-text-highlighted);
  margin: 0;
}

.custom-body {
  padding: var(--spacing-6);
  color: var(--ui-text);
}

.custom-footer {
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--ui-border-muted);
  background-color: var(--ui-bg-muted);
}

.custom-button {
  /* Colors */
  background-color: var(--ui-primary);
  color: white;

  /* Border and radius */
  border: none;
  border-radius: var(--ui-radius);

  /* Spacing */
  padding: var(--spacing-2) var(--spacing-4);

  /* Cursor */
  cursor: pointer;
}

.custom-button:hover {
  /* Darken primary color on hover */
  background-color: color-mix(in srgb, var(--ui-primary) 90%, black);
}

.custom-button:focus {
  /* Focus ring */
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}
</style>
```

---

## Dark Mode Behavior

All CSS variables automatically update when dark mode is enabled.

**Automatic Updates:**
```vue
<template>
  <!-- Same code works in both modes -->
  <div class="bg-elevated border border-default">
    <p class="text-default">This text adapts automatically</p>
  </div>
</template>
```

**Light Mode Result:**
- `bg-elevated` → `white` or `neutral-50`
- `border-default` → `neutral-200`
- `text-default` → `neutral-700`

**Dark Mode Result:**
- `bg-elevated` → `neutral-900`
- `border-default` → `neutral-800`
- `text-default` → `neutral-200`

---

## Customizing CSS Variables

### Global Customization (Tailwind v4)

```css
/* app.vue <style> or global CSS */
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  /* Override radius */
  --ui-radius: 0.5rem;

  /* Override container width */
  --ui-container: 90rem;

  /* Add custom variables */
  --my-custom-spacing: 2.5rem;
}
```

### Runtime Customization (JavaScript)

```vue
<script setup lang="ts">
onMounted(() => {
  // Change global radius at runtime
  document.documentElement.style.setProperty('--ui-radius', '0.75rem')

  // Change container width
  document.documentElement.style.setProperty('--ui-container', '100rem')
})
</script>
```

---

## Best Practices

### 1. Use Semantic Variables

```css
/* ✅ GOOD: Semantic meaning */
.error-message {
  color: var(--ui-error);
}

/* ❌ AVOID: Direct color values */
.error-message {
  color: var(--ui-color-red-500);
}
```

### 2. Prefer Utility Classes

```vue
<!-- ✅ GOOD: Utility classes -->
<div class="bg-elevated border border-default">

<!-- ⚠️ OK but verbose: Inline styles -->
<div :style="{
  backgroundColor: 'var(--ui-bg-elevated)',
  border: '1px solid var(--ui-border)'
}">
```

### 3. Use Variables for Custom Components

```css
/* ✅ GOOD: Variables for consistency */
.custom-card {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
}

/* ❌ AVOID: Hardcoded values */
.custom-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
```

### 4. Dark Mode is Automatic

Don't write manual dark mode selectors when using CSS variables:

```css
/* ✅ GOOD: Automatic dark mode */
.my-component {
  background: var(--ui-bg-elevated);
  color: var(--ui-text);
}

/* ❌ AVOID: Manual dark mode (unnecessary) */
.my-component {
  background: white;
  color: #374151;
}

.dark .my-component {
  background: #1f2937;
  color: #e5e7eb;
}
```

---

## Resources

- **Tailwind CSS v4 Docs**: https://tailwindcss.com/docs/v4-beta
- **Nuxt UI Theming**: https://ui.nuxt.com/getting-started/theme
- **CSS Variables MDN**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
**Tailwind CSS Version**: 4.0.0
