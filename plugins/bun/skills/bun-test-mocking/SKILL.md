---
name: Bun Test Mocking
description: Use for mock functions in Bun tests, spyOn, mock.module, implementations, and test doubles.
version: 1.0.0
---

# Bun Test Mocking

Bun provides Jest-compatible mocking with `mock()`, `spyOn()`, and module mocking.

## Mock Functions

```typescript
import { test, expect, mock } from "bun:test";

// Create mock function
const fn = mock(() => "original");

test("mock function", () => {
  fn("arg1", "arg2");

  expect(fn).toHaveBeenCalled();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith("arg1", "arg2");
});
```

### jest.fn() Compatibility

```typescript
import { test, expect, jest } from "bun:test";

const fn = jest.fn(() => "value");

test("jest.fn works", () => {
  const result = fn();
  expect(result).toBe("value");
  expect(fn).toHaveBeenCalled();
});
```

## Mock Return Values

```typescript
const fn = mock();

// Return value once
fn.mockReturnValueOnce("first");
fn.mockReturnValueOnce("second");

// Permanent return value
fn.mockReturnValue("default");

// Promise returns
fn.mockResolvedValue("resolved");
fn.mockResolvedValueOnce("once");
fn.mockRejectedValue(new Error("fail"));
fn.mockRejectedValueOnce(new Error("once"));
```

## Mock Implementations

```typescript
const fn = mock();

// Set implementation
fn.mockImplementation((x) => x * 2);

// One-time implementation
fn.mockImplementationOnce((x) => x * 10);

// Chain implementations
fn
  .mockImplementationOnce(() => "first")
  .mockImplementationOnce(() => "second")
  .mockImplementation(() => "default");
```

## Spy on Methods

```typescript
import { test, expect, spyOn } from "bun:test";

const obj = {
  method: () => "original",
};

test("spy on method", () => {
  const spy = spyOn(obj, "method");

  obj.method();

  expect(spy).toHaveBeenCalled();
  expect(obj.method()).toBe("original"); // Still works

  // Override implementation
  spy.mockImplementation(() => "mocked");
  expect(obj.method()).toBe("mocked");

  // Restore
  spy.mockRestore();
  expect(obj.method()).toBe("original");
});
```

## Mock Modules

```typescript
import { test, expect, mock } from "bun:test";

// Mock entire module
mock.module("./utils", () => ({
  add: mock(() => 999),
  subtract: mock(() => 0),
}));

// Now imports use mocked version
import { add } from "./utils";

test("mocked module", () => {
  expect(add(1, 2)).toBe(999);
});
```

### Mock Node Modules

```typescript
mock.module("axios", () => ({
  default: {
    get: mock(() => Promise.resolve({ data: "mocked" })),
    post: mock(() => Promise.resolve({ data: "created" })),
  },
}));
```

### Mock with Factory

```typescript
mock.module("./config", () => {
  return {
    API_URL: "http://test.local",
    DEBUG: true,
  };
});
```

## Mock Assertions

```typescript
const fn = mock();

fn("a", "b");
fn("c", "d");

// Call count
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);

// Call arguments
expect(fn).toHaveBeenCalledWith("a", "b");
expect(fn).toHaveBeenLastCalledWith("c", "d");
expect(fn).toHaveBeenNthCalledWith(1, "a", "b");

// Return values
fn.mockReturnValue("result");
fn();
expect(fn).toHaveReturned();
expect(fn).toHaveReturnedWith("result");
expect(fn).toHaveReturnedTimes(1);
```

## Mock Properties

```typescript
const fn = mock(() => "value");

fn("arg1");
fn("arg2");

// Access call info
fn.mock.calls;        // [["arg1"], ["arg2"]]
fn.mock.results;      // [{ type: "return", value: "value" }, ...]
fn.mock.lastCall;     // ["arg2"]

// Clear history
fn.mockClear();       // Clear calls, keep implementation
fn.mockReset();       // Clear calls + implementation
fn.mockRestore();     // Restore original (for spies)
```

## Common Patterns

### Mock Fetch

```typescript
import { test, expect, spyOn } from "bun:test";

test("mock fetch", async () => {
  const spy = spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ data: "mocked" }))
  );

  const response = await fetch("/api/data");
  const json = await response.json();

  expect(json.data).toBe("mocked");
  expect(spy).toHaveBeenCalledWith("/api/data");

  spy.mockRestore();
});
```

### Mock Console

```typescript
test("mock console", () => {
  const spy = spyOn(console, "log");

  console.log("test message");

  expect(spy).toHaveBeenCalledWith("test message");
  spy.mockRestore();
});
```

### Mock Class Methods

```typescript
class UserService {
  async getUser(id: string) {
    // Real implementation
  }
}

test("mock class method", () => {
  const service = new UserService();
  const spy = spyOn(service, "getUser").mockResolvedValue({
    id: "1",
    name: "Test User",
  });

  const user = await service.getUser("1");

  expect(user.name).toBe("Test User");
  expect(spy).toHaveBeenCalledWith("1");
});
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot spy on undefined` | Property doesn't exist | Check property name |
| `Not a function` | Trying to mock non-function | Use correct mock approach |
| `Already mocked` | Double mocking | Use mockRestore first |
| `Module not found` | Wrong module path | Check path in mock.module |

## When to Load References

Load `references/mock-api.md` when:
- Complete mock/spy API reference
- Advanced mocking patterns

Load `references/module-mocking.md` when:
- Complex module mocking
- Hoisting behavior details
