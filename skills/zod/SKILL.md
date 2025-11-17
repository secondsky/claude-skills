---
name: zod
description: >
  TypeScript-first schema validation and type inference library.
  Use when: validating API requests/responses, form data, environment variables, or configuration;
  defining type-safe data schemas with runtime validation;
  transforming and refining data with custom logic;
  generating JSON Schema for OpenAPI or AI structured outputs;
  ensuring data integrity with zero dependencies (2kb gzipped);
  working with tRPC, React Hook Form, Prisma, or other ecosystem integrations.
  Prevents errors: missing validation leading to runtime crashes, incorrect type inference,
  unhandled validation errors, improper error message formatting, using outdated patterns,
  inefficient schema composition, missing refinements for business logic, incorrect async validation setup.
license: MIT
metadata:
  version: 2.0.0
  last_verified: 2025-11-17
  package_version: 4.1.12+
  keywords:
    - zod
    - validation
    - schema
    - typescript
    - type-safety
    - runtime-validation
    - type-inference
    - data-validation
    - form-validation
    - api-validation
    - json-schema
    - refinement
    - transformation
    - error-handling
    - parse
    - safeParse
    - z.object
    - z.string
    - z.number
    - z.array
    - z.union
    - z.discriminatedUnion
    - z.refine
    - z.transform
    - z.infer
    - z.coerce
    - z.enum
    - z.literal
    - z.tuple
    - z.record
    - z.intersection
    - z.codec
    - z.toJSONSchema
    - z.treeifyError
    - z.flattenError
    - z.prettifyError
    - z.registry
    - z.globalRegistry
    - .register
    - .meta
    - error-customization
    - localization
    - i18n
    - migration
    - v3-to-v4
    - breaking-changes
    - tRPC
    - prisma-zod
    - react-hook-form
    - trpc
    - environment-variables
    - env-validation
    - config-validation
    - dto
    - type-guard
    - runtime-type-checking
  token_savings: 65%
  errors_prevented: 8
  production_tested: true
  related_skills:
    - react-hook-form-zod
    - typescript-mcp
---

# Zod: TypeScript-First Schema Validation

## Overview

Zod is a TypeScript-first validation library that enables developers to define schemas for validating data at runtime while automatically inferring static TypeScript types. With zero dependencies and a 2kb core bundle (gzipped), Zod provides immutable, composable validation with comprehensive error handling.

## Installation

```bash
bun add zod
# or
npm install zod
# or
pnpm add zod
# or
yarn add zod
```

**Requirements**:
- TypeScript v5.5+ with `"strict": true` in `tsconfig.json`
- Zod 4.x (4.1.12+)

**Important**: This skill documents **Zod 4.x** features. The following APIs require Zod 4 and are NOT available in Zod 3.x:
- `z.codec()` - Bidirectional transformations
- `z.iso.date()`, `z.iso.time()`, `z.iso.datetime()`, `z.iso.duration()` - ISO format validators
- `z.toJSONSchema()` - JSON Schema generation
- `z.treeifyError()`, `z.prettifyError()`, `z.flattenError()` - New error formatting helpers
- `.meta()` - Enhanced metadata (Zod 3.x only has `.describe()`)
- Unified `error` parameter - Replaces `message`, `invalid_type_error`, `required_error`, `errorMap`

For Zod 3.x compatibility or migration guidance, see https://zod.dev

## Migrating from Zod v3 to v4

Zod v4 introduces several breaking changes that improve performance and API consistency. Here are the key changes to be aware of when upgrading:

### 1. Error Customization Unified

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

### 2. Number Validation Stricter

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

### 3. String Format Methods Moved to Top-Level

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

### 4. Object Defaults Behavior Changed

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

### 5. Deprecated APIs Removed or Changed

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

### 6. Function Validation Redesigned

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

### 7. UUID Validation Stricter

**Breaking Change**: UUID validation now follows RFC 9562/4122 specification strictly.

```typescript
// Some previously valid UUIDs may now fail validation
// Ensure UUIDs conform to RFC 9562/4122 format
const uuid = z.uuid().parse("550e8400-e29b-41d4-a716-446655440000"); // ✓
```

### Migration Checklist

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

**Performance Improvements**: Zod v4 eliminates the `ZodEffects` class, moving refinements directly into schemas and introducing `ZodTransform` for dedicated transformation handling. This results in faster validation and better tree-shaking.

## Core Concepts

### Basic Usage Pattern

```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  username: z.string(),
  age: z.number().int().positive(),
  email: z.string().email(),
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;

// Validate data (throws on error)
const user = UserSchema.parse(data);

// Validate data (returns result object)
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed!
} else {
  console.error(result.error); // ZodError
}
```

### Parsing Methods

Use the appropriate parsing method based on error handling needs:

- **`.parse(data)`** - Throws `ZodError` on invalid input; returns strongly-typed data on success
- **`.safeParse(data)`** - Returns `{ success: true, data }` or `{ success: false, error }` (no exceptions)
- **`.parseAsync(data)`** - For schemas with async refinements/transforms
- **`.safeParseAsync(data)`** - Async version that doesn't throw

**Best Practice**: Use `.safeParse()` to avoid try-catch blocks and leverage discriminated unions.

## Primitive Types

### Strings

