# Bundle Optimization for Cloudflare Workers

Techniques for minimizing bundle size and improving cold start performance.

## Bundle Limits

| Metric | Free | Paid |
|--------|------|------|
| Worker size (compressed) | 1 MB | 10 MB |
| Worker size (uncompressed) | 3 MB | 30 MB |

Larger bundles = slower cold starts. Target < 1 MB for best performance.

## Analyzing Bundle Size

### Using Wrangler

```bash
# Build and show size
bunx wrangler deploy --dry-run --outdir dist

# Check compressed size
du -h dist/index.js
gzip -c dist/index.js | wc -c
```

### Bundle Analyzer

```typescript
// vite.config.ts for analysis
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          filename: 'bundle-stats.html',
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    },
  },
});
```

### Size Tracking Script

```typescript
// scripts/check-bundle-size.ts
import { readFileSync, statSync } from 'fs';
import { gzipSync } from 'zlib';

const MAX_SIZE_KB = 500; // Target max size

function checkBundleSize(path: string): void {
  const content = readFileSync(path);
  const compressed = gzipSync(content);

  const rawKB = content.length / 1024;
  const gzipKB = compressed.length / 1024;

  console.log(`Bundle: ${path}`);
  console.log(`  Raw: ${rawKB.toFixed(2)} KB`);
  console.log(`  Gzip: ${gzipKB.toFixed(2)} KB`);

  if (gzipKB > MAX_SIZE_KB) {
    console.error(`  ⚠️  Exceeds target of ${MAX_SIZE_KB} KB!`);
    process.exit(1);
  } else {
    console.log(`  ✓ Within target`);
  }
}

checkBundleSize('dist/index.js');
```

## Tree Shaking

### Import Only What You Need

```typescript
// ❌ Bad: Imports entire library
import * as lodash from 'lodash';
const result = lodash.debounce(fn, 100);

// ✅ Good: Import specific function
import debounce from 'lodash-es/debounce';
const result = debounce(fn, 100);

// ✅ Even better: Use native or lightweight alternative
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}
```

### Mark Side Effects

```json
// package.json - helps bundler with tree shaking
{
  "sideEffects": false,
  // or specify files with side effects
  "sideEffects": ["*.css", "./src/polyfills.ts"]
}
```

### Named Exports for Better Tree Shaking

```typescript
// ❌ Bad: Default export object
export default {
  functionA,
  functionB,
  functionC,
};

// ✅ Good: Named exports
export { functionA, functionB, functionC };
```

## Code Splitting

### Dynamic Imports

```typescript
// Heavy code loaded only when needed
async function processImage(image: ArrayBuffer): Promise<ArrayBuffer> {
  // Only load image processing when needed
  const { processImage } = await import('./heavy-image-lib');
  return processImage(image);
}

// Route-based splitting
const routes: Record<string, () => Promise<{ default: Handler }>> = {
  '/api/images': () => import('./handlers/images'),
  '/api/pdf': () => import('./handlers/pdf'),
  '/api/export': () => import('./handlers/export'),
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    for (const [path, loader] of Object.entries(routes)) {
      if (url.pathname.startsWith(path)) {
        const { default: handler } = await loader();
        return handler(request);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

### Feature Flags for Conditional Loading

```typescript
interface Env {
  ENABLE_AI: string;
  ENABLE_ANALYTICS: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only load AI module if enabled
    if (env.ENABLE_AI === 'true') {
      const ai = await import('./features/ai');
      // Use AI features
    }

    // Only load analytics if enabled
    if (env.ENABLE_ANALYTICS === 'true') {
      const analytics = await import('./features/analytics');
      // Use analytics
    }

    return handleRequest(request);
  }
};
```

## Dependency Optimization

### Lightweight Alternatives

| Heavy Package | Lightweight Alternative |
|--------------|------------------------|
| lodash (70kb) | lodash-es (tree-shakeable) or native |
| moment (300kb) | dayjs (2kb) or Temporal |
| uuid (10kb) | crypto.randomUUID() (native) |
| axios (40kb) | fetch (native) |
| validator (60kb) | Custom validation or zod |
| bluebird (80kb) | Native Promises |

### Audit Dependencies

```bash
# Check bundle contribution of each package
npx bundle-buddy dist/stats.json

# Find unused dependencies
npx depcheck

# Check for duplicates
npx npm-dedupe
```

### External Dependencies

```typescript
// wrangler.jsonc - exclude from bundle
{
  "build": {
    "command": "bun run build"
  },
  "rules": [
    {
      "type": "ESModule",
      "globs": ["**/*.js"],
      "fallthrough": true
    }
  ]
}
```

## Minification

### Configure Minification

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: true,
    },
  },
});
```

### Remove Dead Code

```typescript
// Use environment flags
const IS_DEV = process.env.NODE_ENV === 'development';

function debug(...args: unknown[]): void {
  if (IS_DEV) {
    console.log('[DEBUG]', ...args);
  }
}

// After minification with dead code elimination:
// debug() calls are completely removed in production
```

## Compression

### Pre-compress Assets

```bash
# Gzip compression
gzip -k -9 dist/index.js

# Brotli compression (better)
brotli -k -q 11 dist/index.js
```

### Optimize for Compression

```typescript
// Compression-friendly patterns

// ❌ Bad: Unique strings
const errors = {
  E001: 'Invalid user input',
  E002: 'Database connection failed',
  E003: 'Authentication required',
};

// ✅ Good: Repetitive patterns compress better
const ERROR_PREFIX = 'Error: ';
const errors = {
  E001: ERROR_PREFIX + 'Invalid user input',
  E002: ERROR_PREFIX + 'Database connection failed',
  E003: ERROR_PREFIX + 'Authentication required',
};
```

## Asset Optimization

### Inline Small Assets

```typescript
// Inline small SVGs instead of importing
const ArrowIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
</svg>`;

// Use data URLs for tiny images (< 1KB)
const tinyImage = 'data:image/png;base64,iVBORw0KGgo...';
```

### Optimize JSON Data

```typescript
// ❌ Bad: Verbose JSON
const config = {
  "enableFeatureA": true,
  "enableFeatureB": false,
  "maxRetries": 3,
  "timeout": 5000,
};

// ✅ Good: Compact representation
const config = { a: 1, b: 0, r: 3, t: 5000 };

// Or use binary format for large data
const binaryConfig = new Uint8Array([1, 0, 3, 0, 0, 19, 136]); // Packed
```

## Build Pipeline

### Optimized Build Script

```json
{
  "scripts": {
    "build": "bun run build:bundle && bun run build:analyze",
    "build:bundle": "esbuild src/index.ts --bundle --minify --format=esm --outfile=dist/index.js",
    "build:analyze": "bun scripts/check-bundle-size.ts",
    "build:watch": "esbuild src/index.ts --bundle --format=esm --outfile=dist/index.js --watch"
  }
}
```

### ESBuild Configuration

```typescript
// build.ts
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  outfile: 'dist/index.js',
  treeShaking: true,
  drop: ['console', 'debugger'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  external: [
    // Cloudflare-provided modules
    'cloudflare:email',
    'cloudflare:sockets',
  ],
});
```

## Monitoring Bundle Size

### CI Check

```yaml
# .github/workflows/bundle-check.yml
name: Bundle Size Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - run: bun install
      - run: bun run build

      - name: Check bundle size
        run: |
          SIZE=$(gzip -c dist/index.js | wc -c)
          echo "Bundle size: $SIZE bytes"
          if [ $SIZE -gt 512000 ]; then
            echo "Bundle exceeds 500KB limit!"
            exit 1
          fi
```
