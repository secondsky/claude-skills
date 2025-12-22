# Component Theming Guide

## Customization Hierarchy (Order of Specificity)

1. **Global Config** (`app.config.ts`)
2. **Component `ui` Prop** (per-instance)
3. **Slot `class` Prop** (per-element)

## Global Theming

```typescript
export default defineAppConfig({
  ui: {
    theme: {
      defaultVariants: {
        Button: { size: 'md', color: 'primary' },
        Input: { size: 'md', variant: 'outline' }
      }
    }
  }
})
```

## Component-Level

```vue
<UButton :ui="{ base: 'font-bold', rounded: 'rounded-full' }">
  Custom Button
</UButton>
```

## Slot-Level

```vue
<UCard :ui="{ header: 'bg-primary text-white' }">
  <template #header>Header</template>
</UCard>
```

---

## Understanding Slots

### What Are Slots?

Slots are **distinct HTML elements or sections** within a component. Each slot can be styled independently.

**Example: UCard Component Structure**
```vue
<UCard>
  <!-- root slot: The outer container -->
  <div class="root-slot">
    <!-- header slot: Optional header section -->
    <div class="header-slot">
      <slot name="header" />
    </div>

    <!-- body slot: Main content area -->
    <div class="body-slot">
      <slot />  <!-- Default slot -->
    </div>

    <!-- footer slot: Optional footer section -->
    <div class="footer-slot">
      <slot name="footer" />
    </div>
  </div>
</UCard>
```

### Typical Slot Names

Most components follow these patterns:

**Container Components (Card, Modal, Drawer):**
- `root` - Outer container
- `header` - Top section
- `body` - Main content
- `footer` - Bottom section

**Form Components (Input, Select):**
- `root` - Wrapper element
- `base` - Input element itself
- `leading` - Icon/content before input
- `trailing` - Icon/content after input
- `label` - Label element
- `hint` - Helper text
- `error` - Error message

**Button Component:**
- `root` or `base` - Button element
- `leading` - Leading icon slot
- `label` - Text label slot
- `trailing` - Trailing icon slot

### Styling Individual Slots

```vue
<template>
  <UCard
    :ui="{
      root: 'shadow-lg border-2 border-primary',
      header: 'bg-primary text-white p-6',
      body: 'p-6 bg-elevated',
      footer: 'bg-muted p-4 border-t border-default'
    }"
  >
    <template #header>
      <h2>Card Title</h2>
    </template>

    <p>Card content goes here</p>

    <template #footer>
      <UButton>Action</UButton>
    </template>
  </UCard>
</template>
```

**Result:** Each section has its own independent styling.

---

## Variants System

### What Are Variants?

Variants map **component props** to **style definitions**. They enable dynamic styling based on prop values.

**Example: Avatar Size Variants**
```typescript
variants: {
  size: {
    xs: { root: 'size-6 text-xs' },
    sm: { root: 'size-7 text-sm' },
    md: { root: 'size-8 text-base' },  // default
    lg: { root: 'size-9 text-lg' },
    xl: { root: 'size-10 text-xl' }
  }
}
```

**Usage:**
```vue
<template>
  <UAvatar size="sm" />  <!-- Uses 'sm' variant: size-7 text-sm -->
  <UAvatar size="lg" />  <!-- Uses 'lg' variant: size-9 text-lg -->
  <UAvatar />            <!-- Uses default 'md': size-8 text-base -->
</template>
```

### How Variants Work

1. **Component receives prop** (e.g., `size="lg"`)
2. **Variant system looks up** the size variant
3. **Applies corresponding classes** to relevant slots

### Multiple Variants Example

Components often have multiple variant props:

```typescript
// Button variants
variants: {
  size: {
    xs: { root: 'px-2 py-1 text-xs' },
    sm: { root: 'px-3 py-1.5 text-sm' },
    md: { root: 'px-4 py-2 text-base' },
    lg: { root: 'px-5 py-2.5 text-lg' }
  },
  variant: {
    solid: { root: 'bg-primary text-white' },
    outline: { root: 'border border-primary text-primary bg-transparent' },
    ghost: { root: 'bg-transparent text-primary hover:bg-primary/10' },
    link: { root: 'bg-transparent text-primary underline' }
  },
  color: {
    primary: { root: 'theme-primary' },
    success: { root: 'theme-success' },
    error: { root: 'theme-error' }
  }
}
```

**Usage:**
```vue
<template>
  <!-- Combines size + variant + color variants -->
  <UButton
    size="lg"
    variant="outline"
    color="success"
  >
    Large Outline Success Button
  </UButton>
</template>
```

