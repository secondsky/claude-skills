---
name: nuxt-ui-v4:theme
description: Generate custom Nuxt UI v4 theme configuration with semantic colors and component customization
allowed-tools:
  - Read
  - Write
  - Edit
argument-hint: "<primary-color> [--neutral <color>] [--radius <size>]"
---

# Nuxt UI Theme Generator Command

Generate a custom theme configuration for Nuxt UI v4.

## Arguments

- `<primary-color>`: Primary semantic color (e.g., violet, blue, green, rose)
- `--neutral <color>`: Neutral color for backgrounds/borders (default: slate)
- `--radius <size>`: Border radius size (sm, md, lg, xl, full)

## Available Colors

Tailwind v4 palette colors:
- `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`
- `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`
- Neutrals: `slate`, `gray`, `zinc`, `neutral`, `stone`
- Utility colors: `black`, `white`, `transparent`, `current`

## Instructions

1. **Parse Arguments**
   Extract primary color and optional overrides.

2. **Generate app.config.ts**
   Create or update theme configuration:
   ```ts
   export default defineAppConfig({
     ui: {
       theme: {
         colors: {
           primary: '<primary-color>',
           secondary: 'sky',
           success: 'emerald',
           info: 'blue',
           warning: 'amber',
           error: 'rose',
           neutral: '<neutral-color>'
         },
         radius: '<radius>'
       }
     }
   })
   ```

3. **Generate CSS Variables** (optional)
   If user wants custom shades, create in app.vue:
   ```css
   :root {
     --ui-primary: var(--color-<primary>-500);
     --ui-primary-hover: var(--color-<primary>-600);
   }
   ```

4. **Component-Level Customization**
   Offer to customize specific components:
   ```ts
   export default defineAppConfig({
     ui: {
       button: {
         base: 'font-semibold',
         variants: {
           size: {
             xl: 'px-6 py-3 text-lg'
           }
         }
       }
     }
   })
   ```

5. **Dark Mode Configuration**
   Ensure color mode is enabled:
   ```ts
   // nuxt.config.ts
   export default defineNuxtConfig({
     ui: { colorMode: true }
   })
   ```

6. **Preview Colors**
   Show the user what their theme will look like:
   - Primary: Used for buttons, links, focus rings
   - Secondary: Alternative accent color
   - Success/Error/Warning/Info: Status indicators
   - Neutral: Backgrounds, borders, text

## Example Usage

```bash
/nuxt-ui:theme violet --neutral zinc --radius lg
```

Creates a violet-themed configuration with zinc neutrals and large border radius.

## Output

- Updated `app.config.ts` with theme
- CSS variable overrides if needed
- Preview of color usage across components
- Tips for further customization

## Tips

- Use `violet` or `indigo` for professional apps
- Use `emerald` or `teal` for eco/health apps
- Use `rose` or `pink` for consumer/lifestyle apps
- Match neutral to primary undertone (cool primary → slate, warm primary → stone)