```typescript
z.string()                    // Basic string
z.string().min(5)            // Minimum length
z.string().max(100)          // Maximum length
z.string().length(10)        // Exact length
z.string().email()           // Email validation
z.string().url()             // URL validation
z.string().uuid()            // UUID format
z.string().regex(/^\d+$/)    // Custom pattern
z.string().startsWith("pre") // Prefix check
z.string().endsWith("suf")   // Suffix check
z.string().trim()            // Auto-trim whitespace
z.string().toLowerCase()     // Auto-lowercase
z.string().toUpperCase()     // Auto-uppercase

// ISO formats (Zod 4+)
z.iso.date()                 // YYYY-MM-DD
z.iso.time()                 // HH:MM:SS
z.iso.datetime()             // ISO 8601 datetime
z.iso.duration()             // ISO 8601 duration

// Network formats
z.ipv4()                     // IPv4 address
z.ipv6()                     // IPv6 address
z.cidrv4()                   // IPv4 CIDR notation
z.cidrv6()                   // IPv6 CIDR notation

// Other formats
z.jwt()                      // JWT token
z.nanoid()                   // Nanoid
z.cuid()                     // CUID
z.cuid2()                    // CUID2
z.ulid()                     // ULID
z.base64()                   // Base64 encoded
z.hex()                      // Hexadecimal
```

### Numbers

```typescript
z.number()                   // Basic number
z.number().int()             // Integer only
z.number().positive()        // > 0
z.number().nonnegative()     // >= 0
z.number().negative()        // < 0
z.number().nonpositive()     // <= 0
z.number().min(0)            // Minimum value
z.number().max(100)          // Maximum value
z.number().gt(0)             // Greater than
z.number().gte(0)            // Greater than or equal
z.number().lt(100)           // Less than
z.number().lte(100)          // Less than or equal
z.number().multipleOf(5)     // Must be multiple of 5
z.int()                      // Shorthand for z.number().int()
z.int32()                    // 32-bit integer
z.nan()                      // NaN value
```

### Coercion (Type Conversion)

```typescript
z.coerce.string()            // Convert to string
z.coerce.number()            // Convert to number
z.coerce.boolean()           // Convert to boolean
z.coerce.bigint()            // Convert to bigint
z.coerce.date()              // Convert to Date

// Example: Parse query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().max(100).default(10),
});

// "?page=5&limit=20" -> { page: 5, limit: 20 }
```

### Other Primitives

```typescript
z.boolean()                  // Boolean
z.date()                     // Date object
z.date().min(new Date("2020-01-01"))
z.date().max(new Date("2030-12-31"))
z.bigint()                   // BigInt
z.symbol()                   // Symbol
z.null()                     // Null
z.undefined()                // Undefined
z.void()                     // Void (undefined)
```

## Complex Types

### Objects

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }),
});

type Person = z.infer<typeof PersonSchema>;

// Object methods
PersonSchema.shape                 // Access shape
PersonSchema.keyof()              // Get union of keys
PersonSchema.extend({ role: z.string() })  // Add fields
PersonSchema.pick({ name: true }) // Pick specific fields
PersonSchema.omit({ age: true })  // Omit fields
PersonSchema.partial()            // Make all fields optional
PersonSchema.required()           // Make all fields required
PersonSchema.deepPartial()        // Recursively optional

// Strict vs loose objects
z.strictObject({ ... })           // No extra keys allowed (throws)
z.object({ ... })                 // Strips extra keys (default)
z.looseObject({ ... })            // Allows extra keys
```

### Arrays

```typescript
z.array(z.string())              // String array
z.array(z.number()).min(1)       // At least 1 element
z.array(z.number()).max(10)      // At most 10 elements
z.array(z.number()).length(5)    // Exactly 5 elements
z.array(z.number()).nonempty()   // At least 1 element

// Nested arrays
z.array(z.array(z.number()))     // number[][]
```

### Tuples

```typescript
z.tuple([z.string(), z.number()]) // [string, number]
z.tuple([z.string(), z.number()]).rest(z.boolean()) // [string, number, ...boolean[]]
```

### Enums and Literals

```typescript
// Enum
const RoleEnum = z.enum(["admin", "user", "guest"]);
type Role = z.infer<typeof RoleEnum>; // "admin" | "user" | "guest"

// Literal values
z.literal("exact_value")
z.literal(42)
z.literal(true)

// Native TypeScript enum
enum Fruits {
  Apple,
  Banana,
}
z.nativeEnum(Fruits)

// Enum methods
RoleEnum.enum.admin              // "admin"
RoleEnum.exclude(["guest"])      // Exclude values
RoleEnum.extract(["admin", "user"]) // Include only
```

### Unions

```typescript
// Basic union
z.union([z.string(), z.number()])

// Discriminated union (better performance & type inference)
const ResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

type Response = z.infer<typeof ResponseSchema>;
// { status: "success", data: any } | { status: "error", message: string }
```

### Intersections

```typescript
const BaseSchema = z.object({ id: z.string() });
const ExtendedSchema = z.object({ name: z.string() });

const Combined = z.intersection(BaseSchema, ExtendedSchema);
// Equivalent to: z.object({ id: z.string(), name: z.string() })
```

### Records and Maps

```typescript
// Record: object with typed keys and values
z.record(z.string())             // { [key: string]: string }
z.record(z.string(), z.number()) // { [key: string]: number }

