# Zod Type Inference and Metadata Guide

Complete guide for TypeScript type inference, JSON Schema generation, and metadata system in Zod.

**Last Updated**: 2025-11-17

---

## Type Inference Basics

Zod automatically generates TypeScript types from your schemas:

```typescript
// Basic inference
const UserSchema = z.object({ name: z.string() });
type User = z.infer<typeof UserSchema>; // { name: string }
```

---

## Input vs Output Types

For schemas with transformations, Zod distinguishes between input and output types:

```typescript
const TransformSchema = z.string().transform((s) => s.length);

type Input = z.input<typeof TransformSchema>;   // string
type Output = z.output<typeof TransformSchema>; // number

// Use z.infer for output type (most common)
type Result = z.infer<typeof TransformSchema>; // number
```

---

## Complex Type Inference

### Nested Objects

```typescript
const ProfileSchema = z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
  }),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
  }),
});

type Profile = z.infer<typeof ProfileSchema>;
/*
{
  user: {
    name: string;
    age: number;
  };
  settings: {
    theme: "light" | "dark";
  };
}
*/
```

### Arrays and Tuples

```typescript
const TagsSchema = z.array(z.string());
type Tags = z.infer<typeof TagsSchema>; // string[]

const CoordinatesSchema = z.tuple([z.number(), z.number()]);
type Coordinates = z.infer<typeof CoordinatesSchema>; // [number, number]
```

### Unions and Discriminated Unions

```typescript
const StatusSchema = z.union([
  z.literal("pending"),
  z.literal("success"),
  z.literal("error"),
]);
type Status = z.infer<typeof StatusSchema>; // "pending" | "success" | "error"

const ResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);
type Response = z.infer<typeof ResponseSchema>;
// { status: "success", data: any } | { status: "error", message: string }
```

---

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
```

### JSON Schema Options

```typescript
z.toJSONSchema(schema, {
  target: "openapi-3.0",           // Target version
  metadata: true,                  // Include .meta() data
  cycles: "ref",                   // Handle recursive schemas
  reused: "defs",                  // Extract repeated schemas
  io: "input",                     // Use input types instead of output
  unrepresentable: "any",          // Handle unsupported types
});
```

---

## Metadata System

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

---

## Type Utilities

### Extract Type from Schema

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Extract the inferred type
type User = z.infer<typeof UserSchema>;

// Use in functions
function processUser(user: User) {
  console.log(user.email); // TypeScript knows this is a string
}
```

### Use Schema as Type Guard

```typescript
const isUser = (data: unknown): data is User => {
  return UserSchema.safeParse(data).success;
};

// Use in code
if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.email);
}
```

---

## Advanced Type Patterns

### Conditional Types with Refinements

```typescript
const ConditionalSchema = z.object({
  type: z.enum(["email", "phone"]),
  value: z.string(),
}).refine(
  (data) => {
    if (data.type === "email") {
      return z.string().email().safeParse(data.value).success;
    }
    return z.string().regex(/^\+?[1-9]\d{1,14}$/).safeParse(data.value).success;
  },
  { message: "Invalid format for selected type" }
);

type ConditionalData = z.infer<typeof ConditionalSchema>;
// { type: "email" | "phone"; value: string }
```

### Brand Types for Domain Modeling

```typescript
const UserId = z.string().brand<"UserId">();
const PostId = z.string().brand<"PostId">();

type UserId = z.infer<typeof UserId>;     // string & Brand<"UserId">
type PostId = z.infer<typeof PostId>;     // string & Brand<"PostId">

// Prevents mixing IDs
function getUser(id: UserId) { /* ... */ }
function getPost(id: PostId) { /* ... */ }

const userId = UserId.parse("user-123");
const postId = PostId.parse("post-456");

getUser(userId);  // ✓ OK
getUser(postId);  // ✗ Type error - prevents bugs!
```

---

## Best Practices

1. **Use `z.infer` instead of manual types** - Let Zod generate types
2. **Add metadata for documentation** - Improves DX and enables tooling
3. **Use brands for ID types** - Prevents accidental mixing
4. **Generate JSON Schema for APIs** - Keep OpenAPI docs in sync
5. **Leverage input/output types** - Essential for transforms/codecs
6. **Use custom registries for complex metadata** - Better type safety
7. **Document schemas with `.meta()`** - Especially for public APIs

---

**See also:**
- `advanced-patterns.md` for transforms and codecs
- `error-handling.md` for type-safe error handling
