---
name: Bun Test Basics
description: Use for bun:test syntax, assertions, describe/it, test.skip/only/each, and basic patterns.
version: 1.0.0
---

# Bun Test Basics

Bun ships with a fast, built-in, Jest-compatible test runner. Tests run with the Bun runtime and support TypeScript/JSX natively.

## Quick Start

```bash
# Run all tests
bun test

# Run specific file
bun test ./test/math.test.ts

# Run tests matching pattern
bun test --test-name-pattern "addition"
```

## Writing Tests

```typescript
import { test, expect, describe } from "bun:test";

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});

describe("math", () => {
  test("addition", () => {
    expect(1 + 1).toBe(2);
  });

  test("subtraction", () => {
    expect(5 - 3).toBe(2);
  });
});
```

## Test File Patterns

Bun discovers test files matching:
- `*.test.{js|jsx|ts|tsx}`
- `*_test.{js|jsx|ts|tsx}`
- `*.spec.{js|jsx|ts|tsx}`
- `*_spec.{js|jsx|ts|tsx}`

## Test Modifiers

```typescript
// Skip a test
test.skip("not ready", () => {
  // won't run
});

// Only run this test
test.only("focus on this", () => {
  // other tests won't run
});

// Placeholder for future test
test.todo("implement later");

// Expected to fail
test.failing("known bug", () => {
  throw new Error("This is expected");
});
```

## Parameterized Tests

```typescript
test.each([
  [1, 1, 2],
  [2, 2, 4],
  [3, 3, 6],
])("add(%i, %i) = %i", (a, b, expected) => {
  expect(a + b).toBe(expected);
});

// With objects
test.each([
  { a: 1, b: 2, expected: 3 },
  { a: 5, b: 5, expected: 10 },
])("add($a, $b) = $expected", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

## Concurrent Tests

```typescript
// Run tests in parallel
test.concurrent("async test 1", async () => {
  await fetch("/api/1");
});

test.concurrent("async test 2", async () => {
  await fetch("/api/2");
});

// Force sequential when using --concurrent
test.serial("must run alone", () => {
  // runs sequentially
});
```

## Common Matchers

```typescript
// Equality
expect(value).toBe(4);           // Strict equality
expect(obj).toEqual({ a: 1 });   // Deep equality
expect(value).toStrictEqual(4);  // Strict + type

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3, 5);  // Floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain("substring");
expect(str).toStartWith("Hello");
expect(str).toEndWith("world");

// Arrays
expect(arr).toContain(item);
expect(arr).toContainEqual({ a: 1 });
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty("key");
expect(obj).toHaveProperty("key", value);
expect(obj).toMatchObject({ a: 1 });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("message");
expect(() => fn()).toThrow(CustomError);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Negation
expect(value).not.toBe(5);
```

## CLI Options

```bash
# Timeout per test (default 5000ms)
bun test --timeout 20

# Bail after N failures
bun test --bail
bun test --bail=10

# Watch mode
bun test --watch

# Random order
bun test --randomize
bun test --seed 12345

# Concurrent execution
bun test --concurrent
bun test --concurrent --max-concurrency 4

# Filter by name
bun test -t "pattern"
```

## Output Reporters

```bash
# Dots (compact)
bun test --dots

# JUnit XML (CI/CD)
bun test --reporter=junit --reporter-outfile=./results.xml
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Test timeout` | Test exceeds 5s | Use `--timeout` or optimize |
| `No tests found` | Wrong file pattern | Check file naming |
| `expect is not defined` | Missing import | Import from `bun:test` |
| `Assertion failed` | Test failure | Check expected vs actual |

## When to Load References

Load `references/matchers.md` when:
- Need complete matcher reference
- Custom matcher patterns

Load `references/cli-options.md` when:
- Full CLI flag reference
- Advanced execution options
