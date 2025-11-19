---
name: better-auth
description: |
  Production-ready authentication framework for TypeScript with Cloudflare D1 support via Drizzle ORM or Kysely. Use this skill when building auth systems as a self-hosted alternative to Clerk or Auth.js, particularly for Cloudflare Workers projects. CRITICAL: better-auth requires Drizzle ORM or Kysely as database adapters - there is NO direct D1 adapter. Supports social providers (Google, GitHub, Microsoft, Apple), email/password, magic links, 2FA, passkeys, organizations, and RBAC. Prevents 12+ common authentication errors including D1 adapter misconfiguration, schema generation issues, session serialization, CORS, OAuth flows, and JWT token handling.

  Keywords: better-auth, authentication, cloudflare d1 auth, drizzle orm auth, kysely auth, self-hosted auth, typescript auth, clerk alternative, auth.js alternative, social login, oauth providers, session management, jwt tokens, 2fa, two-factor, passkeys, webauthn, multi-tenant auth, organizations, teams, rbac, role-based access, google auth, github auth, microsoft auth, apple auth, magic links, email password, better-auth setup, drizzle d1, kysely d1, session serialization error, cors auth, d1 adapter
license: MIT
metadata:
  version: "2.0.0"
  package_version: "1.3.34"
  last_verified: "2025-11-08"
  errors_prevented: 12
  templates_included: 4
  references_included: 7
---

# better-auth

**Status**: Production Ready
**Last Updated**: 2025-11-08
**Package**: `better-auth@1.3.34`
**Dependencies**: Drizzle ORM or Kysely (required for D1)

---

## Quick Start (5 Minutes)

### Installation

**Option 1: Drizzle ORM (Recommended)**
```bash
npm install better-auth drizzle-orm drizzle-kit
```

**Option 2: Kysely**
```bash
npm install better-auth kysely @noxharmonium/kysely-d1
```

### ⚠️ CRITICAL: D1 Adapter Requirements

better-auth **DOES NOT** have a direct `d1Adapter()`. You **MUST** use either:
1. **Drizzle ORM** (recommended) - `drizzleAdapter()`
2. **Kysely** (alternative) - Kysely instance with D1Dialect

```typescript
// ❌ WRONG - This doesn't exist
import { d1Adapter } from 'better-auth/adapters/d1'

// ✅ CORRECT - Use Drizzle
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
```

### Minimal Setup (Cloudflare Workers + Drizzle)

**1. Create D1 Database:**
```bash
wrangler d1 create my-app-db
```

**2. Define Schema** (`src/db/schema.ts`):
```typescript
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull().default(false),
  image: text(),
});

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text().notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
});

// See references/database-schema.ts for complete schema
```

**3. Initialize Auth** (`src/auth.ts`):
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export function createAuth(env: { DB: D1Database; BETTER_AUTH_SECRET: string }) {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: { enabled: true },
  });
}
```

**4. Create Worker** (`src/index.ts`):
```typescript
import { Hono } from "hono";
import { createAuth } from "./auth";

const app = new Hono<{ Bindings: Env }>();

app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export default app;
```

**5. Deploy:**
```bash
npx drizzle-kit generate
wrangler d1 migrations apply my-app-db --remote
wrangler deploy
```

---

## Critical Rules

### Always Do

✅ **Use Drizzle or Kysely adapter** (not non-existent d1Adapter)

✅ **Use Drizzle Kit for migrations** (not `better-auth migrate`)

✅ **Configure CORS with credentials: true** for cross-origin requests

✅ **Set BETTER_AUTH_SECRET** environment variable (generate with `openssl rand -base64 32`)

✅ **Match OAuth callback URLs exactly** in provider settings (https, no trailing slash)

✅ **Apply migrations to local D1** before running wrangler dev

✅ **Use KV for session storage** if experiencing D1 consistency issues

✅ **Request sufficient OAuth scopes** for user profile data (email, profile, etc.)

✅ **Implement sendVerificationEmail handler** for email verification to work

✅ **Use camelCase column names** in schema (or CamelCasePlugin with Kysely)

### Never Do

❌ **Never use `d1Adapter`** - it doesn't exist (use drizzleAdapter or Kysely)

❌ **Never use `better-auth migrate`** with D1 - use Drizzle Kit instead

❌ **Never forget CORS credentials** - sessions won't persist without it

❌ **Never mismatch OAuth callback URLs** - auth will fail with redirect_uri_mismatch

❌ **Never omit required packages** - install drizzle-orm, drizzle-kit, etc.

❌ **Never use snake_case columns** without CamelCasePlugin (causes field mismatch)

❌ **Never skip local migrations** - wrangler dev will fail with "table not found"

❌ **Never hardcode secrets** - use wrangler secret put

❌ **Never request insufficient scopes** - user data will be missing

❌ **Never leave sendVerificationEmail unimplemented** - emails won't send

---

## Top 5 Errors (See references/error-catalog.md for all 12)

### Error #1: "d1Adapter is not exported"
**Problem**: Trying to use non-existent `d1Adapter`
**Solution**: Use `drizzleAdapter` or Kysely instead (see Quick Start above)

### Error #2: Schema Generation Fails
**Problem**: `better-auth migrate` doesn't work with D1
**Solution**: Use `npx drizzle-kit generate` then `wrangler d1 migrations apply`

### Error #3: CamelCase vs snake_case Mismatch
**Problem**: Database uses `email_verified` but better-auth expects `emailVerified`
**Solution**: Use camelCase in schema or add `CamelCasePlugin` to Kysely

### Error #4: CORS Errors
**Problem**: `Access-Control-Allow-Origin` errors, cookies not sent
**Solution**: Configure CORS with `credentials: true` and correct origins

### Error #5: OAuth Redirect URI Mismatch
**Problem**: Social sign-in fails with "redirect_uri_mismatch"
**Solution**: Ensure exact match: `https://yourdomain.com/api/auth/callback/google`

