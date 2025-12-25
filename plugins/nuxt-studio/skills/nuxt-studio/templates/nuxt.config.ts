// Nuxt Studio Configuration Template
// Copy and customize for your Nuxt Content + Studio project

export default defineNuxtConfig({
  // Essential modules - order matters
  modules: [
    '@nuxt/content',  // Required: Must be loaded before Studio
    '@nuxt/studio'    // Nuxt Studio module
  ],

  // Nuxt Content configuration
  content: {
    // Enable experimental client DB for MDC components in Studio
    experimental: {
      clientDB: true
    },

    // Highlight code blocks
    highlight: {
      theme: 'github-dark',
      preload: ['typescript', 'javascript', 'vue', 'css', 'bash']
    },

    // Markdown configuration
    markdown: {
      toc: {
        depth: 3,
        searchDepth: 3
      }
    }
  },

  // Studio configuration
  studio: {
    // Enable Studio
    enabled: true,

    // Editor configuration
    editor: {
      // Default editor: 'tiptap' | 'monaco' | 'form'
      default: 'tiptap',

      // Allow users to switch between editors
      allowSwitching: true,

      // Available editors for users
      available: ['tiptap', 'monaco'],

      // Monaco editor configuration
      monaco: {
        theme: 'vs-dark',
        fontSize: 14,
        wordWrap: 'on',
        lineNumbers: 'on',
        minimap: {
          enabled: true
        }
      },

      // TipTap editor configuration
      tiptap: {
        toolbar: {
          enabled: true,
          items: [
            'bold',
            'italic',
            'strike',
            'code',
            '|',
            'heading',
            '|',
            'bulletList',
            'orderedList',
            '|',
            'link',
            'image',
            '|',
            'codeBlock',
            'blockquote'
          ]
        },

        // MDC component support
        mdc: {
          enabled: true,
          components: ['Alert', 'CodeBlock', 'Card']
        }
      }
    },

    // Git configuration
    git: {
      enabled: true,

      // Git author for commits made through Studio
      author: {
        name: 'Studio CMS',
        email: 'studio@yourdomain.com'
      },

      // Branch for Studio edits (optional - defaults to current branch)
      // branch: 'content-edits'
    },

    // Media library configuration
    media: {
      enabled: true,

      // Storage backend: 'local' | 'cloudflare-r2' | 's3'
      // Use 'cloudflare-r2' for Cloudflare deployments (required for Pages)
      storage: 'cloudflare-r2',

      // Cloudflare R2 configuration (required when using cloudflare-r2 storage)
      r2: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        bucketName: process.env.R2_BUCKET_NAME!,
        publicUrl: process.env.R2_PUBLIC_URL!
      },

      // Supported file formats
      formats: ['jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],

      // Max file size (10MB)
      maxFileSize: 10 * 1024 * 1024,

      // Thumbnail generation
      thumbnails: {
        enabled: true,
        sizes: [
          { width: 200, height: 200, name: 'thumb' },
          { width: 800, height: 600, name: 'medium' }
        ]
      }
    }
  },

  // Nitro configuration for deployment
  nitro: {
    // Cloudflare Pages preset (for Cloudflare deployment)
    preset: 'cloudflare-pages',

    // Or use 'cloudflare' for Workers
    // preset: 'cloudflare',

    // Prerender routes for better performance
    prerender: {
      routes: ['/']
    }
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-side only)
    oauth: {
      github: {
        clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET
      },
      gitlab: {
        clientId: process.env.NUXT_OAUTH_GITLAB_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GITLAB_CLIENT_SECRET,
        serverUrl: process.env.NUXT_OAUTH_GITLAB_SERVER_URL
      },
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    },

    // Public keys (exposed to client)
    public: {
      studioUrl: process.env.NUXT_PUBLIC_STUDIO_URL || 'http://localhost:3000'
    }
  },

  // Development server configuration
  devServer: {
    port: 3000,
    host: 'localhost'
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    shim: false
  },

  // Vite configuration
  vite: {
    optimizeDeps: {
      include: ['@nuxt/content', '@nuxt/studio']
    }
  }
})
