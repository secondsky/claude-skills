# Maz-UI CLI Reference

Guide to @maz-ui/cli theme generator for Maz-UI v3.x (legacy) and migration to v4.x themes.

## Overview

The `@maz-ui/cli` package provides a command-line tool for generating CSS variable files for theming Maz-UI.

::: warning Version Notice
**This CLI is for Maz-UI v3.x users only.**

If you're using **Maz-UI v4.x** (v4.3.3+), you should use the **[@maz-ui/themes package](./theming.md)** instead, which provides:
- Built-in theme presets (maz-ui, ocean, pristine, obsidian)
- Runtime theme switching
- Better TypeScript support
- Optimized performance
:::

---

## For v4.x Users (Current Version)

### Modern Theming with @maz-ui/themes

**Installation**:
```bash
pnpm add @maz-ui/themes
```

**Usage**:
```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi, ocean, pristine, obsidian } from '@maz-ui/themes'

app.use(MazUi, {
  theme: {
    preset: ocean  // Use built-in presets
  }
})
```

**Custom Theme**:
```typescript
import { defineTheme } from '@maz-ui/themes'

const customTheme = defineTheme({
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    destructive: '#FF3B30',
    info: '#5AC8FA'
  },
  borderRadius: '12px',
  fontFamily: 'Inter, system-ui, sans-serif'
})

app.use(MazUi, {
  theme: { preset: customTheme }
})
```

**Learn More**: See [Theming Guide](./theming.md) for complete v4 documentation.

---

## For v3.x Users (Legacy)

### Installation

```bash
# Install CLI package
npm install @maz-ui/cli

# Or with pnpm
pnpm add @maz-ui/cli
```

---

## Configuration File

Create a configuration file in your project root:

**File**: `maz-ui.config.ts` (or `.js`, `.mjs`, `.cjs`)

```typescript
import { defineConfig } from '@maz-ui/cli'

export default defineConfig({
  outputCssFilePath: './css/maz-ui-variables.css',
  theme: {
    colors: {
      primary: 'hsl(210, 100%, 56%)',
      secondary: 'hsl(164, 76%, 46%)',
      info: 'hsl(188, 78%, 41%)',
      success: 'hsl(80, 61%, 50%)',
      warning: 'hsl(40, 97%, 59%)',
      danger: 'hsl(1, 100%, 71%)',
      bgOverlay: 'hsl(0, 0%, 0% / 30%)',
      lightTheme: {
        textColor: 'hsl(0, 0%, 85%)',
        colorMuted: 'hsla(0, 0%, 0%, 0.54)',
        bgColor: 'hsl(0, 0%, 100%)',
      },
      darkTheme: {
        textColor: 'hsl(210, 8%, 14%)',
        colorMuted: 'hsla(0, 0%, 100%, 0.54)',
        bgColor: 'hsl(235, 16%, 15%)',
      },
    },
    borderColor: 'hsl(220deg 13.04% 90.98%)',
    borderWidth: '0.125rem',
    borderRadius: '0.5rem',
    fontFamily: `system-ui, -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, oxygen,
      ubuntu, cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  },
})
```

### Configuration Options

```typescript
interface MazUiConfig {
  /**
   * Path and name of generated CSS file
   * @example './css/maz-ui-variables.css'
   */
  outputCssFilePath: string

  theme: {
    colors: {
      primary?: string
      secondary?: string
      info?: string
      danger?: string
      success?: string
      warning?: string
      bgOverlay?: string
      lightTheme?: {
        textColor?: string
        colorMuted?: string
        bgColor?: string
      }
      darkTheme?: {
        textColor?: string
        colorMuted?: string
        bgColor?: string
      }
    }

    /**
     * Border color applied to components like inputs, cards, etc.
     */
    borderColor?: string

    /**
     * Border width applied to components
     */
    borderWidth?: string

    /**
     * Border radius for rounded components
     */
    borderRadius?: string

    /**
     * Font family for text
     */
    fontFamily?: string
  }
}
```

### Color Formats

All colors support multiple formats:

```typescript
// HEX
primary: '#007AFF'

// RGB
secondary: 'rgb(52, 199, 89)'

// RGBA
bgOverlay: 'rgba(0, 0, 0, 0.3)'

