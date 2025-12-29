# Vitest Setup for Cloudflare Workers

Complete guide for setting up Vitest with @cloudflare/vitest-pool-workers from scratch.

## Installation

### Step 1: Install Dependencies

```bash
bun add -D vitest @cloudflare/vitest-pool-workers
```

**Package versions**:
- `vitest`: ^2.1.8 (latest stable)
- `@cloudflare/vitest-pool-workers`: ^0.7.2 (January 2025)

### Step 2: Create vitest.config.ts

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Load bindings from wrangler.jsonc
        wrangler: {
          configPath: './wrangler.jsonc'
        },
        // Miniflare configuration
        miniflare: {
          compatibilityDate: '2025-01-27',
          compatibilityFlags: ['nodejs_compat'] // If using Node.js APIs
        }
      }
    }
  }
});
```

### Step 3: Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 4: Create test/ Directory

```bash
mkdir -p test
```

## Advanced Configuration

### Multiple Wrangler Environments

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc',
          environment: process.env.VITEST_ENV || 'development' // Use env-specific config
        }
      }
    }
  }
});
```

Run with specific environment:
```bash
VITEST_ENV=production bun test
```

### Custom Miniflare Options

```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          compatibilityDate: '2025-01-27',
          compatibilityFlags: ['nodejs_compat', 'streams_enable_constructors'],
          // Custom bindings (override wrangler config for testing)
          bindings: {
            TEST_MODE: 'true'
          },
          // Global fetch mock
          fetchMock: {
            disableNetConnect: true // Prevent real network requests
          }
        }
      }
    }
  }
});
```

### TypeScript Configuration

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": [
      "@cloudflare/workers-types",
      "vitest/globals" // For global test functions
    ]
  }
}
```

### Coverage Configuration

```typescript
export default defineWorkersConfig({
  test: {
    coverage: {
      provider: 'v8', // Use V8 coverage (recommended)
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'node_modules/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

Install coverage provider:
```bash
bun add -D @vitest/coverage-v8
```

## Troubleshooting Setup

### Error: "Cannot find module '@cloudflare/vitest-pool-workers'"

**Fix**: Install the package
```bash
bun add -D @cloudflare/vitest-pool-workers
```

### Error: "Pool 'workers' is not supported"

**Cause**: Old Vitest version

**Fix**: Update to Vitest 2.x
```bash
bun add -D vitest@^2.1.8
```

### Error: "wrangler.toml not found"

**Cause**: Missing or incorrect wrangler config path

**Fix**: Verify path in vitest.config.ts
```typescript
wrangler: {
  configPath: './wrangler.jsonc' // Ensure this file exists
}
```

### Error: "Node.js 16 is not supported"

**Cause**: Miniflare v3 requires Node 18+

**Fix**: Upgrade Node.js
```bash
node --version # Should be 18.x or higher
```

### Error: "compatibilityDate is required"

**Cause**: Missing compatibility date in Miniflare config

**Fix**: Add to vitest.config.ts
```typescript
miniflare: {
  compatibilityDate: '2025-01-27' // Use current date
}
```

## Migration from Older Versions

### From vitest-pool-workers <0.7

**Breaking changes**:
1. `SELF` module removed → use direct worker import
2. Miniflare v2 → v3 (requires Node 18+)
3. New pool options format

**Before** (<0.7):
```typescript
import { SELF, env } from 'cloudflare:test';

it('test', async () => {
  const response = await SELF.fetch('http://example.com/');
  expect(response.status).toBe(200);
});
```

**After** (≥0.7):
```typescript
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

it('test', async () => {
  const request = new Request('http://example.com/');
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(200);
});
```

### From Miniflare Directly

If previously using Miniflare without Vitest:

**Before** (Miniflare standalone):
```typescript
import { Miniflare } from 'miniflare';

const mf = new Miniflare({
  script: 'export default { fetch: () => new Response("Hello") }'
});

const response = await mf.dispatchFetch('http://example.com/');
```

**After** (Vitest + pool):
```typescript
import { describe, it, expect } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

describe('Worker', () => {
  it('responds', async () => {
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
  });
});
```

## CI/CD Setup

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - run: bun test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### GitLab CI

```yaml
test:
  image: oven/bun:latest
  script:
    - bun install
    - bun test --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Best Practices

1. **Keep wrangler.jsonc in sync**: Test bindings should match production
2. **Use compatibility date**: Match production runtime behavior
3. **Enable coverage**: Track test quality metrics
4. **Run tests in CI**: Catch regressions early
5. **Use isolated storage**: Each test gets fresh bindings (automatic)

## Resources

- Official Docs: https://developers.cloudflare.com/workers/testing/vitest-integration/
- GitHub: https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-pool-workers
- Vitest Docs: https://vitest.dev/
