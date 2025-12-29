/**
 * Complete Vitest Configuration for Cloudflare Workers
 *
 * Features:
 * - Loads bindings from wrangler.jsonc
 * - Miniflare v3 with latest compatibility
 * - Coverage with thresholds
 * - TypeScript support
 * - Test isolation (automatic)
 *
 * Usage:
 * 1. Copy to project root as vitest.config.ts
 * 2. Update wrangler configPath if needed
 * 3. Adjust coverage thresholds as needed
 * 4. Run: bunx vitest
 */

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    // Use Workers pool for edge runtime testing
    poolOptions: {
      workers: {
        // Load bindings from wrangler configuration
        wrangler: {
          configPath: './wrangler.jsonc', // Update if using wrangler.toml
          environment: process.env.VITEST_ENV || 'development' // Support env-specific config
        },

        // Miniflare configuration
        miniflare: {
          // Match production runtime
          compatibilityDate: '2025-01-27',

          // Enable Node.js compatibility if needed
          compatibilityFlags: [
            'nodejs_compat', // For Node.js APIs
            // 'streams_enable_constructors', // If using streams
          ],

          // Custom bindings for testing (override wrangler if needed)
          bindings: {
            ENVIRONMENT: 'test',
            // Add test-specific vars here
          },

          // Prevent real network requests in tests (optional)
          // fetchMock: {
          //   disableNetConnect: true
          // }
        },

        // Parallel workers (default: CPU cores)
        workers: 4
      }
    },

    // Coverage configuration
    coverage: {
      provider: 'v8', // Use V8 coverage (recommended)

      // Coverage reporters
      reporter: [
        'text',      // Terminal output
        'json',      // JSON for programmatic access
        'html',      // Interactive browser report
        'lcov'       // For Codecov/Coveralls
      ],

      // Files to include in coverage
      include: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ],

      // Files to exclude from coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.tsx',
        'src/types/**',
        'src/**/*.d.ts',
        'node_modules/**'
      ],

      // Coverage thresholds (adjust as needed)
      thresholds: {
        lines: 80,      // 80% of lines must be covered
        functions: 80,  // 80% of functions must be covered
        branches: 75,   // 75% of branches must be covered
        statements: 80  // 80% of statements must be covered
      },

      // Apply thresholds per file (more strict)
      // perFile: true,

      // Auto-update thresholds
      // autoUpdate: true,
    },

    // Global test timeout (30 seconds)
    testTimeout: 30000,

    // Setup files to run before tests
    // setupFiles: ['./test/setup.ts'],

    // Globals (if using expect without import)
    // globals: true,
  },
});
