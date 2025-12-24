import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@cloudflare/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({
      // Worker entry point
      main: './backend/src/index.ts',

      // Cloudflare bindings for development
      bindings: {
        // AI binding
        AI: {
          type: 'ai',
        },

        // D1 database (use local for dev)
        DB: {
          type: 'd1',
          databaseName: 'my-app-db',
        },

        // KV namespace (use local for dev)
        MY_KV: {
          type: 'kv',
          id: 'local-kv',
        },

        // R2 bucket (use local for dev)
        MY_BUCKET: {
          type: 'r2',
          bucketName: 'my-app-bucket',
        },

        /* VECTORIZE START
        // Vectorize index (use local for dev)
        MY_VECTORIZE: {
          type: 'vectorize',
          indexName: 'my-app-index',
        },
        VECTORIZE END */

        /* QUEUES START
        // Queue producer (use local for dev)
        MY_QUEUE: {
          type: 'queue',
          queueName: 'my-app-queue',
        },
        QUEUES END */
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/backend': path.resolve(__dirname, './backend'),
    },
  },

  build: {
    outDir: 'dist',
  },
})
