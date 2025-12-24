# better-auth Complete Setup Guide

Complete 8-step setup for better-auth with Cloudflare Workers + D1 + Drizzle ORM.

---

## Step 1: Create D1 Database

```bash
# Create database
wrangler d1 create my-app-db

# Copy the database_id from output
```

**Add to `wrangler.toml`**:
```toml
name = "my-app"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "your-database-id-here"

[vars]
BETTER_AUTH_URL = "http://localhost:5173"

# Secrets (use: wrangler secret put SECRET_NAME)
# - BETTER_AUTH_SECRET
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
```

---

## Step 2: Define Database Schema

**File**: `src/db/schema.ts`

```typescript
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// better-auth core tables
export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull().default(false),
  image: text(),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text().notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: integer({ mode: "timestamp" }),
  refreshTokenExpiresAt: integer({ mode: "timestamp" }),
  scope: text(),
  idToken: text(),
  password: text(),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Add your custom tables here
export const profile = sqliteTable("profile", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text(),
  website: text(),
});
```

---

## Step 3: Configure Drizzle

**File**: `drizzle.config.ts`

```typescript
import type { Config } from "drizzle-kit";

export default {
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    token: process.env.CLOUDFLARE_TOKEN!,
  },
} satisfies Config;
```

**Create `.env` file** (for migrations):
```env
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_TOKEN=your-api-token
```

---

## Step 4: Generate and Apply Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migration to D1 (local)
wrangler d1 migrations apply my-app-db --local

# Apply migration to D1 (production)
wrangler d1 migrations apply my-app-db --remote
```

---

## Step 5: Initialize Database and Auth

**File**: `src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

**File**: `src/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "./db";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    // Drizzle adapter with SQLite provider
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),

    // Email/password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        // TODO: Implement email sending
        // Use Resend, SendGrid, or Cloudflare Email Routing
        console.log(`Verification email for ${user.email}: ${url}`);
      },
    },

    // Social providers
    socialProviders: {
      google: env.GOOGLE_CLIENT_ID
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            scope: ["openid", "email", "profile"],
          }
        : undefined,
      github: env.GITHUB_CLIENT_ID
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET!,
            scope: ["user:email", "read:user"],
          }
        : undefined,
    },

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update every 24 hours
    },
  });
}
```

---

## Step 6: Create Worker with Auth Routes

**File**: `src/index.ts`

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDatabase } from "./db";
import { createAuth } from "./auth";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Auth routes - handle all better-auth endpoints
app.all("/api/auth/*", async (c) => {
  const db = createDatabase(c.env.DB);
  const auth = createAuth(db, c.env);
  return auth.handler(c.req.raw);
});

// Example: Protected API route
app.get("/api/protected", async (c) => {
  const db = createDatabase(c.env.DB);
  const auth = createAuth(db, c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    message: "Protected data",
    user: session.user,
  });
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
```

---

## Step 7: Set Secrets

```bash
# Generate a random secret
openssl rand -base64 32

# Set secrets in Wrangler
wrangler secret put BETTER_AUTH_SECRET
# Paste the generated secret

# Optional: Set OAuth secrets
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

---

## Step 8: Deploy

```bash
# Test locally
npm run dev

# Deploy to Cloudflare
wrangler deploy
```

---

## Alternative: Kysely Adapter

If you prefer Kysely over Drizzle:

**File**: `src/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { Kysely, CamelCasePlugin } from "kysely";
import { D1Dialect } from "@noxharmonium/kysely-d1";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  // ... other env vars
};

export function createAuth(env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,

    // Kysely with D1Dialect
    database: {
      db: new Kysely({
        dialect: new D1Dialect({
          database: env.DB,
        }),
        plugins: [
          // CRITICAL: Required if using Drizzle schema with snake_case
          new CamelCasePlugin(),
        ],
      }),
      type: "sqlite",
    },

    emailAndPassword: {
      enabled: true,
    },

    // ... other config
  });
}
```

**Why CamelCasePlugin?**

If your Drizzle schema uses `snake_case` column names (e.g., `email_verified`), but better-auth expects `camelCase` (e.g., `emailVerified`), the `CamelCasePlugin` automatically converts between the two.

---

**Official Documentation**:
- better-auth Setup: https://better-auth.com/docs/installation
- Drizzle + D1: https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1
- Kysely + D1: https://github.com/noxharmonium/kysely-d1