// Partial record (some keys optional)
z.partialRecord(z.enum(["a", "b"]), z.string())

// Map
z.map(z.string(), z.number())    // Map<string, number>
z.set(z.string())                // Set<string>
```

## Advanced Patterns

### Refinements (Custom Validation)

```typescript
// Basic refinement
const PasswordSchema = z.string().refine(
  (val) => val.length >= 8,
  { message: "Password must be at least 8 characters" }
);

// Multiple refinements
const SafePasswordSchema = z.string()
  .refine((val) => val.length >= 8, "Too short")
  .refine((val) => /[A-Z]/.test(val), "Must contain uppercase")
  .refine((val) => /[0-9]/.test(val), "Must contain number");

// SuperRefine (multiple issues at once)
const UserSchema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords must match",
    });
  }
});

// Async refinement
const UsernameSchema = z.string().refine(
  async (username) => {
    const exists = await checkUsernameExists(username);
    return !exists;
  },
  { message: "Username already taken" }
);
```

### Transformations

```typescript
// Transform data during parsing
const StringToNumberSchema = z.string().transform((val) => parseInt(val));
const result = StringToNumberSchema.parse("123"); // 123 (number)

// Chained transformations
const TrimAndLowercaseSchema = z.string()
  .transform((val) => val.trim())
  .transform((val) => val.toLowerCase());

// Pipe (combine schemas with transformation)
const NumberStringSchema = z.string().pipe(z.coerce.number());
```

### Codecs (Bidirectional Transformations)

**New in Zod v4.1**: Codecs enable bidirectional transformations between two schemas, perfect for handling data at network boundaries or converting between different representations.

#### What Are Codecs?

Unlike `.transform()` which is unidirectional (input → output), codecs define transformations in both directions:
- **Forward (decode)**: Convert from input format to output format
- **Backward (encode)**: Convert from output format back to input format

All Zod schemas support both directions via `.decode()` and `.encode()` methods.

#### Basic Example: Date Codec

```typescript
// String <-> Date codec
const DateCodec = z.codec(
  z.iso.datetime(),    // Input schema (ISO string)
  z.date(),            // Output schema (Date object)
  {
    decode: (str) => new Date(str),      // String → Date
    encode: (date) => date.toISOString(), // Date → String
  }
);

// Decode: string → Date
const date = DateCodec.decode("2024-01-01T00:00:00Z");
console.log(date instanceof Date); // true

// Encode: Date → string
const isoString = DateCodec.encode(new Date());
console.log(typeof isoString); // "string"
```

#### Type Safety

Unlike `.parse()` which accepts `unknown`, codec methods require strongly-typed inputs:

```typescript
const DateCodec = z.codec(z.iso.datetime(), z.date(), {
  decode: (str) => new Date(str),
  encode: (date) => date.toISOString(),
});

// ✓ Type-safe decode (expects string)
DateCodec.decode("2024-01-01T00:00:00Z");

// ✗ Type error: number is not assignable to string
DateCodec.decode(123456789);

// ✓ Type-safe encode (expects Date)
DateCodec.encode(new Date());

// ✗ Type error: string is not assignable to Date
DateCodec.encode("2024-01-01");
```

#### Safe Variants (No Exceptions)

Codecs provide safe methods that return result objects instead of throwing:

```typescript
// Safe decode
const decodeResult = DateCodec.decodeSafe("2024-01-01T00:00:00Z");
if (decodeResult.success) {
  console.log(decodeResult.data); // Date object
} else {
  console.error(decodeResult.error); // ZodError
}

// Safe encode
const encodeResult = DateCodec.encodeSafe(new Date());
if (encodeResult.success) {
  console.log(encodeResult.data); // ISO string
} else {
  console.error(encodeResult.error); // ZodError
}

// Async safe variants
await DateCodec.decodeAsync(data);
await DateCodec.decodeSafeAsync(data);
await DateCodec.encodeAsync(data);
await DateCodec.encodeSafeAsync(data);
```

#### Composability

Codecs work seamlessly within objects, arrays, and other schemas:

```typescript
const EventSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: DateCodec,     // Automatically handles conversion
  updatedAt: DateCodec,
  metadata: z.record(z.string()),
});

// When parsing API response (JSON with ISO strings)
const event = EventSchema.decode({
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Launch Event",
  createdAt: "2024-01-01T00:00:00Z",  // String → Date
  updatedAt: "2024-01-02T00:00:00Z",  // String → Date
  metadata: { location: "Online" },
});

console.log(event.createdAt instanceof Date); // true

// When sending to API (Date objects → ISO strings)
const payload = EventSchema.encode({
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Launch Event",
  createdAt: new Date("2024-01-01"),  // Date → String
  updatedAt: new Date("2024-01-02"),  // Date → String
  metadata: { location: "Online" },
});

console.log(typeof payload.createdAt); // "string"
```

#### Common Codec Patterns

```typescript
// 1. JSON String Codec
const JSONCodec = <T extends z.ZodTypeAny>(schema: T) =>
  z.codec(
    z.string(),
    schema,
    {
      decode: (str) => JSON.parse(str),
      encode: (obj) => JSON.stringify(obj),
    }
  );

