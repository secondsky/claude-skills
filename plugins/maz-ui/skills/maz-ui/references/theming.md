# Maz-UI Theming System

Complete guide to customizing themes and implementing dark mode in Maz-UI.

## Built-in Theme Presets

Maz-UI includes 4 professionally designed theme presets:

1. **maz-ui** (default) - Modern, balanced design
2. **ocean** - Blue ocean-inspired palette
3. **pristine** - Clean, minimalist design
4. **obsidian** - Dark, professional theme

## Using Presets

### Vue

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { ocean } from '@maz-ui/themes/presets'

app.use(MazUi, {
  theme: {
    preset: ocean // or 'ocean', 'pristine', 'obsidian'
  }
})
```

### Nuxt

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'ocean' // or 'pristine', 'obsidian', 'maz-ui'
    }
  }
})
```

## Custom Theme Creation

### Define Custom Theme

```typescript
import { definePreset } from '@maz-ui/themes'

export const myTheme = definePreset({
  base: 'maz-ui', // Extend existing preset
  name: 'my-custom-theme',
  foundation: {
    'base-font-size': '14px',
    'font-family': 'Inter, sans-serif',
    'radius': '0.5rem',
    'border-width': '1px',
  },
  colors: {
    light: {
      primary: '220 100% 50%', // HSL format
      secondary: '220 14% 96%',
      background: '0 0% 100%',
      foreground: '222 84% 5%',
      muted: '210 40% 96%',
      accent: '210 40% 90%',
      destructive: '0 84% 60%',
      border: '214 32% 91%',
      input: '214 32% 91%',
      ring: '220 100% 50%',
    },
    dark: {
      primary: '220 100% 70%',
      secondary: '220 14% 4%',
      background: '222 84% 5%',
      foreground: '210 40% 98%',
      muted: '217 33% 17%',
      accent: '217 33% 17%',
      destructive: '0 62% 30%',
      border: '217 33% 17%',
      input: '217 33% 17%',
      ring: '220 100% 70%',
    }
  },
})
```

### Use Custom Theme

```typescript
// Vue
app.use(MazUi, {
  theme: {
    preset: myTheme
  }
})

// Nuxt
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: myTheme
    }
  }
})
```

## Theme Overrides

Override specific parts without creating full theme:

### Vue

```typescript
import { mazUi } from '@maz-ui/themes'

app.use(MazUi, {
  theme: {
    preset: mazUi,
    overrides: {
      foundation: {
        'radius': '1rem',
        'font-family': 'Poppins, sans-serif'
      },
      colors: {
        light: {
          primary: '350 100% 50%', // Pink primary color
        },
        dark: {
          primary: '350 100% 70%',
        }
      }
    }
  }
})
```

### Nuxt

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      overrides: {
        foundation: {
          'radius': '1rem'
        },
        colors: {
          light: {
            primary: '350 100% 50%'
          }
        }
      }
    }
  }
})
```

## Dark Mode

### Automatic Dark Mode Detection

```typescript
// Vue
app.use(MazUi, {
  theme: {
    preset: mazUi,
    darkModeStrategy: 'auto' // 'class' | 'media' | 'auto'
  }
})

// Nuxt
export default defineNuxtConfig({
  mazUi: {
    theme: {
      preset: 'maz-ui',
      darkModeStrategy: 'auto'
    }
  }
})
```

**Dark Mode Strategies**:
- **class**: Dark mode controlled by `.dark` class on `<html>`
- **media**: Uses OS/browser preference (`prefers-color-scheme`)
- **auto**: Tries `class` first, falls back to `media`

### Toggle Dark Mode Programmatically

```vue
<script setup>
import { useTheme } from 'maz-ui/composables'

const { toggleDarkMode, isDark, setColorMode } = useTheme()
</script>