// HSL
success: 'hsl(80, 61%, 50%)'

// HSLA
danger: 'hsla(1, 100%, 71%, 1)'

// Named colors
warning: 'orange'
```

---

## Generating CSS Variables

### Method 1: Direct CLI Command

Run the CLI directly without installing:

```bash
# Using npx
npx maz-ui generate-css-vars

# Using pnpm
pnpx maz-ui generate-css-vars
```

### Method 2: Package.json Script

**1. Add script to package.json**:

```json
{
  "scripts": {
    "generate-css-vars": "maz-ui generate-css-vars"
  }
}
```

**2. Run the script**:

```bash
# npm
npm run generate-css-vars

# yarn
yarn generate-css-vars

# pnpm
pnpm generate-css-vars
```

### Output

The CLI will generate a CSS file at the specified `outputCssFilePath`:

```css
/* css/maz-ui-variables.css */

:root {
  --maz-color-primary: hsl(210, 100%, 56%);
  --maz-color-primary-50: hsl(210, 100%, 95%);
  --maz-color-primary-100: hsl(210, 100%, 90%);
  /* ... more primary shades */

  --maz-color-secondary: hsl(164, 76%, 46%);
  /* ... more colors */

  --maz-border-color: hsl(220deg 13.04% 90.98%);
  --maz-border-width: 0.125rem;
  --maz-border-radius: 0.5rem;
  --maz-font-family: system-ui, ...;
}

[data-theme="dark"] {
  --maz-text-color: hsl(0, 0%, 85%);
  --maz-color-muted: hsla(0, 0%, 0%, 0.54);
  --maz-bg-color: hsl(0, 0%, 100%);
}
```

---

## Using Generated CSS

**Import in your main entry file**:

```typescript
// main.ts (Vue)
import './css/maz-ui-variables.css'
import 'maz-ui/css/main.css'  // v3.x Maz-UI styles
```

```typescript
// nuxt.config.ts (Nuxt)
export default defineNuxtConfig({
  css: [
    './css/maz-ui-variables.css',
    'maz-ui/css/main.css'
  ]
})
```

---

## Examples

### Minimal Configuration

```typescript
// maz-ui.config.ts
import { defineConfig } from '@maz-ui/cli'

export default defineConfig({
  outputCssFilePath: './src/assets/maz-ui-variables.css',
  theme: {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6'
    }
  }
})
```

### Full Configuration

```typescript
// maz-ui.config.ts
import { defineConfig } from '@maz-ui/cli'

export default defineConfig({
  outputCssFilePath: './public/css/maz-ui-variables.css',
  theme: {
    colors: {
      primary: 'hsl(210, 100%, 56%)',
      secondary: 'hsl(164, 76%, 46%)',
      info: 'hsl(188, 78%, 41%)',
      success: 'hsl(80, 61%, 50%)',
      warning: 'hsl(40, 97%, 59%)',
      danger: 'hsl(1, 100%, 71%)',
      bgOverlay: 'hsla(0, 0%, 0%, 0.3)',
      lightTheme: {
        textColor: 'hsl(0, 0%, 15%)',
        colorMuted: 'hsla(0, 0%, 0%, 0.54)',
        bgColor: 'hsl(0, 0%, 100%)',
      },
      darkTheme: {
        textColor: 'hsl(0, 0%, 85%)',
        colorMuted: 'hsla(0, 0%, 100%, 0.54)',
        bgColor: 'hsl(235, 16%, 15%)',
      },
    },
    borderColor: 'hsl(220, 13%, 91%)',
    borderWidth: '2px',
    borderRadius: '12px',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
})
```

### Brand-Specific Theme

```typescript
// maz-ui.config.ts
import { defineConfig } from '@maz-ui/cli'

export default defineConfig({
  outputCssFilePath: './src/styles/brand-theme.css',
  theme: {
    colors: {
      primary: '#FF6B6B',      // Brand red
      secondary: '#4ECDC4',    // Brand teal
      success: '#95E1D3',      // Mint green
      warning: '#F9CA24',      // Bright yellow
      danger: '#EE5A6F',       // Coral red
      info: '#00B8D4',         // Cyan
      lightTheme: {
        textColor: '#2C3E50',
        colorMuted: 'rgba(44, 62, 80, 0.6)',
        bgColor: '#FAFAFA',
      },
      darkTheme: {
        textColor: '#ECF0F1',
        colorMuted: 'rgba(236, 240, 241, 0.6)',
        bgColor: '#1A1A2E',
      },
    },
    borderColor: '#E0E0E0',
    borderWidth: '1px',
    borderRadius: '8px',
    fontFamily: 'Poppins, sans-serif',
  },
})
```

---

## Migration from v3 to v4

### v3 (CLI Approach)

**v3 Configuration**:
```typescript
// maz-ui.config.ts (v3)
export default defineConfig({
  outputCssFilePath: './css/vars.css',
  theme: {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6'
    },
    borderRadius: '8px'
  }
})
```

**v3 Usage**:
```bash
npx maz-ui generate-css-vars
```

```typescript
// main.ts
import './css/vars.css'
import 'maz-ui/css/main.css'
```

### v4 (Themes Package)

**v4 Configuration**:
```typescript
// theme.ts (v4)
import { defineTheme } from '@maz-ui/themes'

