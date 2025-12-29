// Helper to validate required secrets
function validateSecret(key: string, value: string | undefined): string {
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required secret: ${key}. Set ${key} environment variable.`);
  }
  // Safe development default when not in production
  return value || `dev-${key.toLowerCase().replace(/_/g, '-')}-placeholder`;
}

// Production-ready Nuxt 4 configuration
export default defineNuxtConfig({
  // Enable future features
  future: {
    compatibilityVersion: 4
  },

  // Development tools
  devtools: { enabled: true },

  // Modules
  modules: [
    '@nuxt/ui',           // Nuxt UI v4 components
    '@nuxt/image',        // Image optimization
    '@nuxt/fonts',        // Font optimization
    '@nuxthub/core'       // Cloudflare zero-config bindings
  ],

  // NuxtHub configuration (Cloudflare)
  hub: {
    database: true,  // D1 database
    kv: true,        // KV storage
    blob: true,      // R2 blob storage
    cache: true      // Cache API
  },

  // Runtime configuration
  runtimeConfig: {
    // Server-only (secrets) - validated in production
    apiSecret: validateSecret('API_SECRET', process.env.API_SECRET),
    databaseUrl: validateSecret('DATABASE_URL', process.env.DATABASE_URL),
    jwtSecret: validateSecret('JWT_SECRET', process.env.JWT_SECRET),

    // Public (client + server)
    public: {
      apiBase: process.env.API_BASE || '/api',
      appName: 'My Nuxt App',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },

  // App configuration
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

  // Nitro configuration (server)
  nitro: {
    preset: 'cloudflare-pages',  // or 'cloudflare-module' for Workers

    experimental: {
      websocket: true  // Enable WebSocket support
    },

    // Route rules for caching and rendering
    routeRules: {
      // Static pages (prerender at build)
      '/': { prerender: true },
      '/about': { prerender: true },

      // ISR (Incremental Static Regeneration)
      '/blog/**': { swr: 3600, isr: true },  // Revalidate every hour

      // API caching
      '/api/posts': { swr: 600 },  // Cache for 10 minutes

      // SPA mode (no SSR)
      '/dashboard/**': { ssr: false },

      // Static assets
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
    },

    // Compression
    compressPublicAssets: true,
    minify: true
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  },

  // Vite configuration
  vite: {
    build: {
      // Rollup options
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code
            vendor: ['vue', 'vue-router']
          }
        }
      }
    },

    optimizeDeps: {
      include: [
        // Pre-bundle heavy dependencies
      ]
    }
  },

  // Image optimization
  image: {
    cloudflare: {
      baseURL: process.env.CLOUDFLARE_IMAGES_URL || ''
    }
  },

  // Font optimization
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' }
    ]
  }
})