const UserJSONCodec = JSONCodec(z.object({
  name: z.string(),
  age: z.number(),
}));

// 2. Base64 Codec
const Base64Codec = z.codec(
  z.string(),
  z.instanceof(Uint8Array),
  {
    decode: (base64) => Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
    encode: (bytes) => btoa(String.fromCharCode(...bytes)),
  }
);

// 3. URL Search Params Codec
const QueryParamsCodec = <T extends z.ZodTypeAny>(schema: T) =>
  z.codec(
    z.string(),
    schema,
    {
      decode: (queryString) => {
        const params = new URLSearchParams(queryString);
        return Object.fromEntries(params.entries());
      },
      encode: (obj) => new URLSearchParams(obj).toString(),
    }
  );

// 4. Milliseconds <-> Seconds Codec
const SecondsCodec = z.codec(
  z.number().int().nonnegative(), // Input: seconds
  z.number().int().nonnegative(), // Output: milliseconds
  {
    decode: (seconds) => seconds * 1000,
    encode: (ms) => Math.floor(ms / 1000),
  }
);
```

#### When to Use Codecs

**Use codecs when**:
- Parsing data at network boundaries (API requests/responses)
- Converting between storage and runtime formats
- Handling serialization/deserialization (JSON, Base64, etc.)
- Working with timestamps in different units
- Need bidirectional type-safe conversions

**Use `.transform()` when**:
- One-way transformation is sufficient
- Don't need to convert back to original format
- Simpler use case without encode/decode symmetry

#### Practical Example: API Client

```typescript
// Define API schema with codecs
const UserAPISchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.codec(
    z.iso.datetime(),
    z.date(),
    {
      decode: (str) => new Date(str),
      encode: (date) => date.toISOString(),
    }
  ),
  lastLogin: z.codec(
    z.iso.datetime(),
    z.date(),
    {
      decode: (str) => new Date(str),
      encode: (date) => date.toISOString(),
    }
  ).nullable(),
});

// Fetch from API (JSON → TypeScript objects)
async function getUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const json = await response.json();
  return UserAPISchema.decode(json); // Dates are Date objects
}

// Send to API (TypeScript objects → JSON)
async function updateUser(user: z.output<typeof UserAPISchema>) {
  const payload = UserAPISchema.encode(user); // Dates are ISO strings
  await fetch(`/api/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
```

### Recursive Types

```typescript
interface Category {
  name: string;
  subcategories: Category[];
}

const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema),
  })
);
```

### Optional, Nullable, and Default Values

```typescript
z.string().optional()            // string | undefined
z.string().nullable()            // string | null
z.string().nullish()             // string | null | undefined
z.string().default("default")    // Provides default if undefined
z.string().catch("fallback")     // Provides fallback on error

// Prefault (default before parsing)
z.coerce.number().prefault(0)

// Remove undefined/null (opposite of optional/nullable)
z.string().optional().unwrap()   // Back to z.string()
```

### Readonly

```typescript
const ReadonlyUserSchema = z.object({
  name: z.string(),
  age: z.number(),
}).readonly();

type ReadonlyUser = z.infer<typeof ReadonlyUserSchema>;
// { readonly name: string; readonly age: number }
```

### Brand (Nominal Typing)

```typescript
const UserId = z.string().brand<"UserId">();
const ProductId = z.string().brand<"ProductId">();

type UserId = z.infer<typeof UserId>;       // string & Brand<"UserId">
type ProductId = z.infer<typeof ProductId>; // string & Brand<"ProductId">

// TypeScript prevents mixing them
function getUser(id: UserId) { /* ... */ }
const userId = UserId.parse("user-123");
const productId = ProductId.parse("prod-456");

getUser(userId);     // ✓ OK
getUser(productId);  // ✗ Type error!
```

## Error Handling

### Error Structure

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  // ZodError structure
  result.error.issues.forEach((issue) => {
    console.log(issue.code);      // Error type
    console.log(issue.path);      // Field path
    console.log(issue.message);   // Error message
  });
}
```

### Error Formatting

Zod v4 provides three powerful utilities for formatting `ZodError` objects into more usable formats.

#### z.flattenError() - Best for Flat Schemas and Forms

Converts errors into a flat object structure with top-level and field-specific errors:

```typescript
const FormSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().positive(),
});

const result = FormSchema.safeParse({
  username: "ab",
  email: "not-an-email",
  age: -5,
});

if (!result.success) {
  const flattened = z.flattenError(result.error);

  console.log(flattened.formErrors);
  // [] - No top-level errors

  console.log(flattened.fieldErrors);
  /*
  {
    username: ["String must contain at least 3 character(s)"],
    email: ["Invalid email"],
    age: ["Number must be greater than 0"]
  }
  */

  // Access specific field errors
  console.log(flattened.fieldErrors.username);
  // ["String must contain at least 3 character(s)"]
}
```

**When to use**: Single-level schemas, form validation, displaying field-specific errors in UI.

#### z.treeifyError() - Best for Nested Data Structures

Converts errors into a nested tree mirroring your schema structure:

```typescript
const NestedSchema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
    settings: z.object({
      notifications: z.boolean(),
    }),
  }),
  posts: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })),
});