<template>
  <MazBtn @click="toggleDarkMode">
    {{ isDark ? '🌙 Dark' : '☀️ Light' }}
  </MazBtn>

  <!-- Or set explicitly -->
  <MazBtn @click="setColorMode('dark')">Dark</MazBtn>
  <MazBtn @click="setColorMode('light')">Light</MazBtn>
  <MazBtn @click="setColorMode('auto')">Auto</MazBtn>
</template>
```

## CSS Variables

All theme values are exposed as CSS custom properties:

```css
/* Foundation */
--maz-base-font-size
--maz-font-family
--maz-radius
--maz-border-width

/* Colors (in HSL format) */
--maz-primary
--maz-secondary
--maz-background
--maz-foreground
--maz-muted
--maz-accent
--maz-destructive
--maz-border
--maz-input
--maz-ring
```

### Using CSS Variables

```vue
<template>
  <div class="custom-card">
    Content
  </div>
</template>

<style scoped>
.custom-card {
  background-color: hsl(var(--maz-background));
  border: var(--maz-border-width) solid hsl(var(--maz-border));
  border-radius: var(--maz-radius);
  padding: 1rem;
}
</style>
```

## Utility Classes

Maz-UI provides Tailwind-style utility classes:

### Background Colors
```html
<div class="maz-bg-primary">Primary background</div>
<div class="maz-bg-secondary">Secondary background</div>
<div class="maz-bg-background">Background color</div>
```

### Text Colors
```html
<p class="maz-text-primary">Primary text</p>
<p class="maz-text-foreground">Foreground text</p>
<p class="maz-text-muted">Muted text</p>
```

### Spacing
```html
<div class="maz-p-4">Padding 1rem</div>
<div class="maz-m-2">Margin 0.5rem</div>
<div class="maz-gap-4">Gap 1rem</div>
```

### Layout
```html
<div class="maz-flex maz-flex-col maz-items-center">
  Centered flex column
</div>
```

## Rendering Strategies (Nuxt Only)

### Hybrid (Recommended)

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'hybrid' // ✅ Best performance
    }
  }
})
```

**Benefits**:
- Zero FOUC (Flash of Unstyled Content)
- Critical CSS injected immediately (SSR)
- Full CSS loaded asynchronously
- Optimal performance

### Runtime

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'runtime'
    }
  }
})
```

**When to use**: Dynamic themes that change frequently

### Buildtime

```typescript
export default defineNuxtConfig({
  mazUi: {
    theme: {
      strategy: 'buildtime'
    }
  }
})
```

**When to use**: Static sites without theme switching

## Theme Structure Reference

```typescript
interface ThemePreset {
  name: string
  base?: 'maz-ui' | 'ocean' | 'pristine' | 'obsidian'
  foundation: {
    'base-font-size': string
    'font-family': string
    'radius': string
    'border-width': string
  }
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
}

interface ThemeColors {
  primary: string // HSL: '220 100% 50%'
  secondary: string
  background: string
  foreground: string
  muted: string
  accent: string
  destructive: string
  border: string
  input: string
  ring: string
}
```

## Examples

### Corporate Theme

```typescript
export const corporateTheme = definePreset({
  base: 'maz-ui',
  name: 'corporate',
  foundation: {
    'font-family': 'Georgia, serif',
    'radius': '0.25rem',
  },
  colors: {
    light: {
      primary: '210 100% 40%', // Navy blue
      secondary: '210 30% 96%',
      background: '0 0% 100%',
      foreground: '210 50% 10%',
    },
    dark: {
      primary: '210 100% 60%',
      secondary: '210 30% 10%',
      background: '210 50% 5%',
      foreground: '210 20% 98%',
    }
  }
})
```

### Pastel Theme

```typescript
export const pastelTheme = definePreset({
  base: 'maz-ui',
  name: 'pastel',
  colors: {
    light: {
      primary: '330 80% 75%', // Pastel pink
      secondary: '330 20% 95%',
      accent: '200 80% 85%', // Pastel blue
      background: '0 0% 99%',
      foreground: '330 40% 20%',
    }
  }
})
```