export const customTheme = defineTheme({
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6'
  },
  borderRadius: '8px'
})
```

**v4 Usage**:
```typescript
// main.ts
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { customTheme } from './theme'
import 'maz-ui/styles'

app.use(MazUi, {
  theme: { preset: customTheme }
})
```

### Benefits of v4 Approach

1. **No Build Step**: Themes work runtime, no CSS file generation needed
2. **Type Safety**: Full TypeScript support with autocomplete
3. **Theme Switching**: Dynamic theme changes without reloading
4. **Better DX**: Simpler API, less configuration
5. **Built-in Presets**: 4 professional themes out of the box
6. **Tree-Shaking**: Better optimized bundle sizes

---

## Troubleshooting (v3 CLI)

### CLI Command Not Found

**Error**: `maz-ui: command not found`

**Solution**: Ensure @maz-ui/cli is installed:
```bash
npm install @maz-ui/cli
# or use npx/pnpx
```

### Config File Not Found

**Error**: `Could not find maz-ui.config file`

**Solution**: Create `maz-ui.config.ts` in project root:
```typescript
import { defineConfig } from '@maz-ui/cli'

export default defineConfig({
  outputCssFilePath: './src/maz-ui-vars.css',
  theme: { colors: {} }
})
```

### Generated CSS Not Applied

**Error**: Styles don't match configuration

**Solution**: Ensure CSS is imported BEFORE Maz-UI's main CSS:
```typescript
import './css/maz-ui-variables.css'  // Custom variables FIRST
import 'maz-ui/css/main.css'         // Then Maz-UI styles
```

### Color Variants Look Wrong

**Warning**: "Depending on chosen colors, some variants may need adjustment"

**Solution**: Manually adjust generated CSS variables if auto-generated shades don't look right:
```css
/* Manually override problematic shades */
:root {
  --maz-color-primary-500: #007AFF;  /* Your exact brand color */
}
```

---

## Related Documentation

- **[Theming Guide](./theming.md)** - v4 theming with @maz-ui/themes (recommended)
- **[Migration v4 Guide](./migration-v4.md)** - Upgrading from v3 to v4
- **[Setup Vue](./setup-vue.md)** - Vue 3 installation and configuration
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt 3 module setup

---

## External Resources

- **[@maz-ui/cli NPM](https://www.npmjs.com/package/@maz-ui/cli)** - Legacy v3 CLI package
- **[@maz-ui/themes NPM](https://www.npmjs.com/package/@maz-ui/themes)** - Modern v4 theming package
- **[Official CLI Docs](https://maz-ui.com/guide/cli)** - v3 CLI documentation
- **[Official Themes Docs](https://maz-ui.com/guide/themes)** - v4 themes documentation

---

**CLI Version**: @maz-ui/cli v3.x (legacy)
**Recommended**: @maz-ui/themes v4.3.3+
**Last Updated**: 2025-12-14

::: tip Recommendation
For new projects, use **@maz-ui/themes** (v4) instead of @maz-ui/cli (v3) for better performance, developer experience, and runtime theme switching.
:::