**Load `references/error-catalog.md` for all 12 errors with detailed solutions.**

---

## Common Use Cases

### Use Case 1: Email/Password Authentication
**When**: Basic authentication without social providers
**Quick Pattern**:
```typescript
// Client
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Server - enable in config
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
}
```
**Load**: `references/setup-guide.md` → Step 5

### Use Case 2: Social Authentication (Google, GitHub)
**When**: Allow users to sign in with social accounts
**Quick Pattern**:
```typescript
// Client
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});

// Server config
socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    scope: ["openid", "email", "profile"],
  },
}
```
**Load**: `references/setup-guide.md` → Step 5

### Use Case 3: Protected API Routes
**When**: Need to verify user is authenticated
**Quick Pattern**:
```typescript
app.get("/api/protected", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ data: "protected", user: session.user });
});
```
**Load**: `references/cloudflare-worker-drizzle.ts`

### Use Case 4: Multi-Tenant with Organizations
**When**: Building SaaS with teams/organizations
**Load**: `references/advanced-features.md` → Organizations & Teams

### Use Case 5: Two-Factor Authentication
**When**: Need extra security with 2FA/TOTP
**Load**: `references/advanced-features.md` → Two-Factor Authentication

---

## When to Load References

**Load `references/setup-guide.md` when**:
- User needs complete 8-step setup walkthrough
- User asks about Kysely adapter alternative
- User needs help with migrations or deployment
- User asks about wrangler.toml configuration

**Load `references/error-catalog.md` when**:
- Encountering any of the 12 documented errors
- User reports D1 adapter, schema, CORS, or OAuth issues
- User asks about troubleshooting or debugging
- User needs prevention checklist

**Load `references/advanced-features.md` when**:
- User asks about 2FA, passkeys, or magic links
- User needs organizations, teams, or RBAC
- User asks about rate limiting or session management
- User wants migration guide from Clerk or Auth.js
- User needs security best practices or performance optimization

**Load `references/cloudflare-worker-drizzle.ts` when**:
- User needs complete Worker implementation example
- User asks for production-ready code
- User wants to see full auth flow with protected routes

**Load `references/cloudflare-worker-kysely.ts` when**:
- User prefers Kysely over Drizzle
- User asks for Kysely-specific implementation

**Load `references/database-schema.ts` when**:
- User needs complete better-auth schema with all tables
- User asks about custom tables or schema extension
- User needs TypeScript types for database

**Load `references/react-client-hooks.tsx` when**:
- User building React/Next.js frontend
- User needs login forms, session hooks, or protected routes
- User asks about client-side implementation

---

## Configuration Reference

### Minimal Configuration

```typescript
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "sqlite" }),
});
```

### Production Configuration

```typescript
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, { provider: "sqlite" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<a href="${url}">Verify Email</a>`,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email", "profile"],
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: ["user:email", "read:user"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
});
```

### wrangler.toml

```toml
name = "my-app"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "your-database-id"

[vars]
BETTER_AUTH_URL = "https://yourdomain.com"

