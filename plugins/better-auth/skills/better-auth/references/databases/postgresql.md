# better-auth with PostgreSQL

Complete guide for integrating better-auth with PostgreSQL using Drizzle ORM or Prisma.

---

## Drizzle ORM Setup

### Installation

```bash
bun add better-auth drizzle-orm postgres drizzle-kit
```

### Database Connection

**`src/db/index.ts`**:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For serverless environments (Neon, Supabase)
const client = postgres(connectionString, { prepare: false });

// For traditional PostgreSQL
// const client = postgres(connectionString);

export const db = drizzle(client, { schema });
```

### Schema Definition

**`src/db/schema.ts`**:
```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
```

### Auth Configuration

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

### Migrations

**`drizzle.config.ts`**:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
```

---

## Prisma Setup

### Installation

```bash
bun add better-auth @prisma/client
bun add -D prisma
```

### Schema Definition

**`prisma/schema.prisma`**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions Session[]
  accounts Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Auth Configuration

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

### Migrations

```bash
bunx prisma generate
bunx prisma migrate dev --name init
```

---

## Serverless PostgreSQL (Neon, Supabase)

### Neon Setup

```bash
bun add @neondatabase/serverless
```

**`src/db/index.ts`**:
```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Supabase Setup

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use connection pooler for serverless
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

**Connection String Format**:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Connection Pooling

### For High Traffic Applications

```typescript
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  max: 20,                    // Maximum connections
  idle_timeout: 30,           // Close idle connections after 30s
  connect_timeout: 10,        // Connection timeout
  prepare: false,             // Disable prepared statements for poolers
});
```

### With External Poolers (PgBouncer)

```typescript
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,  // Required for PgBouncer transaction mode
});
```

---

## Performance Indexes

Add these indexes for faster queries:

```typescript
// In your schema
import { index } from "drizzle-orm/pg-core";

export const session = pgTable("session", {
  // ... columns
}, (table) => ({
  userIdIdx: index("session_user_id_idx").on(table.userId),
  tokenIdx: index("session_token_idx").on(table.token),
}));

export const account = pgTable("account", {
  // ... columns
}, (table) => ({
  providerIdx: index("account_provider_idx").on(table.providerId, table.accountId),
}));
```

---

## Environment Variables

```env
# Standard PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Neon
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/mydb?sslmode=require

# Supabase (with pooler)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Common Issues

### "prepared statement already exists"

Use `prepare: false` when using connection poolers:

```typescript
const client = postgres(connectionString, { prepare: false });
```

### Connection Timeout in Serverless

Reduce connection limits and add timeouts:

```typescript
const client = postgres(connectionString, {
  max: 5,
  connect_timeout: 5,
  idle_timeout: 10,
});
```

---

## Official Resources

- Drizzle Adapter: https://better-auth.com/docs/adapters/drizzle
- Prisma Adapter: https://better-auth.com/docs/adapters/prisma
- PostgreSQL Guide: https://better-auth.com/docs/guides/postgresql
