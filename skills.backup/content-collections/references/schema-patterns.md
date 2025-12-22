# Zod Schema Patterns for Content Collections

Common schema patterns for validating frontmatter in Content Collections.

---

## Basic Patterns

### Required String Fields

```typescript
schema: z.object({
  title: z.string({
    required_error: "Title is required in frontmatter",
    invalid_type_error: "Title must be a string",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
})
```

### Optional Fields

```typescript
schema: z.object({
  title: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})
```

### Required Content Field

```typescript
schema: z.object({
  // Always include content field
  content: z.string(),
  // ... other fields
})
```

---

## Date Validation

### ISO Date String

```typescript
schema: z.object({
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Date must be valid ISO date (YYYY-MM-DD)" }
  ),
})
```

### Transform to Date Object

```typescript
schema: z.object({
  date: z.string().transform((val) => new Date(val)),
})
```

---

## Arrays and Enums

### String Array

```typescript
schema: z.object({
  tags: z.array(z.string()).min(1, "At least one tag required"),
  categories: z.array(z.string()).max(3, "Maximum 3 categories"),
})
```

### Enum Values

```typescript
schema: z.object({
  status: z.enum(["draft", "published", "archived"], {
    errorMap: () => ({ message: "Status must be draft, published, or archived" }),
  }),
})
```

---

## Numbers

### Integer Validation

```typescript
schema: z.object({
  order: z.number().int().positive(),
  readingTime: z.number().min(1).max(60),
})
```

### Coerce String to Number

```typescript
schema: z.object({
  order: z.coerce.number(), // "1" becomes 1
})
```

---

## Boolean Fields

```typescript
schema: z.object({
  published: z.boolean().default(false),
  featured: z.boolean().optional(),
})
```

---

## Nested Objects

```typescript
schema: z.object({
  author: z.object({
    name: z.string(),
    email: z.string().email(),
    bio: z.string().optional(),
  }),
  metadata: z.object({
    views: z.number().default(0),
    likes: z.number().default(0),
  }).optional(),
})
```

---

## Union Types

```typescript
schema: z.object({
  // Can be string or array of strings
  tag: z.union([
    z.string(),
    z.array(z.string()),
  ]).transform((val) => Array.isArray(val) ? val : [val]),
})
```

---

## Custom Validation

### Slug Format

```typescript
schema: z.object({
  slug: z.string().regex(
    /^[a-z0-9-]+$/,
    "Slug must be lowercase letters, numbers, and hyphens only"
  ),
})
```

### URL Validation

```typescript
schema: z.object({
  coverImage: z.string().url("Cover image must be valid URL"),
  githubRepo: z.string().url().optional(),
})
```

---

## Complete Blog Post Example

```typescript
const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    // Required fields
    title: z.string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    }).min(5, "Title must be at least 5 characters"),

    description: z.string().min(20).max(160),

    date: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      "Date must be valid ISO date"
    ),

    content: z.string(), // Required for Content Collections

    // Optional with defaults
    published: z.boolean().default(true),
    featured: z.boolean().default(false),

    // Optional fields
    author: z.string().optional(),
    coverImage: z.string().url().optional(),

    // Arrays
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).max(3).optional(),

    // Enum
    status: z.enum(["draft", "published", "archived"]).default("draft"),

    // Nested object
    seo: z.object({
      keywords: z.array(z.string()).optional(),
      canonicalUrl: z.string().url().optional(),
    }).optional(),
  }),
});
```

---

## Error Message Best Practices

### Custom Error Messages

```typescript
schema: z.object({
  title: z.string({
    required_error: "❌ Title is missing from frontmatter",
    invalid_type_error: "❌ Title must be a string, not a number or boolean",
  }),

  tags: z.array(z.string(), {
    required_error: "❌ Tags field is required (use empty array [] if no tags)",
    invalid_type_error: "❌ Tags must be an array of strings, like: ['react', 'typescript']",
  }),
})
```

---

## Defaults and Optional Chains

### Provide Sensible Defaults

```typescript
schema: z.object({
  title: z.string(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  views: z.number().default(0),
  metadata: z.object({
    // nested defaults
    likes: z.number().default(0),
  }).default({}),
})
```

---

## Transform After Validation

```typescript
schema: z.object({
  title: z.string(),
  date: z.string(),
}).transform((data) => ({
  ...data,
  // Add computed fields after validation
  year: new Date(data.date).getFullYear(),
  titleLowercase: data.title.toLowerCase(),
}))
```

**Note**: Use collection `transform` function instead for most cases (better typing).

---

## Common Mistakes to Avoid

❌ **Missing content field**
```typescript
schema: z.object({
  title: z.string(),
  // Missing content field - will error!
})
```

✅ **Always include content**
```typescript
schema: z.object({
  title: z.string(),
  content: z.string(), // Required!
})
```

---

❌ **Forgetting optional()**
```typescript
schema: z.object({
  author: z.string(), // Will error if missing!
})
```

✅ **Mark optional fields**
```typescript
schema: z.object({
  author: z.string().optional(),
})
```

---

❌ **No error messages**
```typescript
schema: z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val))),
  // Error will be unclear
})
```

✅ **Clear error messages**
```typescript
schema: z.object({
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Date must be valid ISO date (YYYY-MM-DD)" }
  ),
})
```

---

## Official Zod Documentation

- **Zod**: https://zod.dev
- **StandardSchema Spec**: https://standardschema.dev
- **Valibot** (alternative): https://valibot.dev
- **ArkType** (alternative): https://arktype.io
