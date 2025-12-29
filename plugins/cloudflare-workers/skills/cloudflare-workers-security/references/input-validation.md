# Input Validation for Cloudflare Workers

Comprehensive guide to validating and sanitizing user input.

## Why Input Validation Matters

**Without validation:**
- SQL Injection via malicious input
- XSS via unescaped output
- DoS via large payloads
- Logic bugs via unexpected types

**With validation:**
- Known data shapes
- Controlled input sizes
- Type safety
- Clear error messages

## Validation with Zod

### Basic Schema

```typescript
import { z } from 'zod';

// User schema
const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

type User = z.infer<typeof UserSchema>;

// Validate
async function createUser(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const user = UserSchema.parse(body);

    // user is now typed and validated
    return Response.json({ success: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### Advanced Schemas

```typescript
// Nested objects
const OrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
    price: z.number().positive(),
  })).min(1).max(50),
  shipping: z.object({
    address: z.string().min(10).max(500),
    city: z.string().min(2).max(100),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2), // ISO country code
  }),
  notes: z.string().max(1000).optional(),
});

// Refinements
const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
});

// Transform
const SearchSchema = z.object({
  query: z.string().trim().toLowerCase().min(1).max(100),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('10'),
});
```

### Query Parameter Validation

```typescript
function validateQueryParams<T extends z.ZodType>(
  request: Request,
  schema: T
): z.infer<T> {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  return schema.parse(params);
}

// Usage
const SearchParamsSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(['date', 'relevance', 'price']).default('relevance'),
});

app.get('/search', async (c) => {
  const params = validateQueryParams(c.req.raw, SearchParamsSchema);
  // params is typed: { q: string, page: number, sort: 'date' | 'relevance' | 'price' }
});
```

### Request Body Validation Middleware

```typescript
function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      c.set('validatedBody', schema.parse(body));
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Validation failed', details: formatZodError(error) },
          400
        );
      }
      throw error;
    }
  };
}

function formatZodError(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
```

## Sanitization

### HTML Sanitization

```typescript
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// For user-generated content that will be displayed
function sanitizeUserContent(content: string): string {
  // Remove HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');

  // Escape remaining special characters
  sanitized = escapeHtml(sanitized);

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}
```

### SQL Injection Prevention

```typescript
// ❌ NEVER do this
const sql = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ Always use parameterized queries
async function getUser(db: D1Database, userId: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();

  return result;
}

// ✅ For multiple parameters
async function searchUsers(
  db: D1Database,
  params: { name: string; role: string; limit: number }
): Promise<User[]> {
  const result = await db
    .prepare('SELECT * FROM users WHERE name LIKE ? AND role = ? LIMIT ?')
    .bind(`%${params.name}%`, params.role, params.limit)
    .all<User>();

  return result.results;
}
```

### Path Traversal Prevention

```typescript
function sanitizePath(userPath: string): string {
  // Remove path traversal attempts
  let safe = userPath
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/^\//, '');

  // Only allow alphanumeric, dash, underscore, slash
  safe = safe.replace(/[^a-zA-Z0-9\-_\/]/g, '');

  return safe;
}

// Usage
async function getFile(bucket: R2Bucket, userPath: string): Promise<R2Object | null> {
  const safePath = sanitizePath(userPath);

  // Ensure within allowed directory
  const fullPath = `uploads/${safePath}`;

  return bucket.get(fullPath);
}
```

## Size Limits

### Request Size Validation

```typescript
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

async function validateRequestSize(request: Request): Promise<void> {
  const contentLength = request.headers.get('Content-Length');

  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }
}

// Streaming size check
async function readBodyWithLimit(
  request: Request,
  maxSize: number
): Promise<ArrayBuffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No body');

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalSize += value.length;
    if (totalSize > maxSize) {
      reader.cancel();
      throw new Error('Request body too large');
    }

    chunks.push(value);
  }

  // Combine chunks
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}
```

### Array/String Limits

```typescript
const ItemsSchema = z.object({
  items: z.array(z.string().max(100)) // Each string max 100 chars
    .min(1)
    .max(1000), // Max 1000 items
});

const TextSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000), // 50KB of text
});
```

## Type Coercion

### Safe Type Conversion

```typescript
// With Zod
const NumberSchema = z.coerce.number(); // Converts string to number
const BooleanSchema = z.coerce.boolean(); // Converts to boolean

// Manual safe conversion
function safeInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed.toString() === value.trim()) {
      return parsed;
    }
  }

  return null;
}

function safeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return null;
}
```

## Content Type Validation

```typescript
function validateContentType(
  request: Request,
  expected: string | string[]
): boolean {
  const contentType = request.headers.get('Content-Type');
  if (!contentType) return false;

  const types = Array.isArray(expected) ? expected : [expected];
  return types.some(type => contentType.startsWith(type));
}

// Usage
app.post('/api/data', async (c) => {
  if (!validateContentType(c.req.raw, 'application/json')) {
    return c.json({ error: 'Content-Type must be application/json' }, 415);
  }

  // Process JSON
});

app.post('/api/upload', async (c) => {
  if (!validateContentType(c.req.raw, ['image/png', 'image/jpeg'])) {
    return c.json({ error: 'Only PNG and JPEG images allowed' }, 415);
  }

  // Process image
});
```

## Error Handling

### Consistent Error Responses

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

function createValidationError(errors: ValidationError[]): Response {
  return Response.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
    { status: 400 }
  );
}

// From Zod errors
function zodToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
```

## Complete Validation Middleware

```typescript
import { z } from 'zod';
import { Hono } from 'hono';

interface ValidatorOptions {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

function validate(options: ValidatorOptions) {
  return async (c: Context, next: Next) => {
    const errors: { location: string; errors: z.ZodIssue[] }[] = [];

    // Validate body
    if (options.body) {
      try {
        const body = await c.req.json();
        c.set('body', options.body.parse(body));
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({ location: 'body', errors: error.issues });
        }
      }
    }

    // Validate query
    if (options.query) {
      try {
        const url = new URL(c.req.url);
        const params = Object.fromEntries(url.searchParams);
        c.set('query', options.query.parse(params));
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({ location: 'query', errors: error.issues });
        }
      }
    }

    // Validate params
    if (options.params) {
      try {
        c.set('params', options.params.parse(c.req.param()));
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({ location: 'params', errors: error.issues });
        }
      }
    }

    if (errors.length > 0) {
      return c.json(
        { error: 'Validation failed', details: errors },
        400
      );
    }

    await next();
  };
}

// Usage
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

app.post('/users', validate({ body: CreateUserSchema }), async (c) => {
  const body = c.get('body') as z.infer<typeof CreateUserSchema>;
  // body is typed and validated
});
```