const result = NestedSchema.safeParse({
  user: {
    profile: {
      name: "",
      email: "invalid",
    },
    settings: {
      notifications: "yes", // Should be boolean
    },
  },
  posts: [
    { title: "Post 1", content: 123 }, // Content should be string
  ],
});

if (!result.success) {
  const tree = z.treeifyError(result.error);

  // Tree structure mirrors schema
  console.log(tree.errors);
  // [] - No errors at root level

  // Navigate nested errors with optional chaining (IMPORTANT!)
  console.log(tree.properties?.user?.properties?.profile?.properties?.name?.errors);
  // ["String must contain at least 1 character(s)"]

  console.log(tree.properties?.user?.properties?.profile?.properties?.email?.errors);
  // ["Invalid email"]

  console.log(tree.properties?.user?.properties?.settings?.properties?.notifications?.errors);
  // ["Expected boolean, received string"]

  // Array errors use 'items' property
  console.log(tree.properties?.posts?.items?.[0]?.properties?.content?.errors);
  // ["Expected string, received number"]
}
```

**Tree Structure**:
```typescript
interface ErrorTree {
  errors: string[];              // Errors at current level
  properties?: {                 // Object property errors
    [key: string]: ErrorTree;
  };
  items?: ErrorTree[];           // Array item errors
}
```

**Best Practice**: Always use optional chaining (`?.`) when accessing nested tree properties to prevent runtime errors.

**When to use**: Nested schemas, complex data structures, displaying errors next to nested form fields.

#### z.prettifyError() - Best for Debugging and Logging

Generates a human-readable string representation of all validation errors:

```typescript
const UserSchema = z.object({
  profile: z.object({
    username: z.string().min(3),
    email: z.string().email(),
  }),
  favoriteNumbers: z.array(z.number()),
});

const result = UserSchema.safeParse({
  profile: {
    username: "ab",
    email: "not-email",
  },
  favoriteNumbers: ["one", "two"],
});

if (!result.success) {
  const pretty = z.prettifyError(result.error);
  console.log(pretty);
}

/*
Output:
✖ String must contain at least 3 character(s)
  → at profile.username

✖ Invalid email
  → at profile.email

✖ Expected number, received string
  → at favoriteNumbers[0]

✖ Expected number, received string
  → at favoriteNumbers[1]
*/
```

**When to use**: Development logging, error debugging, console output, error monitoring services.

#### Comparison Table

| Method | Best For | Output Type | Nested Support |
|--------|----------|-------------|----------------|
| `z.flattenError()` | Forms, single-level schemas | Object `{ formErrors, fieldErrors }` | No |
| `z.treeifyError()` | Nested data, complex structures | Tree object | Yes |
| `z.prettifyError()` | Debugging, logging | String | Yes |

#### Legacy Methods (Deprecated)

```typescript
// ❌ Zod v3 (Deprecated in v4)
error.format();   // Use z.treeifyError(error) instead
error.flatten();  // Use z.flattenError(error) instead

// ✅ Zod v4
z.treeifyError(error);
z.flattenError(error);
```

### Custom Error Messages

Zod v4 unifies error customization with the `error` parameter, replacing the fragmented `message`, `invalid_type_error`, `required_error`, and `errorMap` options from v3.

#### Three-Level Error Customization System

Zod provides three levels of error customization with clear precedence:

```typescript
// 1. SCHEMA-LEVEL (Highest Priority)
// Define custom messages when creating schemas
const NameSchema = z.string({
  error: "Name must be a string",
});

const EmailSchema = z.string().email({
  error: (issue) => {
    if (issue.code === "invalid_string") {
      return { message: "Please provide a valid email address" };
    }
  },
});

const AgeSchema = z.number().min(18, {
  error: "Must be at least 18 years old",
});

// 2. PER-PARSE LEVEL (Medium Priority)
// Override errors for a specific parse call
const result = UserSchema.parse(data, {
  error: (issue) => {
    // Custom error logic for this specific parse
    return { message: `Validation failed at ${issue.path.join('.')}` };
  },
});

// 3. GLOBAL LEVEL (Lowest Priority)
// Set application-wide error defaults
z.config({
  customError: (issue) => {
    // Global error handler - applies when schema/parse don't specify
    return { message: `Global error: ${issue.code}` };
  },
});
```

#### Error Function Parameters

Error customization functions receive an issue context object with detailed information:

```typescript
z.string().min(5, {
  error: (issue) => {
    // Available properties:
    console.log(issue.code);      // Error type (e.g., "too_small")
    console.log(issue.input);     // The data being validated
    console.log(issue.inst);      // The schema instance
    console.log(issue.path);      // Path in nested structures

    // Type-specific properties
    if (issue.code === "too_small") {
      console.log(issue.minimum);   // The minimum value
      console.log(issue.inclusive); // Whether minimum is inclusive
    }

    // Return undefined to defer to next handler in precedence chain
    return undefined;
  },
});
```

#### Quick Examples

```typescript
// Simple string message
z.string().min(5, "Must be at least 5 characters");
z.string("Invalid string!");

// Conditional error messages
z.string({
  error: (issue) => {
    if (issue.code === "too_small") {
      return { message: `Minimum length: ${issue.minimum}` };
    }
    if (issue.code === "invalid_type") {
      return { message: `Expected string, got ${issue.received}` };
    }
    return undefined; // Use default message
  },
});

