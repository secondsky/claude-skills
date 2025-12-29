import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'

/**
 * Vite Configuration for Maz-UI with Auto-Imports
 *
 * This configuration enables:
 * - Automatic component imports (no need to manually import Maz-UI components)
 * - Automatic composable imports (useToast, useTheme, etc.)
 * - Automatic directive imports (v-tooltip, v-click-outside, etc.)
 * - Tree-shaking for optimal bundle size
 */

export default defineConfig({
  plugins: [
    // Vue plugin
    vue(),

    /**
     * Auto-Import Components
     * Automatically imports Maz-UI components when used in templates
     * Generated types: components.d.ts
     */
    Components({
      resolvers: [
        // Maz-UI component resolver
        MazComponentsResolver({
          // Optional: Add prefix to avoid naming conflicts
          // prefix: 'Maz',  // Uncomment to use <MazMazBtn> instead of <MazBtn>

          // Optional: Exclude specific components
          // exclude: ['MazSomeComponent']
        }),

        // Maz-UI directive resolver
        MazDirectivesResolver({
          // Optional: Configure directive prefix
          // prefix: 'maz-'  // e.g., v-maz-tooltip instead of v-tooltip
        }),
      ],

      // Generate TypeScript declaration file
      dts: true,

      // Directories to search for components (optional - for your own components)
      dirs: ['src/components'],

      // Additional resolvers (if using other UI libraries)
      // resolvers: [
      //   ElementPlusResolver(),
      //   AntDesignVueResolver(),
      // ]
    }),

    /**
     * Auto-Import Composables & Modules
     * Automatically imports Maz-UI composables and Vue APIs
     * Generated types: auto-imports.d.ts
     */
    AutoImport({
      // Import Maz-UI composables
      resolvers: [
        MazModulesResolver({
          // Optional: Add prefix to avoid naming conflicts
          // prefix: 'maz',  // Uncomment to use mazUseToast instead of useToast
        })
      ],

      // Auto-import Vue APIs
      imports: [
        'vue',
        'vue-router',
        // Add more auto-imports as needed:
        // 'pinia',
        // 'vitest',
      ],

      // Generate TypeScript declaration file
      dts: 'src/auto-imports.d.ts',

      // ESLint globals (optional - if using ESLint)
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },

      // Directories to scan for composables (optional - for your own composables)
      dirs: [
        'src/composables',
        'src/utils',
      ],
    }),
  ],

  /**
   * Resolve Configuration
   * Path aliases for cleaner imports
   */
  resolve: {
    alias: {
      '@': '/src',
      '~': '/src',
    },
  },

  /**
   * Build Configuration
   * Optimize bundle size and performance
   */
  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',

    // Generate sourcemaps for debugging (optional)
    sourcemap: false,

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Separate Maz-UI components into their own chunk
          'maz-ui-components': [
            'maz-ui/components/MazBtn',
            'maz-ui/components/MazInput',
            'maz-ui/components/MazSelect',
            // Add more components as needed
          ],

          // Separate Maz-UI composables into their own chunk
          'maz-ui-composables': [
            'maz-ui/composables/useToast',
            'maz-ui/composables/useTheme',
            'maz-ui/composables/useDialog',
          ],

          // Vendor chunk for large dependencies
          vendor: ['vue', 'vue-router'],
        },
      },
    },

    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 500,

    // Minify using esbuild (faster than terser)
    minify: 'esbuild',
  },

  /**
   * Server Configuration
   * Dev server settings
   */
  server: {
    port: 3000,
    open: true, // Open browser on server start
    cors: true,
  },

  /**
   * CSS Configuration
   */
  css: {
    // CSS preprocessor options (if using SCSS/LESS)
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },

    // PostCSS configuration
    postcss: {
      plugins: [
        // Add PostCSS plugins as needed
        // require('tailwindcss'),
        // require('autoprefixer'),
      ],
    },
  },

  /**
   * Optimization Configuration
   */
  optimizeDeps: {
    // Pre-bundle Maz-UI for faster cold starts
    include: [
      'maz-ui',
      '@maz-ui/themes',
      '@maz-ui/translations',
    ],

    // Exclude from optimization (if needed)
    exclude: [],
  },
})

/**
 * Usage Notes:
 *
 * 1. After setting up this config, you can use Maz-UI components without imports:
 *
 *    <template>
 *      <MazBtn>Click me</MazBtn>
 *      <MazInput v-model="value" />
 *    </template>
 *
 * 2. Composables are also auto-imported:
 *
 *    <script setup>
 *    const toast = useToast()  // No import needed!
 *    const { isDark } = useTheme()
 *    </script>
 *
 * 3. Tree-shaking is automatic - only imports what you use
 *
 * 4. TypeScript support:
 *    - components.d.ts provides component types
 *    - auto-imports.d.ts provides composable types
 *
 * 5. Bundle size:
 *    - With auto-imports: ~15KB (only what you use)
 *    - Without optimization: ~300KB (everything)
 *
 * For more info:
 * - https://github.com/antfu/unplugin-vue-components
 * - https://github.com/antfu/unplugin-auto-import
 * - https://maz-ui.com/guide/resolvers
 */
