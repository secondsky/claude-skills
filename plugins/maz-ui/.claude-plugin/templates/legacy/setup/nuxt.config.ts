/**
 * Nuxt 3 Configuration for Maz-UI
 *
 * This configuration provides a complete setup for Maz-UI in Nuxt 3 with:
 * - Auto-imports for components, composables, and directives
 * - Theme customization with SSR/SSG support
 * - Multi-language (i18n) support
 * - Performance optimizations
 * - Plugins and directives configuration
 */

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  /**
   * Nuxt Modules
   */
  modules: [
    '@maz-ui/nuxt',
    // Add other modules as needed:
    // '@nuxtjs/tailwindcss',
    // '@pinia/nuxt',
  ],

  /**
   * Maz-UI Module Configuration
   */
  mazUi: {
    /**
     * General Settings
     */
    general: {
      // Prefix for auto-imports (optional)
      // autoImportPrefix: 'Maz',  // useMazToast instead of useToast

      // Default path for MazIcon component (optional)
      defaultMazIconPath: '/icons',

      // Enable Nuxt DevTools integration (optional)
      devtools: true,
    },

    /**
     * CSS & Styling
     */
    css: {
      // Auto-inject Maz-UI styles
      injectMainCss: true,
    },

    /**
     * Theme Configuration
     * Three strategies available: hybrid (recommended), buildtime, runtime
     */
    theme: {
      // Theme preset
      preset: 'maz-ui',  // 'maz-ui' | 'ocean' | 'pristine' | 'obsidian' | customTheme

      /**
       * Theme Strategy:
       * - 'hybrid': Critical CSS on server, full theme switching on client (RECOMMENDED)
       * - 'buildtime': Static CSS at build time, smallest bundle (no runtime switching)
       * - 'runtime': Full theme logic on client, all presets available (larger bundle)
       */
      strategy: 'hybrid',

      /**
       * Dark Mode Strategy:
       * - 'class': Uses class="dark" on <html> (recommended)
       * - 'media': Uses prefers-color-scheme media query
       */
      darkModeStrategy: 'class',

      /**
       * Color Mode:
       * - 'light': Force light mode
       * - 'dark': Force dark mode
       * - 'auto': Respect user preference (recommended)
       */
      colorMode: 'auto',

      /**
       * Available Modes:
       * - 'light': Light mode only
       * - 'dark': Dark mode only
       * - 'both': Support both modes
       */
      mode: 'both',

      /**
       * Theme Overrides
       * Fine-tune specific theme properties
       */
      overrides: {
        // Foundation overrides
        foundation: {
          'radius': '0.75rem',
          'border-width': '1px',
          // 'font-family': 'Inter, sans-serif',
        },

        // Color overrides
        colors: {
          light: {
            // primary: '220 100% 50%',
            // secondary: '220 14% 96%',
          },
          dark: {
            // primary: '220 100% 70%',
            // secondary: '220 14% 4%',
          }
        }
      },
    },

    /**
     * Translations & i18n
     * 8 built-in languages: en, fr, es, de, it, pt, ja, zh-CN
     */
    translations: {
      // Current locale
      locale: 'en',

      // Fallback locale
      fallbackLocale: 'en',

      /**
       * Preload Fallback (recommended: true)
       * - true: Fallback translations loaded immediately (no delay, no hydration issues)
       * - false: Smaller initial bundle, but may show translation keys briefly
       */
      preloadFallback: true,

      /**
       * Translation Messages
       * - Built-in languages load automatically
       * - Provide custom messages to override or extend
       */
      messages: {
        // Immediate load (recommended for SSR)
        // en: () => import('@maz-ui/translations/locales/en'),

        // Lazy load other languages
        // fr: () => import('@maz-ui/translations/locales/fr'),
        // es: () => import('@maz-ui/translations/locales/es'),

        // Custom translations
        // en: {
        //   custom: {
        //     greeting: 'Hello'
        //   }
        // }
      },
    },

    /**
     * Components
     * All 50+ Maz-UI components auto-imported by default
     */
    components: {
      autoImport: true,  // Auto-import all components
    },

    /**
     * Plugins
     * Enable Maz-UI plugins as needed
     */
    plugins: {
      aos: false,      // Animations on scroll
      dialog: true,    // Programmatic dialogs (useDialog)
      toast: true,     // Toast notifications (useToast)
      wait: false,     // Loading states (useWait)
    },

    /**
     * Composables
     * All composables enabled by default
     * Set to false to disable specific composables
     */
    composables: {
      useTheme: true,
      useTranslations: true,
      useToast: true,
      useDialog: true,
      useBreakpoints: true,
      useWindowSize: true,
      useTimer: true,
      useFormValidator: true,
      useIdleTimeout: true,
      useUserVisibility: true,
      useSwipe: true,
      useReadingTime: true,
      useStringMatching: true,
      useDisplayNames: true,
      useFreezeValue: true,
      useInjectStrict: true,
      useInstanceUniqId: true,
      useMountComponent: true,
    },

    /**
     * Directives
     * Enable Maz-UI directives as needed
     */
    directives: {
      vTooltip: {
        position: 'top',  // Default position
      },
      vClickOutside: true,
      vLazyImg: {
        threshold: 0.1,  // Intersection observer threshold
      },
      vZoomImg: true,
      vFullscreenImg: true,
    },
  },

  /**
   * Nitro Configuration (SSR/SSG)
   * Configure server-side rendering and static generation
   */
  nitro: {
    // Prerender routes for SSG
    prerender: {
      routes: [
        '/',
        '/about',
        '/contact',
        // Add more routes as needed
      ],

      // Crawl links for automatic route discovery
      crawlLinks: true,
    },
  },

  /**
   * App Configuration
   */
  app: {
    head: {
      // Meta tags
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],

      // Link tags (fonts, etc.)
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        // Add custom fonts:
        // {
        //   rel: 'stylesheet',
        //   href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        // }
      ],
    },
  },

  /**
   * Vite Configuration (for Nuxt)
   * Additional Vite settings beyond Nuxt defaults
   */
  vite: {
    // Build optimizations
    build: {
      rollupOptions: {
        output: {
          // Manual chunks for code splitting
          manualChunks: {
            'maz-ui-forms': [
              'maz-ui/components/MazInput',
              'maz-ui/components/MazSelect',
              'maz-ui/components/MazTextarea',
              'maz-ui/components/MazCheckbox',
            ],
            'maz-ui-feedback': [
              'maz-ui/components/MazBtn',
              'maz-ui/components/MazDialog',
            ],
          },
        },
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'maz-ui',
        '@maz-ui/themes',
        '@maz-ui/translations',
      ],
    },
  },

  /**
   * TypeScript Configuration
   */
  typescript: {
    strict: true,
    typeCheck: true,
  },

  /**
   * Development Server
   */
  devServer: {
    port: 3000,
  },

  /**
   * Experimental Features
   */
  experimental: {
    // Inline critical CSS for faster rendering
    inlineSSRStyles: true,

    // Payload extraction for better caching
    payloadExtraction: true,
  },

  /**
   * Runtime Config
   * Environment variables accessible in runtime
   */
  runtimeConfig: {
    // Private config (server-only)
    // apiSecret: process.env.API_SECRET,

    // Public config (client & server)
    public: {
      // apiBase: process.env.API_BASE_URL || '/api',
    },
  },
})

/**
 * Usage Examples:
 *
 * 1. Components (auto-imported):
 *    <template>
 *      <MazBtn>Click me</MazBtn>
 *      <MazInput v-model="value" />
 *    </template>
 *
 * 2. Composables (auto-imported):
 *    <script setup>
 *    const toast = useToast()
 *    const { toggleDarkMode } = useTheme()
 *    </script>
 *
 * 3. Directives (enabled):
 *    <template>
 *      <div v-tooltip="'Hello'">Hover me</div>
 *    </template>
 *
 * 4. Plugins (enabled):
 *    <script setup>
 *    const dialog = useDialog()
 *    const result = await dialog.confirm({
 *      title: 'Confirm',
 *      message: 'Are you sure?'
 *    })
 *    </script>
 *
 * For more information:
 * - https://maz-ui.com/guide/nuxt
 * - https://nuxt.com/docs
 */
