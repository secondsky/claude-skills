---
name: Bun Test Coverage
description: Use for test coverage with Bun, --coverage flag, lcov reports, thresholds, and CI integration.
version: 1.0.0
---

# Bun Test Coverage

Bun has built-in code coverage reporting without additional dependencies.

## Enabling Coverage

```bash
# Enable coverage
bun test --coverage

# With threshold (fail if below)
bun test --coverage --coverage-threshold 80
```

## Configuration in bunfig.toml

```toml
[test]
coverage = true
coverageThreshold = 0.8  # 80% minimum
coverageDir = "./coverage"

# Patterns to ignore
coverageSkipTestFiles = true
```

## Coverage Output

```
------------------|---------|---------|-------------------
File              | % Funcs | % Lines | Uncovered Line #s
------------------|---------|---------|-------------------
All files         |   85.71 |   89.23 |
 src/index.ts     |  100.00 |  100.00 |
 src/utils.ts     |   75.00 |   82.35 | 23-25, 41-43
 src/api.ts       |   80.00 |   85.00 | 67, 89-92
------------------|---------|---------|-------------------
```

## Coverage Reporters

```bash
# Default console output
bun test --coverage

# Generate lcov report
bun test --coverage --coverage-reporter=lcov

# Multiple reporters
bun test --coverage --coverage-reporter=text --coverage-reporter=lcov
```

### Available Reporters

| Reporter | Output |
|----------|--------|
| `text` | Console table (default) |
| `lcov` | `coverage/lcov.info` for CI tools |
| `json` | `coverage/coverage.json` |

## Coverage Thresholds

Set minimum coverage requirements:

```bash
# Fail if coverage < 80%
bun test --coverage --coverage-threshold 80

# Per-metric thresholds in bunfig.toml
```

```toml
[test]
coverage = true
coverageThreshold = {
  lines = 80,
  functions = 75,
  branches = 70
}
```

## Excluding Files

```toml
[test]
coverage = true

# Skip test files from coverage
coverageSkipTestFiles = true

# Patterns to exclude
coverageIgnore = [
  "**/*.test.ts",
  "**/fixtures/**",
  "**/mocks/**"
]
```

## CI Integration

### GitHub Actions

```yaml
- name: Run tests with coverage
  run: bun test --coverage --coverage-reporter=lcov

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5
  with:
    files: ./coverage/lcov.info
```

### Output Directory

```bash
# Custom output directory
bun test --coverage --coverage-dir=./reports/coverage
```

## Programmatic Coverage

```typescript
import { test, expect } from "bun:test";

// Get coverage data programmatically
const coverage = Bun.coverage;

// Access after tests complete
process.on("exit", () => {
  console.log(coverage.getCoverageData());
});
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Coverage threshold not met` | Coverage below threshold | Increase test coverage |
| `No coverage data` | Files not executed | Check test includes file |
| `lcov not found` | Missing reporter | Add `--coverage-reporter=lcov` |

## Best Practices

1. **Set realistic thresholds** - Start at 60%, increase gradually
2. **Exclude generated files** - Mock files, type definitions
3. **Focus on critical paths** - Business logic over boilerplate
4. **Run in CI** - Prevent coverage regression

## When to Load References

Load `references/reporters.md` when:
- Custom reporter configuration
- CI/CD integration details
- Codecov/Coveralls setup
