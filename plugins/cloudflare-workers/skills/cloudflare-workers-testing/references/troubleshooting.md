# Troubleshooting Cloudflare Workers Tests

Common issues and solutions when testing Workers with Vitest.

## Setup Issues

### Error: "Cannot find module '@cloudflare/vitest-pool-workers'"

**Symptoms**:
```
Error: Cannot resolve '@cloudflare/vitest-pool-workers/config'
```

**Cause**: Package not installed.

**Fix**:
```bash
bun add -D @cloudflare/vitest-pool-workers
```

**Verify**:
```bash
bun pm ls | grep vitest-pool-workers
```

---

### Error: "Pool 'workers' is not supported"

**Symptoms**:
```
Error: Pool option 'workers' is not supported by Vitest
```

**Cause**: Old Vitest version (< 2.0).

**Fix**:
```bash
bun add -D vitest@^2.1.8
```

**Verify version**:
```bash
bunx vitest --version
# Should be 2.1.8 or higher
```

---

### Error: "Node.js 16 is no longer supported"

**Symptoms**:
```
Error: Miniflare requires Node.js 18 or higher
```

**Cause**: Miniflare v3 dropped Node 16 support.

**Fix**: Upgrade Node.js
```bash
node --version
# Should be v18.x or v20.x

# Install via nvm
nvm install 20
nvm use 20
```

---

## Configuration Issues

### Error: "wrangler.toml not found"

**Symptoms**:
```
Error: Could not find wrangler configuration at ./wrangler.toml
```

**Cause**: Incorrect path in vitest.config.ts.

**Fix**:
```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc' // ✅ Correct path
        }
      }
    }
  }
});
```

**Verify file exists**:
```bash
ls wrangler.jsonc
```

---

### Error: "compatibilityDate is required"

**Symptoms**:
```
Error: Miniflare requires compatibilityDate to be set
```

**Fix**:
```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          compatibilityDate: '2025-01-27' // ✅ Add this
        }
      }
    }
  }
});
```

---

## Binding Issues

### Error: "env is not defined"

**Symptoms**:
```
ReferenceError: env is not defined
```

**Cause**: Missing import from `cloudflare:test`.

**Fix**:
```typescript
import { env } from 'cloudflare:test'; // ✅ Add this import

it('test', async () => {
  await env.DB.prepare('SELECT 1').all(); // Now works
});
```

---

### Error: "Cannot read property 'DB' of undefined"

**Symptoms**:
```
TypeError: Cannot read property 'DB' of undefined
```

**Cause**: Wrangler config not loaded or binding not defined.

**Fix 1**: Ensure wrangler path is set
```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' } // ✅
      }
    }
  }
});
```

**Fix 2**: Verify binding exists in wrangler.jsonc
```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "xxx" }
  ]
}
```

---

### Error: "D1_ERROR: no such table: users"

**Symptoms**:
```
Error: D1_ERROR: no such table: users
```

**Cause**: Schema not created in test.

**Fix**: Create schema in beforeEach
```typescript
beforeEach(async () => {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
});
```

---

## Test Execution Issues

### Error: "ctx.waitUntil tasks did not complete"

**Symptoms**:
```
Error: Execution context waitUntil tasks did not complete within timeout
```

**Cause**: Missing `await waitOnExecutionContext(ctx)`.

**Fix**:
```typescript
import { waitOnExecutionContext } from 'cloudflare:test';

it('test', async () => {
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx); // ✅ Add this
  expect(response.status).toBe(200);
});
```

---

### Error: "SELF is not defined"

**Symptoms**:
```
ReferenceError: SELF is not defined
```

**Cause**: Using old pattern from vitest-pool-workers <0.7.

**Fix**: Import worker directly
```typescript
// ❌ OLD (doesn't work in 0.7+)
import { SELF } from 'cloudflare:test';
await SELF.fetch(request);

// ✅ NEW
import worker from '../src/index';
await worker.fetch(request, env, ctx);
```

---

### Tests Pass Locally But Fail in CI

**Symptoms**: Tests pass on your machine but fail in GitHub Actions/GitLab CI.

**Cause**: Environment differences (Node version, dependencies, bindings).

**Fix 1**: Lock Node version in CI
```yaml
# .github/workflows/test.yml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x' # Match local version
```

**Fix 2**: Use exact dependency versions
```bash
# Instead of ^2.1.8, use exact version
bun add -D vitest@2.1.8 --exact
```

**Fix 3**: Check logs for missing bindings
```bash
# Enable debug logging in CI
VITEST_DEBUG=true bunx vitest
```

---

## Performance Issues

### Tests Running Slowly

**Symptoms**: Test suite takes >30 seconds.

**Cause**: Too many sequential tests or large datasets.

**Fix 1**: Run tests in parallel (default)
```typescript
export default defineWorkersConfig({
  test: {
    pool: 'workers',
    poolOptions: {
      workers: {
        workers: 4 // Parallel workers (default: CPU cores)
      }
    }
  }
});
```

**Fix 2**: Reduce test data
```typescript
// ❌ BAD: Testing with 10,000 records
beforeEach(async () => {
  for (let i = 0; i < 10000; i++) {
    await env.DB.prepare('INSERT INTO users ...').bind(i).run();
  }
});

// ✅ GOOD: Test with minimal data
beforeEach(async () => {
  await env.DB.prepare('INSERT INTO users ...').bind(1).run();
});
```

---

### High Memory Usage

**Symptoms**: Tests crash with `JavaScript heap out of memory`.

**Fix**: Increase Node heap size
```bash
NODE_OPTIONS="--max-old-space-size=4096" bunx vitest
```

Add to package.json:
```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--max-old-space-size=4096' vitest"
  }
}
```

---

## Coverage Issues

### Coverage Reports Missing Files

**Symptoms**: Some source files not in coverage report.

**Cause**: Incorrect include/exclude patterns.

**Fix**:
```typescript
export default defineWorkersConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'], // ✅ Include all TS files
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**' // Exclude type definitions
      ]
    }
  }
});
```

---

### "Coverage for lines does not meet threshold"

**Symptoms**: CI fails with threshold error.

**Fix 1**: Write missing tests (recommended)

**Fix 2**: Lower thresholds (not recommended)
```typescript
export default defineWorkersConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 70 // Lower from 80%
      }
    }
  }
});
```

---

## Debugging Tests

### Enable Debug Logging

```bash
DEBUG=* bunx vitest
```

### Use console.log in Tests

```typescript
it('debug test', async () => {
  console.log('Request:', request);
  const response = await worker.fetch(request, env, ctx);
  console.log('Response:', response.status);
});
```

### Run Single Test

```bash
bunx vitest run test/specific-test.test.ts
```

### Use Vitest UI

```bash
bunx vitest --ui
```

Opens browser with interactive test runner.

## Getting Help

If issue persists:

1. Check Cloudflare community: https://community.cloudflare.com/
2. GitHub issues: https://github.com/cloudflare/workers-sdk/issues
3. Workers Discord: https://discord.gg/cloudflaredev
4. Stack Overflow: Tag `cloudflare-workers` + `vitest`

## Resources

- Official Docs: https://developers.cloudflare.com/workers/testing/
- Vitest Docs: https://vitest.dev/
- Miniflare: https://miniflare.dev/
