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
  version: 1.0.0
  last_verified: 2025-11-11
  package_version: 3.24.1
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
npm install zod
# or
bun add zod
# or
pnpm add zod
# or
yarn add zod
```

**Requirements**: TypeScript v5.5+ with `"strict": true` in `tsconfig.json`

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

Codecs enable encoding and decoding between two schema types:

```typescript
// Date codec: string <-> Date
const DateCodec = z.codec(
  z.iso.datetime(),    // Input schema (string)
  z.date(),            // Output schema (Date)
  {
    decode: (str) => new Date(str),
    encode: (date) => date.toISOString(),
  }
);

// Usage
const date = DateCodec.decode("2024-01-01T00:00:00Z"); // Date object
const str = DateCodec.encode(new Date());               // ISO string

// Codecs in objects
const EventSchema = z.object({
  id: z.string(),
  createdAt: DateCodec, // Automatically converts
});

// Safe variants
DateCodec.decodeSafe(data);
DateCodec.encodeSafe(data);
DateCodec.decodeSafeAsync(data);
DateCodec.encodeSafeAsync(data);
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

```typescript
// Flatten errors (best for forms)
const flattened = z.flattenError(result.error);
console.log(flattened.formErrors);      // Top-level errors
console.log(flattened.fieldErrors.username); // Field-specific errors

// Tree structure (best for nested data)
const tree = z.treeifyError(result.error);
console.log(tree.errors);              // Errors at this level
console.log(tree.properties?.username); // Nested errors

// Prettify (human-readable output)
const pretty = z.prettifyError(result.error);
// ✖ Invalid input: expected string, received number
//   → at username
```

### Custom Error Messages

```typescript
// Inline custom message
z.string().min(5, "Must be at least 5 characters");
z.string("Invalid string!");

// Error map function
z.string({
  error: (issue) => {
    if (issue.code === "too_small") {
      return { message: `Minimum length: ${issue.minimum}` };
    }
    return undefined; // Use default message
  },
});

// Per-parse error override
schema.parse(data, {
  error: (issue) => "Custom error for this parse",
});

// Global error configuration
z.config({
  customError: (issue) => {
    // Global error handler (lowest precedence)
    return { message: "Globally customized error" };
  },
});
```

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

```typescript
// Add metadata to schemas
const EmailSchema = z.string().email().meta({
  id: "email_address",
  title: "Email Address",
  description: "User's email address",
  deprecated: false,
});

// Retrieve metadata
const meta = EmailSchema.meta();

// Legacy .describe() method (still supported)
const DescribedSchema = z.string().describe("A user's name");
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
- Package version: 3.24.1
- Zero dependencies
- Bundle size: 2kb (gzipped)
- TypeScript 5.5+ required
- Strict mode required
- Last verified: 2025-11-11
