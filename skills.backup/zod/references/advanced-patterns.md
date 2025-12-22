# Zod Advanced Patterns Guide

Complete guide for advanced Zod validation patterns including refinements, transformations, codecs, and recursive types.

**Last Updated**: 2025-11-17

---

## Refinements (Custom Validation)

Refinements allow you to add custom validation logic beyond Zod's built-in validators.

### Basic Refinement

```typescript
const PasswordSchema = z.string().refine(
  (val) => val.length >= 8,
  { message: "Password must be at least 8 characters" }
);
```

### Multiple Refinements

```typescript
const SafePasswordSchema = z.string()
  .refine((val) => val.length >= 8, "Too short")
  .refine((val) => /[A-Z]/.test(val), "Must contain uppercase")
  .refine((val) => /[0-9]/.test(val), "Must contain number");
```

### SuperRefine (Multiple Issues at Once)

```typescript
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
```

### Async Refinement

```typescript
const UsernameSchema = z.string().refine(
  async (username) => {
    const exists = await checkUsernameExists(username);
    return !exists;
  },
  { message: "Username already taken" }
);
```

---

## Transformations

Transformations allow you to modify data during parsing.

### Basic Transform

```typescript
// Transform data during parsing
const StringToNumberSchema = z.string().transform((val) => parseInt(val));
const result = StringToNumberSchema.parse("123"); // 123 (number)
```

### Chained Transformations

```typescript
const TrimAndLowercaseSchema = z.string()
  .transform((val) => val.trim())
  .transform((val) => val.toLowerCase());
```

### Pipe (Combine Schemas with Transformation)

```typescript
const NumberStringSchema = z.string().pipe(z.coerce.number());
```

---

## Codecs (Bidirectional Transformations)

**New in Zod v4.1**: Codecs enable bidirectional transformations between two schemas, perfect for handling data at network boundaries or converting between different representations.

### What Are Codecs?

Unlike `.transform()` which is unidirectional (input → output), codecs define transformations in both directions:
- **Forward (decode)**: Convert from input format to output format
- **Backward (encode)**: Convert from output format back to input format

All Zod schemas support both directions via `.decode()` and `.encode()` methods.

### Basic Example: Date Codec

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

### Type Safety

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

### Safe Variants (No Exceptions)

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

### Composability

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

### Common Codec Patterns

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

### When to Use Codecs

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

### Practical Example: API Client

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

---

## Recursive Types

For self-referential data structures:

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

---

## Optional, Nullable, and Default Values

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

---

## Readonly

Make all properties readonly:

```typescript
const ReadonlyUserSchema = z.object({
  name: z.string(),
  age: z.number(),
}).readonly();

type ReadonlyUser = z.infer<typeof ReadonlyUserSchema>;
// { readonly name: string; readonly age: number }
```

---

## Brand (Nominal Typing)

Create distinct types that prevent accidental mixing:

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

---

## Advanced Object Patterns

### Partial Updates (PATCH Requests)

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Make everything optional except id
const UpdateUserSchema = UserSchema.partial().required({ id: true });

type UpdateUser = z.infer<typeof UpdateUserSchema>;
// { id: string; name?: string; email?: string }
```

### Deep Partial (Nested Optional)

```typescript
const NestedSchema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string(),
      age: z.number(),
    }),
  }),
});

const DeepPartialSchema = NestedSchema.deepPartial();
// All nested fields become optional
```

### Pick and Omit

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  address: z.string(),
});

// Pick specific fields
const NameEmailSchema = PersonSchema.pick({ name: true, email: true });

// Omit fields
const WithoutAddressSchema = PersonSchema.omit({ address: true });
```

---

## Composable Schemas

Build complex schemas from reusable pieces:

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

---

## Conditional Validation

Use refinements for conditional logic:

```typescript
const ConditionalSchema = z.object({
  type: z.enum(["individual", "company"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "individual") {
    if (!data.firstName || !data.lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First and last name required for individuals",
      });
    }
  } else {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name required for companies",
      });
    }
  }
});
```

---

## Performance Patterns

### Lazy Loading Large Schemas

```typescript
// Don't load schema until needed
const HeavySchema = z.lazy(() => import('./schemas/heavy').then(m => m.schema));
```

### Discriminated Unions for Performance

```typescript
// ✓ Fast - checks discriminator first
const ResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

// ✗ Slower - tries all branches
const SlowResponseSchema = z.union([
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);
```

---

## Best Practices

1. **Use refinements for complex validation** that can't be expressed with built-in methods
2. **Use transforms for data normalization**, not validation
3. **Use codecs for bidirectional conversions** at API boundaries
4. **Cache schema instances** - don't recreate on every use
5. **Use discriminated unions** instead of regular unions for better performance
6. **Leverage brands** to prevent ID mixing bugs
7. **Compose small schemas** into larger ones for maintainability
8. **Use lazy loading** for large or rarely-used schemas

---

**See also:**
- `error-handling.md` for handling refinement errors
- `type-inference.md` for advanced type inference patterns
