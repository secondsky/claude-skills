# Zod Quick Reference Cheat Sheet

> **Version**: Zod 4.x (4.1.12+)
> **Note**: Some APIs shown here (z.codec, z.iso.*, error helpers) are Zod 4 only

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

## Basic Usage

```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Infer type
type User = z.infer<typeof UserSchema>;

// Parse (throws on error)
const user = UserSchema.parse(data);

// Safe parse (no throw)
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Primitives

| Type | Code |
|------|------|
| String | `z.string()` |
| Number | `z.number()` |
| Boolean | `z.boolean()` |
| Date | `z.date()` |
| BigInt | `z.bigint()` |
| Symbol | `z.symbol()` |
| Null | `z.null()` |
| Undefined | `z.undefined()` |
| Void | `z.void()` |
| Any | `z.any()` |
| Unknown | `z.unknown()` |
| Never | `z.never()` |

## String Validators

| Validator | Code |
|-----------|------|
| Email | `z.string().email()` |
| URL | `z.string().url()` |
| UUID | `z.string().uuid()` |
| Min length | `z.string().min(5)` |
| Max length | `z.string().max(100)` |
| Exact length | `z.string().length(10)` |
| Regex | `z.string().regex(/pattern/)` |
| Starts with | `z.string().startsWith("pre")` |
| Ends with | `z.string().endsWith("suf")` |
| Trim | `z.string().trim()` |
| Lowercase | `z.string().toLowerCase()` |
| Uppercase | `z.string().toUpperCase()` |

## Number Validators

| Validator | Code |
|-----------|------|
| Integer | `z.number().int()` |
| Positive | `z.number().positive()` |
| Non-negative | `z.number().nonnegative()` |
| Negative | `z.number().negative()` |
| Non-positive | `z.number().nonpositive()` |
| Min | `z.number().min(0)` |
| Max | `z.number().max(100)` |
| Greater than | `z.number().gt(0)` |
| Greater/equal | `z.number().gte(0)` |
| Less than | `z.number().lt(100)` |
| Less/equal | `z.number().lte(100)` |
| Multiple of | `z.number().multipleOf(5)` |

## Collections

| Type | Code |
|------|------|
| Array | `z.array(z.string())` |
| Tuple | `z.tuple([z.string(), z.number()])` |
| Object | `z.object({ name: z.string() })` |
| Record | `z.record(z.string())` |
| Map | `z.map(z.string(), z.number())` |
| Set | `z.set(z.string())` |

## Special Types

| Type | Code |
|------|------|
| Enum | `z.enum(["a", "b", "c"])` |
| Literal | `z.literal("value")` |
| Union | `z.union([z.string(), z.number()])` |
| Discriminated Union | `z.discriminatedUnion("type", [...])` |
| Intersection | `z.intersection(schema1, schema2)` |

## Modifiers

| Modifier | Code |
|----------|------|
| Optional | `.optional()` |
| Nullable | `.nullable()` |
| Nullish | `.nullish()` |
| Default | `.default(value)` |
| Catch | `.catch(fallback)` |
| Readonly | `.readonly()` |
| Brand | `.brand<"BrandName">()` |

## Object Methods

| Method | Code |
|--------|------|
| Extend | `.extend({ field: z.string() })` |
| Pick | `.pick({ name: true })` |
| Omit | `.omit({ age: true })` |
| Partial | `.partial()` |
| Required | `.required()` |
| Deep Partial | `.deepPartial()` |
| Merge | `.merge(otherSchema)` |
| Keyof | `.keyof()` |

## Validation

| Method | Code |
|--------|------|
| Refine | `.refine((val) => condition, message)` |
| Super Refine | `.superRefine((data, ctx) => { ... })` |
| Transform | `.transform((val) => newVal)` |
| Pipe | `.pipe(otherSchema)` |

## Parsing

| Method | Returns | Throws? |
|--------|---------|---------|
| `.parse(data)` | `T` | Yes |
| `.safeParse(data)` | `{ success: boolean, data?: T, error?: ZodError }` | No |
| `.parseAsync(data)` | `Promise<T>` | Yes |
| `.safeParseAsync(data)` | `Promise<{...}>` | No |

## Type Inference

```typescript
// Infer output type
type User = z.infer<typeof UserSchema>;

