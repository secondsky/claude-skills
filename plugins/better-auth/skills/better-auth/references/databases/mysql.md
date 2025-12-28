# better-auth with MySQL

Complete guide for integrating better-auth with MySQL and PlanetScale.

---

## Drizzle ORM Setup

### Installation

```bash
bun add better-auth drizzle-orm mysql2 drizzle-kit
```

### Database Connection

**`src/db/index.ts`**:
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle(connection, { schema, mode: "default" });
```

### Schema Definition

**`src/db/schema.ts`**:
```typescript
import { mysqlTable, varchar, boolean, datetime, text } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: datetime("createdAt").notNull().defaultNow(),
  updatedAt: datetime("updatedAt").notNull().defaultNow(),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("userId", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: datetime("createdAt").notNull().defaultNow(),
  updatedAt: datetime("updatedAt").notNull().defaultNow(),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("userId", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: datetime("accessTokenExpiresAt"),
  refreshTokenExpiresAt: datetime("refreshTokenExpiresAt"),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: datetime("createdAt").notNull().defaultNow(),
  updatedAt: datetime("updatedAt").notNull().defaultNow(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expiresAt").notNull(),
  createdAt: datetime("createdAt").notNull().defaultNow(),
  updatedAt: datetime("updatedAt").notNull().defaultNow(),
});
```

### Auth Configuration

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

---

## PlanetScale Setup

PlanetScale is a serverless MySQL-compatible database.

### Installation

```bash
bun add better-auth drizzle-orm @planetscale/database drizzle-kit
```

### Connection

**`src/db/index.ts`**:
```typescript
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import * as schema from "./schema";

const connection = connect({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(connection, { schema });
```

### Important: Foreign Keys

PlanetScale doesn't support foreign key constraints. Update your schema:

```typescript
// Remove .references() from columns
export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  // ... other columns (no foreign key reference)
});
```

### Auth Configuration for PlanetScale

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    // PlanetScale uses Vitess, which needs special handling
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

---

## Drizzle Kit Configuration

**`drizzle.config.ts`**:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### For PlanetScale

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PlanetScale specific
  tablesFilter: ["!_vt*"],  // Exclude Vitess tables
});
```

---

## Migrations

### Standard MySQL

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
```

### PlanetScale

```bash
bunx drizzle-kit generate
bunx drizzle-kit push --force  # PlanetScale requires force for some operations
```

Or use PlanetScale's branching workflow:
1. Create a development branch
2. Push migrations to development branch
3. Create a deploy request
4. Merge to main

---

## Connection Pooling

### mysql2 Pool

```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
});

export const db = drizzle(pool, { schema, mode: "default" });
```

---

## Environment Variables

### Standard MySQL

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=mydb
BETTER_AUTH_SECRET=your-secret
APP_URL=http://localhost:3000
```

### PlanetScale

```env
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/mydb?ssl={"rejectUnauthorized":true}
BETTER_AUTH_SECRET=your-secret
APP_URL=http://localhost:3000
```

---

## Common Issues

### "ER_NO_REFERENCED_ROW_2" on PlanetScale

PlanetScale doesn't support foreign keys. Remove `.references()` from schema.

### Connection Timeout in Serverless

Use connection pooling or PlanetScale's serverless driver.

### Character Set Issues

Specify UTF-8 in connection:

```typescript
const connection = await mysql.createConnection({
  // ... other options
  charset: "utf8mb4",
});
```

---

## Official Resources

- MySQL Adapter: https://better-auth.com/docs/adapters/drizzle
- PlanetScale: https://planetscale.com/docs
