import { definePreset } from '@maz-ui/themes'

/**
 * Custom Maz-UI Theme
 *
 * This theme preset defines custom colors, typography, and foundation styles.
 * Use this as a template to create your own brand-specific themes.
 *
 * Color Format: HSL (hue saturation% lightness%)
 * - Hue: 0-360 (color wheel degree)
 * - Saturation: 0-100% (color intensity)
 * - Lightness: 0-100% (brightness)
 *
 * Example: '220 100% 50%' = bright blue
 */

export const customTheme = definePreset({
  /**
   * Base preset (optional)
   * Provides fallback values for any properties not defined below
   * Options: 'maz-ui' | 'ocean' | 'pristine' | 'obsidian' | undefined
   */
  base: 'maz-ui',

  /**
   * Theme name
   * Used for identification and debugging
   */
  name: 'custom',

  /**
   * Foundation Variables
   * Typography, spacing, borders, and other non-color properties
   */
  foundation: {
    // Typography
    'base-font-size': '16px',
    'font-family': 'Inter, system-ui, -apple-system, sans-serif',
    'font-family-mono': 'JetBrains Mono, Consolas, Monaco, monospace',

    // Border Styling
    'radius': '0.5rem',              // Border radius (0.5rem = 8px)
    'border-width': '1px',           // Default border width

    // Z-Index Layers
    'z-index-backdrop': '1000',
    'z-index-dialog': '1050',
    'z-index-popover': '1075',
    'z-index-toast': '1100',
  },

  /**
   * Color Scheme
   * Separate palettes for light and dark modes
   * All colors in HSL format (hue saturation% lightness%)
   */
  colors: {
    /**
     * Light Mode Colors
     * Optimized for light backgrounds
     */
    light: {
      // Brand Colors
      primary: '220 100% 50%',        // Primary action color (blue)
      secondary: '220 14% 96%',       // Secondary UI elements (light gray-blue)

      // Base Colors
      background: '0 0% 100%',        // Main background (white)
      foreground: '222 84% 5%',       // Main text color (dark)

      // UI Elements
      muted: '210 40% 96%',           // Muted background
      accent: '210 40% 90%',          // Accent background
      border: '214 32% 91%',          // Border color
      input: '214 32% 91%',           // Input border color
      ring: '220 100% 50%',           // Focus ring color (matches primary)

      // Semantic Colors
      destructive: '0 84% 60%',       // Error/delete actions (red)
      success: '142 71% 45%',         // Success states (green)
      warning: '38 92% 50%',          // Warning states (orange)
      info: '199 89% 48%',            // Informational states (blue)
    },

    /**
     * Dark Mode Colors
     * Optimized for dark backgrounds with adjusted contrast
     */
    dark: {
      // Brand Colors (lighter for dark background)
      primary: '220 100% 70%',        // Lighter blue for visibility
      secondary: '220 14% 4%',        // Dark gray-blue

      // Base Colors
      background: '222 84% 5%',       // Dark background
      foreground: '210 40% 98%',      // Light text

      // UI Elements
      muted: '217 33% 17%',           // Muted dark background
      accent: '217 33% 17%',          // Accent dark background
      border: '217 33% 17%',          // Dark border
      input: '217 33% 17%',           // Dark input border
      ring: '220 100% 70%',           // Focus ring (matches primary)

      // Semantic Colors (darker variants)
      destructive: '0 62% 30%',       // Darker red
      success: '142 71% 25%',         // Darker green
      warning: '38 92% 30%',          // Darker orange
      info: '199 89% 28%',            // Darker blue
    }
  }
})

/**
 * Alternative Theme Variations
 * Uncomment and modify to create additional theme presets
 */

/*
// Minimal Theme (Monochrome, sharp corners)
export const minimalTheme = definePreset({
  name: 'minimal',
  foundation: {
    'radius': '0rem',                // Sharp corners
    'border-width': '1px',
    'font-family': 'Inter, sans-serif',
  },
  colors: {
    light: {
      primary: '0 0% 0%',            // Black
      secondary: '0 0% 96%',
      background: '0 0% 100%',       // White
      foreground: '0 0% 0%',
      muted: '0 0% 95%',
      accent: '0 0% 90%',
      destructive: '0 84% 60%',
      success: '142 71% 45%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '0 0% 0%',
    },
    dark: {
      primary: '0 0% 100%',          // White
      secondary: '0 0% 4%',
      background: '0 0% 0%',         // Black
      foreground: '0 0% 100%',
      muted: '0 0% 10%',
      accent: '0 0% 15%',
      destructive: '0 62% 30%',
      success: '142 71% 25%',
      warning: '38 92% 30%',
      info: '199 89% 28%',
      border: '0 0% 15%',
      input: '0 0% 15%',
      ring: '0 0% 100%',
    }
  }
})
*/

/*
// Playful Theme (Bright colors, rounded)
export const playfulTheme = definePreset({
  name: 'playful',
  foundation: {
    'radius': '1.5rem',              // Very rounded
    'border-width': '2px',
    'font-family': 'Poppins, sans-serif',
  },
  colors: {
    light: {
      primary: '280 100% 50%',       // Purple
      secondary: '340 100% 50%',     // Pink
      background: '50 100% 98%',     // Cream
      foreground: '280 40% 20%',     // Dark purple
      success: '150 80% 45%',        // Bright green
      // ... other colors
    }
  }
})
*/

/**
 * Usage in Vue 3:
 *
 * import { MazUi } from 'maz-ui/plugins/maz-ui'
 * import { customTheme } from './themes/custom-theme'
 * import 'maz-ui/styles'
 *
 * app.use(MazUi, {
 *   theme: { preset: customTheme }
 * })
 */

/**
 * Usage in Nuxt 3:
 *
 * // nuxt.config.ts
 * import { customTheme } from './themes/custom-theme'
 *
 * export default defineNuxtConfig({
 *   modules: ['@maz-ui/nuxt'],
 *   mazUi: {
 *     theme: {
 *       preset: customTheme,
 *       strategy: 'hybrid',  // or 'buildtime' | 'runtime'
 *       darkModeStrategy: 'class'
 *     }
 *   }
 * })
 */