// Include input data in errors (disabled by default for security)
schema.parse(data, {
  reportInput: true, // Now error.issues will include input data
  error: (issue) => ({
    message: `Invalid value: ${JSON.stringify(issue.input)}`,
  }),
});
```

#### Localization Support

Zod v4 includes built-in support for 40+ locales:

```typescript
import { z } from "zod";

// Set global locale
z.config(z.locales.en());  // English (default)
z.config(z.locales.es());  // Spanish
z.config(z.locales.fr());  // French
z.config(z.locales.de());  // German
z.config(z.locales.ja());  // Japanese
z.config(z.locales.zh());  // Chinese
// ... and 34+ more locales

// Per-parse locale override
const result = schema.parse(data, {
  locale: z.locales.es(),
});

// Custom i18n integration
z.config({
  customError: (issue) => ({
    message: t(`validation.${issue.code}`, issue),
  }),
});
```

**Available Locales**: `ar`, `bg`, `cs`, `da`, `de`, `el`, `en`, `es`, `et`, `fa`, `fi`, `fr`, `he`, `hi`, `hr`, `hu`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `nb`, `nl`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `th`, `tr`, `uk`, `vi`, `zh`, `zh-TW`

## Type Inference

```typescript
// Basic inference
const UserSchema = z.object({ name: z.string() });
type User = z.infer<typeof UserSchema>; // { name: string }

// Input vs Output types (for transforms)
const TransformSchema = z.string().transform((s) => s.length);
type Input = z.input<typeof TransformSchema>;   // string
type Output = z.output<typeof TransformSchema>; // number
```

## JSON Schema Conversion

Generate JSON Schema from Zod schemas for OpenAPI, AI structured outputs, or documentation:

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive(),
  role: z.enum(["admin", "user"]),
});

// Convert to JSON Schema
const jsonSchema = z.toJSONSchema(UserSchema);
/*
{
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    age: { type: "number", minimum: 0, exclusiveMinimum: true },
    role: { type: "string", enum: ["admin", "user"] }
  },
  required: ["id", "email", "age", "role"],
  additionalProperties: false
}
*/

// Options
z.toJSONSchema(schema, {
  target: "openapi-3.0",           // Target version
  metadata: true,                  // Include .meta() data
  cycles: "ref",                   // Handle recursive schemas
  reused: "defs",                  // Extract repeated schemas
  io: "input",                     // Use input types instead of output
  unrepresentable: "any",          // Handle unsupported types
});
```

## Metadata

Zod v4 provides a powerful metadata system for associating additional information with schemas, useful for documentation, code generation, AI structured outputs, and form validation.

### Global Registry (Quick Start)

The easiest way to add metadata is using the global registry:

```typescript
// Add metadata with .meta()
const EmailSchema = z.string().email().meta({
  id: "email_address",
  title: "Email Address",
  description: "User's email address",
  deprecated: false,
  // Add any custom fields
  placeholder: "user@example.com",
  helpText: "We'll never share your email",
});

// Retrieve metadata
const meta = EmailSchema.meta();
console.log(meta.title); // "Email Address"

// .meta() without arguments retrieves existing metadata
const existingMeta = EmailSchema.meta();

// Legacy .describe() method (still supported for Zod 3 compatibility)
const DescribedSchema = z.string().describe("A user's name");
// Equivalent to: z.string().meta({ description: "A user's name" })
```

### Global Metadata Interface

The global registry accepts this interface by default:

```typescript
interface GlobalMeta {
  id?: string;
  title?: string;
  description?: string;
  deprecated?: boolean;
  [k: string]: unknown; // Any additional custom fields
}

// Extend with TypeScript declaration merging for type safety
declare module "zod" {
  interface GlobalMeta {
    placeholder?: string;
    helpText?: string;
    uiComponent?: "input" | "textarea" | "select";
  }
}

// Now TypeScript knows about custom fields
const schema = z.string().meta({
  placeholder: "Enter text...",
  uiComponent: "textarea", // Autocomplete works!
});
```

### Custom Registries

For advanced use cases, create custom registries with strongly-typed metadata:

```typescript
// Define custom metadata type
interface FormFieldMeta {
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: {
    showOnChange?: boolean;
    showOnBlur?: boolean;
  };
}

// Create typed registry
const formRegistry = z.registry<FormFieldMeta>();

// Register schemas with metadata
const UsernameSchema = z.string().min(3).max(20);
formRegistry.add(UsernameSchema, {
  label: "Username",
  placeholder: "Choose a username",
  helpText: "3-20 characters, alphanumeric only",
  validation: {
    showOnBlur: true,
  },
});

// Check if schema exists
if (formRegistry.has(UsernameSchema)) {
  // Retrieve metadata
  const meta = formRegistry.get(UsernameSchema);
  console.log(meta.label); // "Username"
}

// Remove schema from registry
formRegistry.remove(UsernameSchema);

// Clear entire registry
formRegistry.clear();
```

### .register() Method

The `.register()` method adds metadata and returns the original schema (not a new instance):

```typescript
const EmailSchema = z.string().email().register({
  title: "Email Address",
  description: "User's email address",
});

// Returns the same schema instance, allowing inline registration
const UserSchema = z.object({
  email: z.string().email().register({
    id: "user_email",
    title: "Email",
  }),
  name: z.string().register({
    id: "user_name",
    title: "Full Name",
  }),
});
```