// Get input type (for transforms)
type Input = z.input<typeof Schema>;

// Get output type (for transforms)
type Output = z.output<typeof Schema>;
```

## Error Handling

```typescript
// Flatten errors (for forms)
const flattened = z.flattenError(error);
flattened.formErrors      // Top-level errors
flattened.fieldErrors     // Field-specific errors

// Tree structure (for nested data)
const tree = z.treeifyError(error);
tree.errors              // Current level
tree.properties          // Nested errors

// Pretty print
const pretty = z.prettifyError(error);
```

## Custom Errors

```typescript
// Inline message
z.string().min(5, "Too short!");

// Error map
z.string({
  error: (issue) => {
    if (issue.code === "too_small") {
      return { message: `Min: ${issue.minimum}` };
    }
  },
});

// Per-parse override
schema.parse(data, {
  error: (issue) => "Custom error",
});
```

## Coercion

```typescript
z.coerce.string()    // Convert to string
z.coerce.number()    // Convert to number
z.coerce.boolean()   // Convert to boolean
z.coerce.bigint()    // Convert to bigint
z.coerce.date()      // Convert to Date
```

## Codecs

```typescript
const DateCodec = z.codec(
  z.iso.datetime(),
  z.date(),
  {
    decode: (str) => new Date(str),
    encode: (date) => date.toISOString(),
  }
);

DateCodec.decode("2024-01-01T00:00:00Z");  // Date
DateCodec.encode(new Date());               // string
```

## JSON Schema

```typescript
const jsonSchema = z.toJSONSchema(schema, {
  target: "openapi-3.0",
  metadata: true,
  cycles: "ref",
  reused: "defs",
});
```

## Metadata

```typescript
schema.meta({
  id: "user_email",
  title: "User Email",
  description: "The user's email address",
});

schema.describe("User email");  // Legacy
```

## ISO Formats

```typescript
z.iso.date()       // YYYY-MM-DD
z.iso.time()       // HH:MM:SS
z.iso.datetime()   // ISO 8601 datetime
z.iso.duration()   // ISO 8601 duration
```

## Network Formats

```typescript
z.ipv4()           // IPv4 address
z.ipv6()           // IPv6 address
z.cidrv4()         // IPv4 CIDR
z.cidrv6()         // IPv6 CIDR
```

## Other Formats

```typescript
z.jwt()            // JWT token
z.nanoid()         // Nanoid
z.cuid()           // CUID
z.cuid2()          // CUID2
z.ulid()           // ULID
z.base64()         // Base64
z.hex()            // Hexadecimal
```

## Common Patterns

### Environment Variables
```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
});

const env = EnvSchema.parse(process.env);
```

### API Request
```typescript
const CreateUserRequest = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

const result = CreateUserRequest.safeParse(req.body);
```

### Form Validation
```typescript
const FormSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Too short"),
});
```

### Discriminated Union
```typescript
const Response = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);
```

### Recursive Type
```typescript
interface Node {
  value: string;
  children: Node[];
}

const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.object({
    value: z.string(),
    children: z.array(NodeSchema),
  })
);
```

## Performance Tips

1. Use `z.discriminatedUnion()` instead of `z.union()` when possible
2. Cache schema instances (define at module level)
3. Use `.safeParse()` over `.parse()` to avoid try-catch overhead
4. Lazy load large schemas with `z.lazy()`
5. Use coercion sparingly

## Common Mistakes

❌ Don't recreate schemas on every request
✅ Define schemas at module level

❌ Don't use `.refine()` for transformations
✅ Use `.transform()` for data modifications

❌ Don't ignore TypeScript strict mode
✅ Enable `"strict": true` in tsconfig.json

❌ Don't use `.parse()` for user input without error handling
✅ Use `.safeParse()` and check `result.success`

## Resources

- **Official Docs**: https://zod.dev
- **GitHub**: https://github.com/colinhacks/zod
- **Playground**: https://zod-playground.vercel.app
- **Ecosystem**: https://zod.dev/ecosystem
