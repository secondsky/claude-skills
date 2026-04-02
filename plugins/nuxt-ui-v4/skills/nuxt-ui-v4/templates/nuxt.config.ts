// nuxt.config.ts
// Nuxt v4 configuration with @nuxt/ui module

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui'
    // '@nuxtjs/i18n',    // Uncomment for internationalization
    // '@nuxt/content'    // Uncomment for content management
  ],

  css: ['~/assets/css/main.css'],

  ui: {
    prefix: 'U',
    fonts: true,
    colorMode: true,

    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error'],

      // Override default color/size for all components (v4.1+)
      // defaultVariants: {
      //   color: 'neutral',
      //   size: 'sm'
      // },

      // Tailwind CSS prefix support (v4.2+)
      // Must match: @import "tailwindcss" prefix(tw);
      // prefix: 'tw',

      // Enable/disable component transitions (default: true)
      transitions: true
    },

    // Force prose components without @nuxt/content
    // prose: true,

    // Force content components without @nuxt/content
    // content: true,

    experimental: {
      // Tree-shake unused component CSS (v4.1+)
      // true = auto-detect, array = include specific components
      // componentDetection: true
    }
  },

  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',

  typescript: {
    strict: true,
    typeCheck: true
  }
})
