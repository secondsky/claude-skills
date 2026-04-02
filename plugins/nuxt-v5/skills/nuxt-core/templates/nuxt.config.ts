export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5
  },

  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxthub/core'
  ],

  hub: {
    database: true,
    kv: true,
    blob: true,
    cache: true
  },

  runtimeConfig: {
    apiSecret: '',
    databaseUrl: '',
    jwtSecret: '',

    public: {
      apiBase: '/api',
      appName: 'My Nuxt App',
      appUrl: 'http://localhost:3000'
    }
  },

  app: {
    head: {
      title: 'My Nuxt App',
      titleTemplate: '%s | My Nuxt App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'My awesome Nuxt application' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  nitro: {
    preset: 'cloudflare-pages',

    experimental: {
      websocket: true
    },

    routeRules: {
      '/': { prerender: true },
      '/about': { prerender: true },
      '/blog/**': { swr: 3600, isr: true },
      '/api/posts': { swr: 600 },
      '/dashboard/**': { ssr: false },
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
    },

    compressPublicAssets: true,
    minify: true
  },

  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  },

  vite: {
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [{ name: 'vendor', test: /\/(vue|vue-router)/ }]
          }
        }
      }
    }
  },

  image: {
    cloudflare: {
      baseURL: ''
    }
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google' }
    ]
  }
})
