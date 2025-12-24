// Complete Nuxt Configuration with Nuxt Content & Studio
// Copy relevant sections to your nuxt.config.ts

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-studio'  // Optional: Remove if not using Nuxt Studio
  ],

  // Nuxt Content Configuration (optional - has sensible defaults)
  content: {
    // All configuration is optional
  },

  // Nuxt Studio Configuration (optional)
  studio: {
    route: '/_studio',  // Admin route

    repository: {
      provider: 'github',
      owner: 'your-username',
      repo: 'your-repo',
      branch: process.env.STUDIO_GITHUB_BRANCH_NAME || 'main'
    },

    // Optional: Development mode
    development: {
      sync: true  // Writes changes to local files
    }
  },

  // Nitro Configuration for Deployment
  nitro: {
    // Choose preset based on deployment platform:
    preset: 'cloudflare_pages',  // or 'cloudflare', 'vercel', 'vercel-edge', 'netlify'

    // Prerendering configuration
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  // Route Rules for Hybrid Rendering
  routeRules: {
    // Static at build time
    '/': { prerender: true },
    '/about': { prerender: true },

    // ISR (Incremental Static Regeneration)
    '/blog/**': { isr: 3600 },  // Regenerate every hour

    // SWR (Stale While Revalidate)
    '/docs/**': { swr: 3600 },  // Cache for 1 hour

    // Always SSR
    '/_studio/**': { ssr: true },

    // API routes
    '/api/**': { cors: true }
  },

  // TypeScript Configuration
  typescript: {
    strict: true
  },

  // App Configuration
  app: {
    head: {
      title: 'My Nuxt Content Site',
      meta: [
        { name: 'description', content: 'Built with Nuxt Content v3' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Development Server
  devtools: { enabled: true }
})