### Advanced: Inferred Types in Metadata

Reference schema types within metadata using `z.$input` and `z.$output`:

```typescript
const TransformSchema = z.string().transform((s) => s.length);

const registry = z.registry<{
  description: string;
  // Use schema's input/output types
  exampleInput?: z.$input<typeof TransformSchema>;
  exampleOutput?: z.$output<typeof TransformSchema>;
}>();

registry.add(TransformSchema, {
  description: "Converts string to length",
  exampleInput: "hello",    // Type: string
  exampleOutput: 5,         // Type: number
});
```

### Advanced: Schema Type Constraints

Restrict which schema types can be registered in a custom registry:

```typescript
// Only allow string schemas
const stringRegistry = z.registry<
  { label: string },
  z.ZodString
>();

const nameSchema = z.string();
stringRegistry.add(nameSchema, { label: "Name" }); // ✓ OK

const ageSchema = z.number();
stringRegistry.add(ageSchema, { label: "Age" }); // ✗ Type error!
```

### Metadata for JSON Schema Generation

Metadata integrates seamlessly with `z.toJSONSchema()`:

```typescript
const UserSchema = z.object({
  email: z.string().email().meta({
    title: "Email Address",
    description: "The user's email",
    examples: ["user@example.com"],
  }),
  age: z.number().int().positive().meta({
    title: "Age",
    description: "User's age in years",
    minimum: 1,
    maximum: 120,
  }),
});

// Include metadata in JSON Schema output
const jsonSchema = z.toJSONSchema(UserSchema, {
  metadata: true, // ← Includes .meta() data
});

/*
{
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      title: "Email Address",
      description: "The user's email",
      examples: ["user@example.com"]
    },
    age: {
      type: "number",
      title: "Age",
      description: "User's age in years",
      minimum: 1,
      maximum: 120
    }
  },
  required: ["email", "age"]
}
*/
```

## Functions

Validate function inputs and outputs:

```typescript
const AddFunction = z.function()
  .args(z.number(), z.number())  // Arguments
  .returns(z.number());           // Return type

// Implement typed function
const add = AddFunction.implement((a, b) => {
  return a + b; // Type-checked!
});

// Async functions
const FetchFunction = z.function()
  .args(z.string())
  .returns(z.promise(z.object({ data: z.any() })))
  .implementAsync(async (url) => {
    const response = await fetch(url);
    return response.json();
  });
```

## Common Patterns

### Environment Variables

```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(32),
});

// Validate on startup
const env = EnvSchema.parse(process.env);

// Now use typed env
console.log(env.PORT); // number
```

### API Request Validation

```typescript
const CreateUserRequest = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().positive().optional(),
});

// Express example
app.post("/users", async (req, res) => {
  const result = CreateUserRequest.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: z.flattenError(result.error).fieldErrors,
    });
  }

  const user = await createUser(result.data);
  res.json(user);
});
```

### Form Validation

```typescript
const FormSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
  age: z.coerce.number().int().min(18, "Must be 18+"),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "Must accept terms" }),
  }),
});

type FormData = z.infer<typeof FormSchema>;
```

### Partial Updates

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// For PATCH requests: make everything optional except id
const UpdateUserSchema = UserSchema.partial().required({ id: true });

type UpdateUser = z.infer<typeof UpdateUserSchema>;
// { id: string; name?: string; email?: string }
```

### Composable Schemas

```typescript
// Base schemas
const TimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

const AuthorSchema = z.object({
  authorId: z.string(),
  authorName: z.string(),
});

// Compose into larger schemas
const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
}).merge(TimestampSchema).merge(AuthorSchema);
```

## Ecosystem Integration

### ESLint Plugins

**eslint-plugin-zod-x** (40 stars) - Enforces Zod best practices:
- `zod-x/no-missing-error-messages` - Ensure custom error messages
- `zod-x/prefer-enum` - Prefer z.enum() over z.union() of literals
- `zod-x/require-strict` - Enforce strict object schemas

**eslint-plugin-import-zod** (46 stars) - Enforces namespace imports:
```typescript
// Enforced style
import { z } from "zod";

// Disallowed
import * as z from "zod";
```

### Popular Integrations

**tRPC** (38,863 stars) - End-to-end typesafe APIs:
```typescript
import { z } from "zod";
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return db.user.findUnique({ where: { id: input.id } });
    }),
});
```

**React Hook Form** (with react-hook-form-zod skill):
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const { register, handleSubmit } = useForm({
  resolver: zodResolver(FormSchema),
});
```

**Prisma** (via prisma-zod-generator):
```prisma
generator zod {
  provider = "zod-prisma-types"
  output   = "./zod"
}
```

**NestJS** (via nestjs-zod):
- Automatic DTO generation
- OpenAPI documentation
- Validation pipes

### Code Generation Tools

- **orval** (4,848 stars) - Generate Zod from OpenAPI
- **Hey API** (3,497 stars) - OpenAPI to TypeScript + Zod
- **kubb** (1,416 stars) - API toolkit with Zod codegen

## Known Issues & Solutions

