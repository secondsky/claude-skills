# Zod Troubleshooting Guide

Solutions for common issues, performance optimization, and best practices.

**Last Updated**: 2025-11-17

---

## Known Issues & Solutions

### 1. TypeScript Strict Mode Required

**Issue**: Zod requires TypeScript strict mode (`"strict": true`).

**Error Message**:
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution**: Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    // If enabling strict is impossible, manually enable strictNullChecks
    "strictNullChecks": true
  }
}
```

**Why**: Zod's type inference relies on strict null checking to properly distinguish between `string`, `string | undefined`, and `string | null`.

---

### 2. Large Schema Bundle Size

**Issue**: Complex schemas can increase bundle size significantly.

**Solution 1**: Use lazy loading for large schemas:

```typescript
// Instead of importing directly
import { HeavySchema } from './schemas/heavy';

// Lazy load when needed
const HeavySchema = z.lazy(() =>
  import('./schemas/heavy').then(m => m.HeavySchema)
);
```

**Solution 2**: Code splitting by route/page:

```typescript
// Only load schema when route is accessed
const ProfileSchema = lazy(() => import('./schemas/profile'));
```

**Solution 3**: Extract shared schemas:

```typescript
// Reuse common schemas instead of duplicating
const TimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Use in multiple places
const PostSchema = z.object({
  /* ... */
}).merge(TimestampSchema);

const CommentSchema = z.object({
  /* ... */
}).merge(TimestampSchema);
```

---

### 3. Async Refinements Performance

**Issue**: Async refinements (e.g., database checks) can be slow and cause performance bottlenecks.

**Solution 1**: Use caching:

```typescript
const usernameCache = new Map();

const UsernameSchema = z.string().refine(
  async (username) => {
    if (usernameCache.has(username)) {
      return usernameCache.get(username);
    }

    const exists = await checkUsernameExists(username);
    usernameCache.set(username, !exists);
    return !exists;
  },
  { message: "Username already taken" }
);
```

**Solution 2**: Debouncing:

```typescript
import { debounce } from 'lodash';

const checkUsername = debounce(async (username) => {
  return await checkUsernameExists(username);
}, 500);

const UsernameSchema = z.string().refine(
  async (username) => {
    const exists = await checkUsername(username);
    return !exists;
  },
  { message: "Username already taken" }
);
```

**Solution 3**: Move expensive checks to background:

```typescript
// Validate format synchronously
const QuickUsernameSchema = z.string().min(3).max(20).regex(/^[a-z0-9_]+$/);

// Validate availability asynchronously after submission
async function validateUsernameAvailability(username: string) {
  const exists = await checkUsernameExists(username);
  if (exists) {
    throw new Error("Username already taken");
  }
}
```

---

### 4. Error Message Localization

**Issue**: Default error messages are English-only.

**Solution**: Use Zod v4's built-in localization or custom error maps:

**Built-in Locales** (40+ languages):

```typescript
import { z } from "zod";

// Global locale
z.config(z.locales.es());  // Spanish
z.config(z.locales.fr());  // French
z.config(z.locales.ja());  // Japanese

// Per-parse locale
const result = schema.parse(data, {
  locale: z.locales.es(),
});
```

**Custom i18n Integration**:

```typescript
import { t } from 'i18next';

z.config({
  customError: (issue) => ({
    message: t(`validation.${issue.code}`, issue),
  }),
});
```

**Example i18n File**:

```json
{
  "validation": {
    "too_small": "Minimum length: {{minimum}}",
    "too_big": "Maximum length: {{maximum}}",
    "invalid_type": "Expected {{expected}}, got {{received}}",
    "invalid_string": "Invalid {{validation}}"
  }
}
```

---

### 5. Circular Dependencies

**Issue**: Self-referential types can cause TypeScript errors.

**Error Message**:
```
'CategorySchema' is referenced directly or indirectly in its own type annotation.
```

**Solution**: Use `z.lazy()`:

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

**Why it works**: `z.lazy()` defers schema creation until runtime, breaking the circular reference.

---

### 6. Union Type Performance

**Issue**: Large unions can slow down parsing significantly.

**Slow Example**:

```typescript
// ✗ Tries all 10 branches on failure
const SlowUnion = z.union([
  z.object({ type: z.literal("a"), data: z.string() }),
  z.object({ type: z.literal("b"), data: z.number() }),
  z.object({ type: z.literal("c"), data: z.boolean() }),
  // ... 7 more branches
]);
```

**Solution**: Use `z.discriminatedUnion()`:

```typescript
// ✓ Checks discriminator first, then only 1 branch
const FastUnion = z.discriminatedUnion("type", [
  z.object({ type: z.literal("a"), data: z.string() }),
  z.object({ type: z.literal("b"), data: z.number() }),
  z.object({ type: z.literal("c"), data: z.boolean() }),
  // ... 7 more branches
]);
```

**Performance gain**: ~10x faster for large unions (10+ branches).

---

### 7. Default Values Not Applied on Undefined

**Issue**: `.default()` only applies when value is `undefined`, not for `null` or invalid types.

**Example**:

```typescript
const schema = z.string().default("fallback");

schema.parse(undefined); // "fallback" ✓
schema.parse(null);      // ✗ Error: Expected string, received null
schema.parse(123);       // ✗ Error: Expected string, received number
```

**Solution 1**: Use `.nullish().default()` for null handling:

```typescript
const schema = z.string().nullish().default("fallback");

schema.parse(undefined); // "fallback" ✓
schema.parse(null);      // "fallback" ✓
```

**Solution 2**: Use `.catch()` for fallback on any error:

```typescript
const schema = z.string().catch("fallback");

