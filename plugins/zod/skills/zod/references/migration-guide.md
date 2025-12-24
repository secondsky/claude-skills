# Migrating from Zod v3 to v4

Complete guide for upgrading from Zod v3 to v4, including all breaking changes and migration strategies.

**Last Updated**: 2025-11-17

---

## Breaking Changes Overview

Zod v4 introduces several breaking changes that improve performance and API consistency. This guide covers all changes you need to be aware of when upgrading.

---

## 1. Error Customization Unified

**Breaking Change**: The `error` parameter replaces fragmented error options.

```typescript
// ❌ Zod v3 (No longer works)
z.string({
  message: "Custom message",
  invalid_type_error: "Must be a string",
  required_error: "Field is required"
});

z.string().email({ errorMap: (issue) => ({ message: "Invalid email" }) });

// ✅ Zod v4 (Use unified 'error' parameter)
z.string({
  error: "Custom message"
});

z.string().email({
  error: (issue) => ({ message: "Invalid email" })
});
```

---

## 2. Number Validation Stricter

**Breaking Change**: Infinite values and unsafe integers are now rejected.

```typescript
// ❌ Zod v3 (Accepted these values)
z.number().parse(Infinity);           // OK in v3
z.number().parse(-Infinity);          // OK in v3
z.number().int().parse(9007199254740992); // OK in v3 (unsafe integer)

// ✅ Zod v4 (Rejects invalid numbers)
z.number().parse(Infinity);           // ✗ Error: infinite values rejected
z.number().parse(-Infinity);          // ✗ Error: infinite values rejected
z.number().int().parse(9007199254740992); // ✗ Error: outside safe integer range

// If you need to allow infinite values, use a refinement:
z.number().refine((n) => Number.isFinite(n) || !Number.isNaN(n));

// .int() now enforces Number.MIN_SAFE_INTEGER to Number.MAX_SAFE_INTEGER
// .safe() no longer permits floats (integers only)
```

---

## 3. String Format Methods Moved to Top-Level

**Breaking Change**: Format validators are now top-level functions, not methods.

```typescript
// ❌ Zod v3 (Methods on z.string())
z.string().email();
z.string().uuid();
z.string().url();
z.string().ipv4();
z.string().ipv6();

// ✅ Zod v4 (Top-level functions)
z.email();        // Shorthand for validated email
z.uuid();         // Stricter UUID validation (RFC 9562/4122)
z.url();
z.ipv4();
z.ipv6();

// Both still work for now, but top-level is preferred
z.string().email();  // Still works in v4
z.email();          // Preferred in v4
```

---

## 4. Object Defaults Behavior Changed

**Breaking Change**: Defaults inside properties are now applied even within optional fields.

```typescript
const schema = z.object({
  name: z.string().default("Anonymous"),
  age: z.number().optional().default(18),
});

// ❌ Zod v3 behavior
schema.parse({ age: undefined });
// Result: { name: "Anonymous", age: undefined }

// ✅ Zod v4 behavior
schema.parse({ age: undefined });
// Result: { name: "Anonymous", age: 18 }
// Default is applied even though field was optional
```

---

## 5. Deprecated APIs Removed or Changed

**Breaking Changes**: Several APIs have been deprecated or consolidated.

```typescript
// ❌ Zod v3 APIs (Deprecated in v4)
schema1.merge(schema2);           // Use .extend() instead
error.format();                   // Use z.treeifyError(error)
error.flatten();                  // Use z.flattenError(error)
z.nativeEnum(MyEnum);             // Use z.enum() (now handles both)
z.promise(schema);                // Deprecated

// ✅ Zod v4 Replacements
schema1.extend(schema2);          // Preferred way to merge
z.treeifyError(error);           // New error formatting
z.flattenError(error);           // New flat error format
z.enum(MyEnum);                  // Unified enum handling
// No direct replacement for z.promise() - use async refinements
```

---

## 6. Function Validation Redesigned

**Breaking Change**: `z.function()` no longer returns a schema directly.

```typescript
// ❌ Zod v3
const myFunc = z.function()
  .args(z.string())
  .returns(z.number())
  .parse(someFunction);

// ✅ Zod v4
const myFunc = z.function()
  .args(z.string())
  .returns(z.number())
  .implement((str) => {
    return parseInt(str); // Type-checked!
  });

// Or with new syntax:
const myFunc = z.function({
  input: [z.string()],
  output: z.number()
}).implement((str) => parseInt(str));
```

