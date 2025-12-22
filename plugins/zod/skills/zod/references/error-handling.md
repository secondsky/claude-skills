# Zod Error Handling Guide

Complete guide for handling, formatting, and customizing Zod validation errors.

**Last Updated**: 2025-11-17

---

## Error Structure

When validation fails, Zod provides a `ZodError` object with detailed information:

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

---

## Error Formatting Utilities

Zod v4 provides three powerful utilities for formatting `ZodError` objects into more usable formats.

### z.flattenError() - Best for Flat Schemas and Forms

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

---

### z.treeifyError() - Best for Nested Data Structures

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

---

### z.prettifyError() - Best for Debugging and Logging

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

---

### Comparison Table

| Method | Best For | Output Type | Nested Support |
|--------|----------|-------------|----------------|
| `z.flattenError()` | Forms, single-level schemas | Object `{ formErrors, fieldErrors }` | No |
| `z.treeifyError()` | Nested data, complex structures | Tree object | Yes |
| `z.prettifyError()` | Debugging, logging | String | Yes |

---

### Legacy Methods (Deprecated)

```typescript
// ❌ Zod v3 (Deprecated in v4)
error.format();   // Use z.treeifyError(error) instead
error.flatten();  // Use z.flattenError(error) instead

// ✅ Zod v4
z.treeifyError(error);
z.flattenError(error);
```

---

## Custom Error Messages

Zod v4 unifies error customization with the `error` parameter, replacing the fragmented `message`, `invalid_type_error`, `required_error`, and `errorMap` options from v3.

### Three-Level Error Customization System

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

---

### Error Function Parameters

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

---

### Quick Examples

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

---

## Localization Support

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

---

## Common Error Handling Patterns

### Pattern 1: Form Validation with Field Errors

```typescript
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const result = LoginSchema.safeParse(formData);

if (!result.success) {
  const { fieldErrors } = z.flattenError(result.error);

  // Display errors in UI
  if (fieldErrors.email) {
    setEmailError(fieldErrors.email[0]);
  }
  if (fieldErrors.password) {
    setPasswordError(fieldErrors.password[0]);
  }
}
```

---

### Pattern 2: API Response Error Handling

```typescript
const ApiResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  data: z.any(),
});

const result = ApiResponseSchema.safeParse(response);

if (!result.success) {
  // Log detailed error for debugging
  console.error(z.prettifyError(result.error));

  // Return user-friendly error
  return {
    error: "Invalid server response. Please try again.",
  };
}
```

---

### Pattern 3: Nested Form Validation

```typescript
const ProfileSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

const result = ProfileSchema.safeParse(formData);

if (!result.success) {
  const tree = z.treeifyError(result.error);

  // Access nested errors with optional chaining
  const firstNameError = tree.properties?.personal?.properties?.firstName?.errors?.[0];
  const emailError = tree.properties?.contact?.properties?.email?.errors?.[0];

  setFieldError("personal.firstName", firstNameError);
  setFieldError("contact.email", emailError);
}
```

---

### Pattern 4: Array Validation Errors

```typescript
const TodoListSchema = z.object({
  todos: z.array(z.object({
    title: z.string().min(1),
    completed: z.boolean(),
  })),
});

const result = TodoListSchema.safeParse(data);

if (!result.success) {
  const tree = z.treeifyError(result.error);

  // Access array item errors
  tree.properties?.todos?.items?.forEach((item, index) => {
    const titleError = item.properties?.title?.errors?.[0];
    if (titleError) {
      console.log(`Todo ${index}: ${titleError}`);
    }
  });
}
```

---

## Error Code Reference

Common Zod error codes you'll encounter:

| Code | Description | Example |
|------|-------------|---------|
| `invalid_type` | Wrong data type | Expected string, got number |
| `too_small` | Value below minimum | String length < 5 |
| `too_big` | Value above maximum | Number > 100 |
| `invalid_string` | String format invalid | Email validation failed |
| `invalid_enum_value` | Not in enum | Value not in ["a", "b", "c"] |
| `custom` | Custom refinement failed | Password doesn't match |
| `invalid_union` | No union branch matched | Neither string nor number |
| `invalid_date` | Invalid Date object | NaN date |

---

## Best Practices

1. **Use `.safeParse()` in production** - Prevents unhandled exceptions
2. **Choose the right formatter**:
   - Forms → `z.flattenError()`
   - Nested data → `z.treeifyError()`
   - Debugging → `z.prettifyError()`
3. **Always use optional chaining** with `z.treeifyError()` results
4. **Provide clear error messages** at schema level for better UX
5. **Log detailed errors** for debugging, but show user-friendly messages in UI
6. **Use localization** for internationalized applications
7. **Leverage error codes** for programmatic error handling

---

**See also:**
- `migration-guide.md` for v3 to v4 error API changes
- `advanced-patterns.md` for custom refinements and validation