schema.parse(undefined); // "fallback" ✓
schema.parse(null);      // "fallback" ✓
schema.parse(123);       // "fallback" ✓
```

---

### 8. Transform vs Refine Confusion

**Issue**: Using `.refine()` when `.transform()` is needed (or vice versa).

**Refine** (validation only):
```typescript
// ✓ For validation - returns boolean
z.string().refine((val) => val.length >= 8, "Too short");
```

**Transform** (data modification):
```typescript
// ✓ For transformation - returns new value
z.string().transform((val) => val.trim());
```

**Common Mistake**:
```typescript
// ✗ Wrong - refine doesn't modify data
z.string().refine((val) => val.trim());

// ✓ Correct - use transform to modify
z.string().transform((val) => val.trim());
```

**When to use what**:
- **Refine**: Add validation rules (returns `true`/`false`)
- **Transform**: Modify the data (returns new value)
- **Codec**: Bidirectional transformation (encode + decode)

---

## Performance Tips

### 1. Use `.discriminatedUnion()` instead of `.union()`

**Impact**: 5-10x faster for large unions

```typescript
// ✗ Slow
z.union([...]);

// ✓ Fast
z.discriminatedUnion("type", [...]);
```

---

### 2. Lazy Load Large Schemas

**Impact**: Reduces initial bundle size by 50-80%

```typescript
const HeavySchema = z.lazy(() => import('./schemas/heavy'));
```

---

### 3. Coerce Sparingly

**Impact**: Coercion adds ~20% overhead

```typescript
// ✗ Slower
z.coerce.number()

// ✓ Faster (if input is already number)
z.number()
```

---

### 4. Cache Schema Instances

**Impact**: Prevents recreation overhead

```typescript
// ✗ Recreated on every request
app.post('/users', (req, res) => {
  const schema = z.object({ ... }); // Bad!
});

// ✓ Created once
const UserSchema = z.object({ ... });
app.post('/users', (req, res) => {
  UserSchema.parse(req.body); // Good!
});
```

---

### 5. Use `.safeParse()` over `.parse()`

**Impact**: Avoids expensive try-catch

```typescript
// ✗ Requires try-catch
try {
  schema.parse(data);
} catch (err) {
  // handle error
}

// ✓ No exceptions
const result = schema.safeParse(data);
if (!result.success) {
  // handle error
}
```

---

### 6. Avoid Deep Nesting

**Impact**: Flat schemas parse 2-3x faster

```typescript
// ✗ Deeply nested
const Nested = z.object({
  level1: z.object({
    level2: z.object({
      level3: z.object({
        value: z.string()
      })
    })
  })
});

// ✓ Flattened
const Flat = z.object({
  level1_level2_level3_value: z.string()
});
```

---

## Best Practices

### 1. Define Schemas at Module Level

```typescript
// ✓ Good - defined once
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export function validateUser(data: unknown) {
  return UserSchema.safeParse(data);
}

// ✗ Bad - recreated every call
export function validateUser(data: unknown) {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  });
  return schema.safeParse(data);
}
```

---

### 2. Use `.safeParse()` for User Input

```typescript
// ✓ Best for user input
const result = schema.safeParse(userInput);
if (!result.success) {
  return { errors: z.flattenError(result.error) };
}

// ✗ Can crash on invalid input
const data = schema.parse(userInput); // Throws!
```

---

### 3. Leverage Type Inference

```typescript
// ✓ Let Zod generate types
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});
type User = z.infer<typeof UserSchema>;

// ✗ Manual types (out of sync risk)
interface User {
  name: string;
  age: number;
}
```

---

### 4. Add Custom Error Messages

```typescript
// ✓ Clear, actionable errors
z.string().min(8, "Password must be at least 8 characters");
z.string().email("Please enter a valid email address");

// ✗ Default errors (less user-friendly)
z.string().min(8);
z.string().email();
```

---

### 5. Use Discriminated Unions

```typescript
// ✓ Fast + good type inference
z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.any() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

// ✗ Slow + poor type inference
z.union([
  z.object({ type: z.literal("success"), data: z.any() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
```

---

### 6. Validate Early

```typescript
// ✓ Validate at system boundaries
app.post('/api/users', (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  // Process validated data
});
```

---

### 7. Compose Small Schemas

```typescript
// ✓ Reusable, maintainable
const TimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
}).merge(TimestampSchema);

// ✗ Repetitive, error-prone
const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

---

### 8. Document with `.meta()`

```typescript
// ✓ Self-documenting schemas
const EmailSchema = z.string().email().meta({
  title: "Email Address",
  description: "User's primary email address",
  examples: ["user@example.com"],
});

// ✗ Undocumented schemas
const EmailSchema = z.string().email();
```

---

### 9. Test Schemas Thoroughly

```typescript
// ✓ Comprehensive schema tests
describe('UserSchema', () => {
  it('accepts valid user', () => {
    const result = UserSchema.safeParse({
      email: 'user@example.com',
      age: 25,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = UserSchema.safeParse({
      email: 'invalid',
      age: 25,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative age', () => {
    const result = UserSchema.safeParse({
      email: 'user@example.com',
      age: -5,
    });
    expect(result.success).toBe(false);
  });
});
```

---

### 10. Use Codecs for Serialization

```typescript
// ✓ Bidirectional date conversion
const DateCodec = z.codec(
  z.iso.datetime(),
  z.date(),
  {
    decode: (str) => new Date(str),
    encode: (date) => date.toISOString(),
  }
);

// API request: Date → String
const payload = EventSchema.encode(event);
fetch('/api/events', { body: JSON.stringify(payload) });

// API response: String → Date
const event = EventSchema.decode(await response.json());
```

---

**See also:**
- `migration-guide.md` for upgrading from Zod v3
- `error-handling.md` for error message customization
- `advanced-patterns.md` for performance-optimized patterns
