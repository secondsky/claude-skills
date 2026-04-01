function validateSecret(key, value) {
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required secret: ${key}. Set ${key} environment variable.`)
  }
  return value || `dev-${key.toLowerCase().replace(/_/g, '-')}-placeholder`
}

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
    apiSecret: validateSecret('API_SECRET', process.env.API_SECRET),
    databaseUrl: validateSecret('DATABASE_URL', process.env.DATABASE_URL),
    jwtSecret: validateSecret('JWT_SECRET', process.env.JWT_SECRET),

    public: {
      apiBase: process.env.API_BASE || '/api',
      appName: 'My Nuxt App',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
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
          manualChunks: {
            vendor: ['vue', 'vue-router']
          }
        }
      }
    },

    optimizeDeps: {
      include: []
    }
  },

  image: {
    cloudflare: {
      baseURL: process.env.CLOUDFLARE_IMAGES_URL || ''
    }
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google' }
    ]
  }
})