### Default Variants

Set defaults globally for all component instances:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    theme: {
      defaultVariants: {
        Button: {
          size: 'md',       // All buttons default to medium
          variant: 'solid',  // All buttons default to solid
          color: 'primary'   // All buttons default to primary color
        },
        Input: {
          size: 'md',
          variant: 'outline'
        }
      }
    }
  }
})
```

Now every `<UButton>` uses these defaults unless overridden:

```vue
<UButton>              <!-- md + solid + primary -->
<UButton size="lg">    <!-- lg + solid + primary -->
<UButton variant="ghost"> <!-- md + ghost + primary -->
```

---

## Compound Variants

### What Are Compound Variants?

Compound variants apply styles when **multiple conditions** are met simultaneously.

**Example: Button with Primary Color + Large Size**
```typescript
compoundVariants: [
  {
    color: 'primary',
    size: 'lg',
    class: 'shadow-lg font-semibold'
  },
  {
    variant: 'outline',
    color: 'error',
    class: 'border-2 hover:bg-error/10'
  }
]
```

**Result:**
```vue
<!-- Applies compound variant: shadow-lg font-semibold -->
<UButton color="primary" size="lg">
  Large Primary Button
</UButton>

<!-- Applies compound variant: border-2 hover:bg-error/10 -->
<UButton variant="outline" color="error">
  Outline Error Button
</UButton>

<!-- No compound variant applied -->
<UButton color="primary" size="md">
  Medium Primary Button
</UButton>
```

### Use Cases for Compound Variants

**1. Enhanced Emphasis**
```typescript
compoundVariants: [
  {
    color: 'error',
    variant: 'solid',
    class: 'shadow-error-md animate-pulse'  // Extra attention for destructive actions
  }
]
```

**2. Responsive Adjustments**
```typescript
compoundVariants: [
  {
    size: 'lg',
    variant: 'solid',
    class: 'md:px-8 md:py-4'  // Larger padding on desktop for large solid buttons
  }
]
```

**3. Accessibility Enhancements**
```typescript
compoundVariants: [
  {
    variant: 'ghost',
    color: 'neutral',
    class: 'focus:ring-2 focus:ring-offset-2'  // Extra focus visibility for subtle buttons
  }
]
```

---

## `class` vs `ui` Prop

### Critical Distinction

**`class` Prop:**
- Targets **root/base slot ONLY**
- Simple string of classes
- Cannot target other slots

**`ui` Prop:**
- Targets **ANY slot**
- Object with slot names as keys
- Full component customization

### Examples

```vue
<template>
  <!-- ✅ class prop: Styles root element only -->
  <UButton class="w-full">
    Full Width Button
  </UButton>
  <!-- Result: <button class="w-full ...">...</button> -->

  <!-- ✅ ui prop: Styles multiple slots -->
  <UButton
    :ui="{
      root: 'w-full',
      leading: 'size-5',
      label: 'font-bold'
    }"
  >
    <template #leading>
      <UIcon name="i-lucide-star" />
    </template>
    Customized Button
  </UButton>

  <!-- ❌ WRONG: class prop cannot target leading slot -->
  <UButton class="leading:size-5">
    <!-- This won't work -->
  </UButton>
</template>
```

### When to Use Each

**Use `class` when:**
- Styling root element only
- Simple utility class additions
- Quick one-off styling

**Use `ui` when:**
- Customizing multiple slots
- Targeting specific internal elements
- Complex component styling
- Building reusable variants

### Combining Both

You can use both together:

```vue
<template>
  <UButton
    class="w-full md:w-auto"
    :ui="{
      root: 'shadow-lg',
      label: 'font-semibold'
    }"
  >
    Hybrid Styling
  </UButton>
</template>
```

**Result:** `class` and `ui.root` both apply to root element, `ui.label` applies to label slot.

---

## Vue-Only Configuration

### For Vue (Not Nuxt) Projects

If using **Vue without Nuxt**, configure in `vite.config.ts`:

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: {
        // Theme configuration
        colors: {
          primary: 'indigo',
          secondary: 'purple',
          success: 'green',
          error: 'red'
        },

        // Default variants
        theme: {
          defaultVariants: {
            Button: {
              size: 'md',
              variant: 'solid'
            }
          }
        },

        // Global component styling
        button: {
          slots: {
            root: 'font-semibold transition-all',
            leading: 'size-5'
          },
          variants: {
            size: {
              xs: { root: 'px-2 py-1 text-xs' },
              sm: { root: 'px-3 py-1.5 text-sm' },
              md: { root: 'px-4 py-2 text-base' },
              lg: { root: 'px-6 py-3 text-lg' }
            }
          }
        }
      }
    })
  ]
})
```