# Set via: wrangler secret put SECRET_NAME
# - BETTER_AUTH_SECRET
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET
```

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete 8-step setup (D1 → Drizzle → Deploy)
- **error-catalog.md** - All 12 errors with solutions and prevention checklist
- **advanced-features.md** - 2FA, organizations, rate limiting, passkeys, magic links, migrations
- **cloudflare-worker-drizzle.ts** - Complete Worker with Drizzle auth
- **cloudflare-worker-kysely.ts** - Complete Worker with Kysely auth
- **database-schema.ts** - Complete better-auth Drizzle schema
- **react-client-hooks.tsx** - React components with auth hooks

### Client Integration

**Create auth client** (`src/lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8787",
});
```

**Use in React**:
```typescript
import { authClient } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {session.user.email}</p>
      <button onClick={() => authClient.signOut()}>Sign Out</button>
    </div>
  );
}
```

---

## Dependencies

**Required**:
- `better-auth@^1.3.34` - Core authentication framework

**Choose ONE adapter**:
- `drizzle-orm@^0.36.0` + `drizzle-kit@^0.28.0` (recommended)
- `kysely@^0.27.0` + `@noxharmonium/kysely-d1@^2.3.0` (alternative)

**Optional**:
- `@cloudflare/workers-types` - TypeScript types for Workers
- `hono@^4.0.0` - Web framework for routing
- `@better-auth/google` - Google OAuth provider
- `@better-auth/github` - GitHub OAuth provider

---

## Official Documentation

- **better-auth Docs**: https://better-auth.com
- **GitHub**: https://github.com/better-auth/better-auth (22.4k ⭐)
- **Examples**: https://github.com/better-auth/better-auth/tree/main/examples
- **Drizzle Docs**: https://orm.drizzle.team/docs/get-started-sqlite
- **Kysely Docs**: https://kysely.dev/
- **Discord**: https://discord.gg/better-auth

---

## Comparison: better-auth vs Alternatives

| Feature              | better-auth      | Clerk           | Auth.js         |
| -------------------- | ---------------- | --------------- | --------------- |
| **Hosting**          | Self-hosted      | Third-party     | Self-hosted     |
| **Cost**             | Free (OSS)       | $25/mo+         | Free (OSS)      |
| **Cloudflare D1**    | ✅ Drizzle/Kysely | ❌ No           | ✅ Adapter      |
| **Social Auth**      | ✅ 10+ providers  | ✅ Many         | ✅ Many         |
| **2FA/Passkeys**     | ✅ Plugin         | ✅ Built-in     | ⚠️ Limited      |
| **Organizations**    | ✅ Plugin         | ✅ Built-in     | ❌ No           |
| **Vendor Lock-in**   | ✅ None           | ❌ High         | ✅ None         |

**Recommendation**:
- **Use better-auth if**: Self-hosted, Cloudflare D1, want full control, avoid vendor lock-in
- **Use Clerk if**: Want managed service, don't mind cost, need fastest setup
- **Use Auth.js if**: Already using Next.js, basic needs, familiar with it

---

## Production Examples

**Verified working repositories** (all use Drizzle or Kysely):

1. **zwily/example-react-router-cloudflare-d1-drizzle-better-auth** - Drizzle
2. **matthewlynch/better-auth-react-router-cloudflare-d1** - Kysely
3. **foxlau/react-router-v7-better-auth** - Drizzle
4. **zpg6/better-auth-cloudflare** - Drizzle (includes CLI)

**None** use a direct `d1Adapter` - all require Drizzle/Kysely.

---

## Complete Setup Checklist

- [ ] Installed better-auth + Drizzle OR Kysely
- [ ] Created D1 database with wrangler
- [ ] Defined database schema with required tables (user, session, account, verification)
- [ ] Generated and applied migrations to D1
- [ ] Set BETTER_AUTH_SECRET environment variable
- [ ] Configured baseURL in auth config
- [ ] Enabled authentication methods (emailAndPassword, socialProviders)
- [ ] Configured CORS with credentials: true
- [ ] Set OAuth callback URLs in provider settings
- [ ] Tested auth routes (/api/auth/*)
- [ ] Tested sign-in, sign-up, session verification
- [ ] Deployed to Cloudflare Workers

---

**Questions? Issues?**

1. Check `references/error-catalog.md` for all 12 errors and solutions
2. Review `references/setup-guide.md` for complete 8-step setup
3. See `references/advanced-features.md` for 2FA, organizations, and more
4. Check official docs: https://better-auth.com
5. Ensure you're using **Drizzle or Kysely** (not non-existent d1Adapter)