### 1. TypeScript Strict Mode Required
**Issue**: Zod requires TypeScript strict mode (`"strict": true`).
**Solution**: Enable strict mode in `tsconfig.json`. If impossible, manually enable `strictNullChecks`.

### 2. Large Schema Bundle Size
**Issue**: Complex schemas can increase bundle size.
**Solution**: Use lazy loading for large schemas: `z.lazy(() => Schema)`. Consider code splitting.

### 3. Async Refinements Performance
**Issue**: Async refinements (e.g., database checks) can be slow.
**Solution**: Use caching, debouncing, or move expensive checks to background jobs.

### 4. Error Message Localization
**Issue**: Default error messages are English-only.
**Solution**: Use custom error maps with i18n libraries:
```typescript
z.config({
  customError: (issue) => ({
    message: t(`validation.${issue.code}`, issue),
  }),
});
```

### 5. Circular Dependencies
**Issue**: Self-referential types can cause TypeScript errors.
**Solution**: Use `z.lazy()`:
```typescript
const Node: z.ZodType<Node> = z.lazy(() =>
  z.object({ children: z.array(Node) })
);
```

### 6. Union Type Performance
**Issue**: Large unions can slow down parsing.
**Solution**: Use `z.discriminatedUnion()` instead of `z.union()` when possible—much faster type narrowing.

### 7. Default Values Not Applied on Undefined
**Issue**: `.default()` only applies when value is undefined, not for null or invalid types.
**Solution**: Use `.catch()` for fallback on any error, or `.nullish().default()` for null handling.

### 8. Transform vs Refine Confusion
**Issue**: Using `.refine()` when `.transform()` is needed (or vice versa).
**Solution**:
- Use `.refine()` for validation only (returns boolean)
- Use `.transform()` to modify the data
- Transforms are unidirectional; use `.codec()` for bidirectional

## Performance Tips

1. **Use `.discriminatedUnion()` instead of `.union()`** - Faster parsing and better type inference
2. **Lazy load large schemas** - Use `z.lazy()` for schemas that aren't always needed
3. **Coerce sparingly** - Coercion adds overhead; prefer explicit parsing
4. **Cache schema instances** - Don't recreate schemas on every request
5. **Use `.safeParse()` over `.parse()`** - Avoids expensive try-catch
6. **Avoid deep nesting** - Flatten schemas when possible for better performance

## Best Practices

1. **Define schemas at module level** - Reuse schema instances
2. **Use `.safeParse()` for user input** - Better error handling
3. **Leverage type inference** - Let Zod generate types: `type User = z.infer<typeof UserSchema>`
4. **Add custom error messages** - Improve UX with clear, actionable errors
5. **Use discriminated unions** - Better performance and type narrowing
6. **Validate early** - Check data at system boundaries (API, forms, env vars)
7. **Compose small schemas** - Build complex schemas from reusable pieces
8. **Document with `.meta()`** - Add descriptions for better DX and JSON Schema generation
9. **Test schemas thoroughly** - Validate edge cases and error messages
10. **Use codecs for serialization** - Bidirectional transforms for dates, URLs, etc.

## Quick Reference

```typescript
// Primitives
z.string(), z.number(), z.boolean(), z.date(), z.bigint()

// Collections
z.array(), z.tuple(), z.object(), z.record(), z.map(), z.set()

// Special types
z.enum(), z.union(), z.discriminatedUnion(), z.intersection()
z.literal(), z.any(), z.unknown(), z.never()

// Modifiers
.optional(), .nullable(), .nullish(), .default(), .catch()
.readonly(), .brand()

// Validation
.min(), .max(), .length(), .regex(), .email(), .url(), .uuid()
.refine(), .superRefine()

// Transformation
.transform(), .pipe(), .codec()

// Parsing
.parse(), .safeParse(), .parseAsync(), .safeParseAsync()

// Type inference
z.infer<typeof Schema>, z.input<typeof Schema>, z.output<typeof Schema>

// Error handling
z.flattenError(), z.treeifyError(), z.prettifyError()

// JSON Schema
z.toJSONSchema(schema, options)

// Metadata
.meta(), .describe()

// Object methods
.extend(), .pick(), .omit(), .partial(), .required(), .merge()
```

## Additional Resources

- **Official Docs**: https://zod.dev
- **GitHub**: https://github.com/colinhacks/zod
- **TypeScript Playground**: https://zod-playground.vercel.app
- **ESLint Plugin (Best Practices)**: https://github.com/JoshuaKGoldberg/eslint-plugin-zod-x
- **tRPC Integration**: https://trpc.io
- **Ecosystem**: https://zod.dev/ecosystem

---

**Production Notes**:
- Package version: 4.1.12+ (Zod 4.x stable)
- Zero dependencies
- Bundle size: 2kb (gzipped)
- TypeScript 5.5+ required
- Strict mode required
- Last verified: 2025-11-17
- Skill version: 2.0.0 (Updated with v4.1 enhancements)

**What's New in This Version**:
- ✨ Comprehensive v3 to v4 migration guide with breaking changes
- ✨ Enhanced error customization with three-level system
- ✨ Expanded metadata API with registry system
- ✨ Improved error formatting with practical examples
- ✨ Built-in localization support for 40+ locales
- ✨ Detailed codec documentation with real-world patterns
- ✨ Performance improvements and architectural changes explained