### Nuxt vs Vue Configuration

| Feature | Nuxt | Vue (vite.config.ts) |
|---------|------|----------------------|
| Runtime Colors | `app.config.ts` | `vite.config.ts` |
| Default Variants | `app.config.ts` | `vite.config.ts` |
| Global Slots | `app.config.ts` | `vite.config.ts` |
| Hot Reload | Yes | Requires restart |

---

## Advanced Patterns

### Conditional Slot Styling

```vue
<script setup lang="ts">
const hasError = ref(false)

const cardUi = computed(() => ({
  root: hasError.value ? 'border-2 border-error' : 'border border-default',
  header: hasError.value ? 'bg-error/10 text-error' : 'bg-default'
}))
</script>

<template>
  <UCard :ui="cardUi">
    <template #header>
      {{ hasError ? 'Error State' : 'Normal State' }}
    </template>
    <p>Content</p>
  </UCard>
</template>
```

### Extending Component Variants

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    button: {
      variants: {
        // Add custom size
        size: {
          '2xl': { root: 'px-8 py-4 text-2xl' }
        },
        // Add custom variant
        variant: {
          gradient: {
            root: 'bg-gradient-to-r from-primary to-secondary text-white'
          }
        }
      }
    }
  }
})
```

**Usage:**
```vue
<UButton size="2xl" variant="gradient">
  Custom Gradient Button
</UButton>
```

### Responsive Variants with Tailwind

```vue
<template>
  <UButton
    :ui="{
      root: 'w-full md:w-auto',
      label: 'text-sm md:text-base'
    }"
  >
    Responsive Button
  </UButton>
</template>
```

---

## Best Practices

### 1. Prefer Global Defaults

```typescript
// ✅ GOOD: Set once globally
// app.config.ts
defaultVariants: {
  Button: { size: 'md', variant: 'solid' }
}

// ❌ AVOID: Repeating on every instance
<UButton size="md" variant="solid">...</UButton>
<UButton size="md" variant="solid">...</UButton>
<UButton size="md" variant="solid">...</UButton>
```

### 2. Use `ui` Prop for Complex Styling

```vue
<!-- ✅ GOOD: Use ui prop for multi-slot styling -->
<UCard
  :ui="{
    root: 'shadow-xl',
    header: 'bg-primary text-white',
    body: 'prose'
  }"
/>

<!-- ❌ AVOID: class prop can't target slots -->
<UCard class="shadow-xl header:bg-primary body:prose" />
```

### 3. Create Composables for Reusable Styles

```typescript
// composables/useCardStyles.ts
export const useCardStyles = (variant: 'default' | 'error' | 'success') => {
  const styles = {
    default: {
      root: 'border border-default',
      header: 'bg-elevated'
    },
    error: {
      root: 'border-2 border-error',
      header: 'bg-error/10 text-error'
    },
    success: {
      root: 'border-2 border-success',
      header: 'bg-success/10 text-success'
    }
  }

  return styles[variant]
}
```

**Usage:**
```vue
<script setup lang="ts">
const cardStyles = useCardStyles('error')
</script>

<template>
  <UCard :ui="cardStyles">
    <template #header>Error Card</template>
    <p>Content</p>
  </UCard>
</template>
```

### 4. Document Custom Variants

When adding custom variants, document them:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    button: {
      variants: {
        /**
         * Custom button sizes
         * - xs: Extra small (mobile)
         * - 2xl: Extra large (hero CTAs)
         */
        size: {
          xs: { root: 'px-1.5 py-0.5 text-xs' },
          '2xl': { root: 'px-8 py-4 text-2xl' }
        }
      }
    }
  }
})
```

---

## Troubleshooting

### Styles Not Applying

**Problem:** `ui` prop styles don't appear.

**Solution:** Check slot names match component structure. Use browser DevTools to inspect actual slot names.

### Conflicting Styles

**Problem:** Global and component styles conflict.

**Solution:** Remember the hierarchy:
1. Global config (lowest priority)
2. Component `ui` prop
3. Slot `class` prop (highest priority)

### Variant Not Working

**Problem:** Custom variant doesn't apply.

**Solution:** Ensure variant is registered in global config and prop name matches:

```typescript
// app.config.ts
ui: {
  button: {
    variants: {
      customSize: {  // ← Must match prop name
        huge: { root: 'px-10 py-6' }
      }
    }
  }
}
```

```vue
<UButton customSize="huge">  <!-- ← Must match config -->
```

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
