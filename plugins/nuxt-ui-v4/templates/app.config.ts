// app.config.ts
// Nuxt UI theme configuration with semantic colors and component defaults

export default defineAppConfig({
  ui: {
    // Theme configuration
    theme: {
      // Semantic color mapping
      // Map semantic aliases to Tailwind colors
      colors: {
        primary: 'blue',      // Brand color
        secondary: 'gray',    // Secondary brand
        success: 'green',     // Positive actions
        info: 'blue',         // Informational
        warning: 'yellow',    // Caution
        error: 'red',         // Destructive
        neutral: 'gray'       // Neutral elements
      },

      // Default variants for components
      // Override default size, color, variant for any component
      defaultVariants: {
        Button: {
          size: 'md',
          color: 'primary',
          variant: 'solid'
        },
        Input: {
          size: 'md',
          variant: 'outline',
          color: 'primary'
        },
        Card: {
          shadow: 'md',
          rounded: 'lg'
        },
        Modal: {
          size: 'md'
        },
        Alert: {
          variant: 'subtle'
        }
      },

      // Component transition configuration
      transitions: {
        enterFromClass: 'opacity-0 scale-95',
        enterActiveClass: 'transition ease-out duration-200',
        enterToClass: 'opacity-100 scale-100',
        leaveFromClass: 'opacity-100 scale-100',
        leaveActiveClass: 'transition ease-in duration-150',
        leaveToClass: 'opacity-0 scale-95'
      }

      // Custom fonts are configured via CSS using Tailwind v4's @theme directive
      // Add the following to app.vue <style> or global CSS:
      //
      // @import "tailwindcss";
      // @import "@nuxt/ui";
      //
      // @theme {
      //   /* Custom sans-serif font */
      //   --font-sans: 'Inter', 'Public Sans', system-ui, -apple-system, sans-serif;
      //
      //   /* Custom monospace font */
      //   --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      //
      //   /* Custom border radius */
      //   --ui-radius: 0.5rem;  /* 8px instead of default 6px */
      //
      //   /* Custom container width */
      //   --ui-container: 90rem;  /* 1440px instead of default 1280px */
      // }
    },

    // Toast notification configuration
    toast: {
      position: 'top-right',
      duration: 5000,
      container: {
        class: 'fixed z-50'
      }
    },

    // Notification configuration
    notification: {
      position: 'top-right',
      duration: 5000
    }
  }
})
