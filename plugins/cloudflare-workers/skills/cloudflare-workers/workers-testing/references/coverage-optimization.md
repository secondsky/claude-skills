# Test Coverage Optimization for Cloudflare Workers

Complete guide for measuring, optimizing, and maintaining high test coverage.

## Coverage Configuration

### Basic Setup

Add to `vitest.config.ts`:

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    coverage: {
      provider: 'v8', // Use V8 coverage (recommended for Workers)
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'node_modules/**'
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

### Install Coverage Provider

```bash
bun add -D @vitest/coverage-v8
```

### Run Coverage

```bash
# Generate coverage report
bunx vitest run --coverage

# Watch mode with coverage
bunx vitest --coverage
```

## Coverage Reports

### Text Report (Terminal)

```bash
bunx vitest run --coverage --reporter=text
```

Output:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.71 |    83.33 |   88.89 |   85.71 |
 src                |   90.00 |    87.50 |   100   |   90.00 |
  index.ts          |   90.00 |    87.50 |   100   |   90.00 | 42-45
 src/utils          |   80.00 |    75.00 |   75.00 |   80.00 |
  validator.ts      |   80.00 |    75.00 |   75.00 |   80.00 | 15-18,22
--------------------|---------|----------|---------|---------|-------------------
```

### HTML Report (Browser)

```bash
bunx vitest run --coverage --reporter=html
```

Open `coverage/index.html` in browser for interactive report.

### JSON Report (CI/CD)

```bash
bunx vitest run --coverage --reporter=json
```

Generates `coverage/coverage-final.json` for programmatic analysis.

### LCOV Report (Codecov)

```bash
bunx vitest run --coverage --reporter=lcov
```

Generates `coverage/lcov.info` for upload to Codecov, Coveralls, etc.

## Coverage Thresholds

### Enforce Minimum Coverage

```typescript
export default defineWorkersConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,      // At least 80% of lines covered
        functions: 80,  // At least 80% of functions covered
        branches: 75,   // At least 75% of branches covered
        statements: 80  // At least 80% of statements covered
      }
    }
  }
});
```

**Fails CI if thresholds not met**:
```bash
bunx vitest run --coverage
# ERROR: Coverage for lines (78%) does not meet global threshold (80%)
```

### Per-File Thresholds

```typescript
export default defineWorkersConfig({
  test: {
    coverage: {
      perFile: true, // Apply thresholds per file
      thresholds: {
        lines: 90, // Each file must have 90%+ coverage
        autoUpdate: true // Update thresholds automatically
      }
    }
  }
});
```

## Identifying Untested Code

### View Uncovered Lines

```bash
bunx vitest run --coverage --reporter=text
```

Look for "Uncovered Line #s" column:
```
File          | % Lines | Uncovered Line #s
--------------|---------|-------------------
validator.ts  |   75.00 | 15-18,22,35-40
```

**Fix**: Add tests covering lines 15-18, 22, and 35-40.

### Interactive HTML Report

```bash
bunx vitest run --coverage --reporter=html
open coverage/index.html
```

**Highlights uncovered code in red** for easy identification.

## Improving Coverage

### 1. Test All Branches

**Before** (50% branch coverage):
```typescript
function validateEmail(email: string): boolean {
  if (!email) return false; // Tested
  return email.includes('@'); // Not tested
}

// Test
it('rejects empty email', () => {
  expect(validateEmail('')).toBe(false); // ✅ Line 2 covered
});
```

**After** (100% branch coverage):
```typescript
// Add test for positive case
it('validates email format', () => {
  expect(validateEmail('user@example.com')).toBe(true); // ✅ Line 3 covered
});
```

### 2. Test Error Paths

**Before** (60% coverage):
```typescript
async function createUser(data: any) {
  try {
    return await env.DB.prepare('INSERT INTO users ...').bind(data).run();
  } catch (error) {
    throw new Error('Database error'); // Not tested
  }
}
```

**After** (100% coverage):
```typescript
it('handles database errors', async () => {
  // Trigger error (e.g., duplicate key)
  await expect(createUser({ email: 'duplicate@example.com' }))
    .rejects
    .toThrow('Database error'); // ✅ Catch block covered
});
```

### 3. Test Edge Cases

```typescript
function paginate(page: number, limit: number) {
  if (page < 1) page = 1; // Edge case 1
  if (limit < 1) limit = 10; // Edge case 2
  if (limit > 100) limit = 100; // Edge case 3
  return { offset: (page - 1) * limit, limit };
}

describe('paginate', () => {
  it('handles negative page', () => {
    expect(paginate(-1, 10)).toEqual({ offset: 0, limit: 10 });
  });

  it('handles negative limit', () => {
    expect(paginate(1, -5)).toEqual({ offset: 0, limit: 10 });
  });

  it('caps limit at 100', () => {
    expect(paginate(1, 200)).toEqual({ offset: 0, limit: 100 });
  });
});
```

## Coverage in CI/CD

### GitHub Actions

```yaml
name: Test Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - run: bun install

      - run: bun test --coverage

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true # Fail if upload fails

      - name: Check thresholds
        run: |
          if ! bun test --coverage --run; then
            echo "Coverage thresholds not met"
            exit 1
          fi
```

### Coverage Badge

Add to README.md:
```markdown
[![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
```

## Best Practices

1. **Aim for 80%+ coverage**: Balance between quality and effort
2. **100% critical paths**: Auth, payments, data validation
3. **Test behavior, not implementation**: Don't test private functions
4. **Use coverage to find gaps**: Not as success metric
5. **Update tests with code changes**: Keep coverage high over time
6. **Review coverage in PRs**: Don't merge if coverage drops

## Common Anti-Patterns

### ❌ Testing for Coverage Numbers

```typescript
// ❌ BAD: Pointless test just for coverage
it('increases coverage', () => {
  const x = 1 + 1;
  expect(x).toBe(2);
});
```

### ❌ Testing Private Functions Directly

```typescript
// ❌ BAD: Testing implementation details
import { privateHelper } from '../src/utils';

it('tests private function', () => {
  expect(privateHelper('test')).toBe('TEST');
});
```

**Instead**: Test via public API that calls the private function.

### ❌ Ignoring Untested Branches

```typescript
// ❌ BAD: Marking lines as untested without fixing
/* istanbul ignore next */
if (rare-condition) {
  // Untested code
}
```

**Instead**: Write test for the condition or remove dead code.

## Tools and Resources

- **Codecov**: https://codecov.io/ (coverage tracking)
- **Coveralls**: https://coveralls.io/ (alternative)
- **Vitest Coverage**: https://vitest.dev/guide/coverage.html
- **V8 Coverage**: https://v8.dev/blog/javascript-code-coverage