---

## 7. UUID Validation Stricter

**Breaking Change**: UUID validation now follows RFC 9562/4122 specification strictly.

```typescript
// Some previously valid UUIDs may now fail validation
// Ensure UUIDs conform to RFC 9562/4122 format
const uuid = z.uuid().parse("550e8400-e29b-41d4-a716-446655440000"); // ✓
```

---

## Migration Checklist

Use this checklist to systematically upgrade your codebase:

- [ ] Replace `message`, `invalid_type_error`, `required_error`, `errorMap` with unified `error` parameter
- [ ] Check for `Infinity` or `-Infinity` in number validations
- [ ] Update `.int()` usage if relying on unsafe integers
- [ ] Replace `.merge()` with `.extend()`
- [ ] Replace `error.format()` with `z.treeifyError()`
- [ ] Replace `error.flatten()` with `z.flattenError()`
- [ ] Update `z.nativeEnum()` to `z.enum()` (or keep for clarity)
- [ ] Replace `z.promise()` with async refinements
- [ ] Update function validation to use `.implement()` or new syntax
- [ ] Consider using top-level format functions (`z.email()` instead of `z.string().email()`)
- [ ] Test UUID validation if using custom UUID formats

---

## Performance Improvements

Zod v4 eliminates the `ZodEffects` class, moving refinements directly into schemas and introducing `ZodTransform` for dedicated transformation handling. This results in:

- **Faster validation** - Direct schema integration reduces overhead
- **Better tree-shaking** - Unused features are easier to eliminate
- **Improved type inference** - Simpler internal structure

---

## Gradual Migration Strategy

If you have a large codebase, consider this gradual approach:

### Step 1: Install Zod v4

```bash
bun add zod@4
```

### Step 2: Run Tests

Run your entire test suite to identify breaking changes:

```bash
bun test
```

### Step 3: Fix Error Customization First

Search for old error customization patterns:

```typescript
// Search for: invalid_type_error, required_error, errorMap
// Replace with: error parameter
```

### Step 4: Update Error Formatting

Search for legacy error formatting:

```typescript
// Search for: error.format(), error.flatten()
// Replace with: z.treeifyError(error), z.flattenError(error)
```

### Step 5: Update API Methods

Search for deprecated methods:

```typescript
// Search for: .merge(
// Replace with: .extend(
```

### Step 6: Test Number Validation

If you use `.int()` or allow infinite numbers, add tests to verify behavior.

### Step 7: Re-run Tests

Verify all tests pass with Zod v4.

---

## Common Migration Patterns

### Pattern 1: Form Validation Migration

```typescript
// ❌ Zod v3
const FormSchema = z.object({
  email: z.string({
    required_error: "Email required",
    invalid_type_error: "Email must be string"
  }).email({ message: "Invalid email" })
});

// ✅ Zod v4
const FormSchema = z.object({
  email: z.string({
    error: "Email required"
  }).email({
    error: "Invalid email"
  })
});
```

### Pattern 2: API Validation Migration

```typescript
// ❌ Zod v3
const result = schema.safeParse(data);
if (!result.success) {
  const errors = result.error.flatten();
  return { errors: errors.fieldErrors };
}

// ✅ Zod v4
const result = schema.safeParse(data);
if (!result.success) {
  const errors = z.flattenError(result.error);
  return { errors: errors.fieldErrors };
}
```

### Pattern 3: Number Validation Migration

```typescript
// ❌ Zod v3 (Allowed unsafe integers)
const IdSchema = z.number().int();

// ✅ Zod v4 (Explicitly handle large numbers)
const IdSchema = z.number().int(); // Now enforces safe integers

// If you need large integers, use bigint or refine
const IdSchema = z.bigint();
// or
const IdSchema = z.number().refine(Number.isInteger);
```

---

## Version Detection

To check which version of Zod you're using:

```typescript
import { z } from "zod";

// Check for v4 features
if (typeof z.codec === 'function') {
  console.log("Zod v4 detected");
} else {
  console.log("Zod v3 or earlier");
}
```

---

## Rollback Strategy

If you need to rollback to Zod v3:

```bash
# Install last stable v3 version
bun add zod@3.23.8
```

Then revert code changes using version control.

---

**See also:**
- `error-handling.md` for new error formatting methods
- `advanced-patterns.md` for new codec and transform features
