# Zod Ecosystem Integrations

Complete guide for integrating Zod with popular frameworks, libraries, and tools.

**Last Updated**: 2025-11-17

---

## ESLint Plugins

### eslint-plugin-zod-x

**GitHub**: https://github.com/JoshuaKGoldberg/eslint-plugin-zod-x (40 stars)

Enforces Zod best practices and coding standards.

**Rules**:
- `zod-x/no-missing-error-messages` - Ensure custom error messages for better UX
- `zod-x/prefer-enum` - Prefer `z.enum()` over `z.union()` of literals (better performance)
- `zod-x/require-strict` - Enforce strict object schemas (prevent extra properties)

**Installation**:
```bash
bun add -D eslint-plugin-zod-x
```

**Configuration**:
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['zod-x'],
  rules: {
    'zod-x/no-missing-error-messages': 'warn',
    'zod-x/prefer-enum': 'error',
    'zod-x/require-strict': 'warn',
  },
};
```

---

### eslint-plugin-import-zod

**GitHub**: https://github.com/nodkz/eslint-plugin-import-zod (46 stars)

Enforces consistent Zod import style.

**Enforced Style**:
```typescript
// ✓ Correct
import { z } from "zod";

// ✗ Disallowed
import * as z from "zod";
```

**Installation**:
```bash
bun add -D eslint-plugin-import-zod
```

**Configuration**:
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['import-zod'],
  rules: {
    'import-zod/require-z-import': 'error',
  },
};
```

---

## Framework Integrations

### tRPC

**GitHub**: https://github.com/trpc/trpc (38,863 stars)

End-to-end typesafe APIs with automatic client generation.

**Example**:
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

  createUser: t.procedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      return db.user.create({ data: input });
    }),
});
```

**Benefits**:
- Full type safety from server to client
- No code generation needed
- Automatic input validation
- Works seamlessly with Zod schemas

**Learn more**: https://trpc.io

---

### React Hook Form

**GitHub**: https://github.com/react-hook-form/react-hook-form (43,789 stars)

High-performance form validation for React.

**Installation**:
```bash
bun add react-hook-form @hookform/resolvers zod
```

**Example**:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
  age: z.number().int().min(18, "Must be 18+"),
});

type FormData = z.infer<typeof FormSchema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}

      <input type="number" {...register("age", { valueAsNumber: true })} />
      {errors.age && <p>{errors.age.message}</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

**Note**: For comprehensive React Hook Form + Zod patterns, use the `react-hook-form-zod` skill.

---

### Prisma

**GitHub**: https://github.com/prisma/prisma (41,734 stars)

Generate Zod schemas from Prisma models.

**Installation**:
```bash
bun add -D zod-prisma-types
```

**Prisma Schema**:
```prisma
// prisma/schema.prisma
generator zod {
  provider = "zod-prisma-types"
  output   = "../src/zod"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
}
```

**Generated Zod Schema**:
```typescript
// src/zod/user.ts (auto-generated)
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
});
```

**Usage**:
```typescript
import { UserSchema } from "@/zod/user";

// Validate user data
const result = UserSchema.safeParse(userData);
```

---

### NestJS

**GitHub**: https://github.com/nestjs/nest (69,342 stars)

Integration via **nestjs-zod** package.

**Features**:
- Automatic DTO generation
- OpenAPI documentation
- Validation pipes
- Exception filters

**Installation**:
```bash
bun add nestjs-zod zod
```

**Example**:
```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
});

class CreateUserDto extends createZodDto(CreateUserSchema) {}

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // dto is validated automatically
    return this.usersService.create(dto);
  }
}
```

**Learn more**: https://github.com/risenforces/nestjs-zod

---

## Code Generation Tools

### Orval

**GitHub**: https://github.com/anymaniax/orval (4,848 stars)

Generate Zod schemas and API clients from OpenAPI specifications.

**Installation**:
```bash
bun add -D orval
```

**Configuration**:
```javascript
// orval.config.js
module.exports = {
  petstore: {
    input: './openapi.yaml',
    output: {
      mode: 'split',
      target: './src/api',
      schemas: './src/schemas',
      client: 'fetch',
      override: {
        mutator: {
          path: './src/mutator/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
  },
};
```

**Generate**:
```bash
bunx orval
```

**Learn more**: https://orval.dev

---

### Hey API

**GitHub**: https://github.com/hey-api/openapi-ts (3,497 stars)

OpenAPI to TypeScript with Zod support.

**Installation**:
```bash
bun add -D @hey-api/openapi-ts
```

**Generate**:
```bash
npx @hey-api/openapi-ts -i ./openapi.json -o ./src/api -c fetch
```

**Learn more**: https://heyapi.vercel.app

---

### Kubb

**GitHub**: https://github.com/kubb-project/kubb (1,416 stars)

Modern API toolkit with Zod code generation.

**Installation**:
```bash
bun add -D @kubb/core @kubb/plugin-zod
```

**Configuration**:
```typescript
// kubb.config.ts
export default {
  input: './openapi.yaml',
  output: './src/gen',
  plugins: [
    ['@kubb/plugin-zod', {
      output: './schemas',
    }],
  ],
};
```

**Learn more**: https://kubb.dev

---

## Testing Libraries

### Vitest

Zod works seamlessly with Vitest for schema testing:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('UserSchema', () => {
  const UserSchema = z.object({
    email: z.string().email(),
    age: z.number().int().positive(),
  });

  it('validates valid user', () => {
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
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('email');
    }
  });
});
```

---

## Database Integrations

### Drizzle ORM

**GitHub**: https://github.com/drizzle-team/drizzle-orm (27,536 stars)

Type-safe SQL ORM with Zod integration.

**Example**:
```typescript
import { z } from 'zod';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  age: integer('age'),
});

// Generate Zod schemas from table
const insertUserSchema = createInsertSchema(users);
const selectUserSchema = createSelectSchema(users);

// Validate before insert
const result = insertUserSchema.safeParse(userData);
if (result.success) {
  await db.insert(users).values(result.data);
}
```

---

## API Development

### Hono

**GitHub**: https://github.com/honojs/hono (24,883 stars)

Ultrafast web framework with Zod validation middleware.

**Example**:
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

app.post('/users', zValidator('json', CreateUserSchema), (c) => {
  const user = c.req.valid('json');
  // user is typed and validated
  return c.json({ id: 123, ...user });
});
```

---

## Best Practices

1. **Use code generation tools** for OpenAPI → Zod conversion
2. **Leverage ecosystem integrations** instead of custom validation
3. **Share schemas** between frontend and backend with tRPC
4. **Use ESLint plugins** to enforce best practices
5. **Generate Zod from database schemas** for consistency
6. **Integrate with forms** using React Hook Form or similar

---

**See also:**
- `type-inference.md` for generating types from schemas
- `error-handling.md` for framework-specific error handling
