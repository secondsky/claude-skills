// nuxt.config.ts
// Nuxt v4 configuration with @nuxt/ui module

export default defineNuxtConfig({
  // Register Nuxt UI module
  // Add optional modules: '@nuxtjs/i18n', '@nuxt/content'
  modules: [
    '@nuxt/ui'
    // '@nuxtjs/i18n',  // Uncomment for internationalization
    // '@nuxt/content'  // Uncomment for content management
  ],

  // Nuxt UI configuration
  ui: {
    // Component prefix (default: 'U')
    // Change to customize component names (e.g., 'Ui' → <UiButton />)
    prefix: 'U',

    // Enable @nuxt/fonts module for optimal font loading
    fonts: true,

    // Enable color mode integration for dark mode support
    colorMode: true,

    // Enable Prose components for Nuxt Content (requires @nuxt/content)
    // content: true,

    // Enable MDC (Markdown Components) standalone (without @nuxt/content)
    // mdc: true
  },

  // i18n configuration (requires @nuxtjs/i18n module)
  // i18n: {
  //   locales: [
  //     { code: 'en', name: 'English', file: 'en.json' },
  //     { code: 'fr', name: 'Français', file: 'fr.json' },
  //     { code: 'es', name: 'Español', file: 'es.json' }
  //   ],
  //   defaultLocale: 'en',
  //   lazy: true,
  //   langDir: 'locales/',
  //   strategy: 'prefix_except_default',
  //   detectBrowserLanguage: {
  //     useCookie: true,
  //     cookieKey: 'i18n_redirected',
  //     redirectOn: 'root'
  //   }
  // },

  // Content configuration (requires @nuxt/content module)
  // content: {
  //   documentDriven: true,
  //   highlight: {
  //     theme: {
  //       default: 'github-light',
  //       dark: 'github-dark'
  //     },
  //     langs: ['typescript', 'javascript', 'vue', 'css', 'json', 'bash']
  //   },
  //   markdown: {
  //     toc: {
  //       depth: 3,
  //       searchDepth: 3
  //     }
  //   }
  // },

  // Development tools
  devtools: { enabled: true },

  // Compatibility date for Nuxt v4
  compatibilityDate: '2024-11-01',

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Experimental features (Nuxt v4)
  experimental: {
    // Enable any experimental features as needed
  }
})
