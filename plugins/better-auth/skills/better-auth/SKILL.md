---
name: better-auth
description: better-auth authentication for TypeScript with Cloudflare D1 via Drizzle ORM/Kysely. Use for self-hosted auth, social providers, 2FA, passkeys, RBAC, or encountering D1 adapter, schema generation, session, CORS, OAuth flow errors.
keywords: better-auth, authentication, cloudflare d1 auth, drizzle orm auth, kysely auth, self-hosted auth, typescript auth, clerk alternative, auth.js alternative, social login, oauth providers, session management, jwt tokens, 2fa, two-factor, passkeys, webauthn, multi-tenant auth, organizations, teams, rbac, role-based access, google auth, github auth, microsoft auth, apple auth, magic links, email password, better-auth setup, drizzle d1, kysely d1, session serialization error, cors auth, d1 adapter
license: MIT
metadata:
  version: "2.1.0"
  package_version: "1.4.3"
  last_verified: "2025-11-27"
  errors_prevented: 15
  templates_included: 4
  references_included: 10
---

# better-auth

**Status**: Production Ready
**Last Updated**: 2025-11-27
**Package**: `better-auth@1.4.3` (ESM-only)
**Dependencies**: Drizzle ORM or Kysely (required for D1)

---

## Quick Start (5 Minutes)

### Installation

**Option 1: Drizzle ORM (Recommended)**
```bash
bun add better-auth drizzle-orm drizzle-kit
```

**Option 2: Kysely**
```bash
bun add better-auth kysely @noxharmonium/kysely-d1
```

### ⚠️ v1.4.0+ Requirements

better-auth v1.4.0+ is **ESM-only**. Ensure:

**package.json**:
```json
{
  "type": "module"
}
```

**Upgrading from v1.3.x?** Load `references/migration-guide-1.4.0.md`

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
bunx drizzle-kit generate
wrangler d1 migrations apply my-app-db --remote
wrangler deploy
```

---

## Critical Rules

### MUST DO

✅ Use Drizzle/Kysely adapter (d1Adapter doesn't exist)
✅ Use Drizzle Kit for migrations (not `better-auth migrate`)
✅ Set BETTER_AUTH_SECRET via `wrangler secret put`
✅ Configure CORS with `credentials: true`
✅ Match OAuth callback URLs exactly (no trailing slash)
✅ Apply migrations to local D1 before `wrangler dev`
✅ Use camelCase column names in schema

### NEVER DO

❌ Use `d1Adapter` or `better-auth migrate` with D1
❌ Forget CORS credentials or mismatch OAuth URLs
❌ Use snake_case columns without CamelCasePlugin
❌ Skip local migrations or hardcode secrets
❌ Leave sendVerificationEmail unimplemented

### ⚠️ v1.4.0+ Breaking Changes

**ESM-only** (no CommonJS):
```json
// package.json required
{ "type": "module" }
```

**API Renames**:
- `forgetPassword` → `requestPasswordReset`
- POST `/account-info` → GET `/account-info`

**Callback Signatures**:
```typescript
// v1.3.x: request parameter
sendVerificationEmail: async ({ user, url, request }) => {}

// v1.4.0+: ctx parameter
sendVerificationEmail: async ({ user, url, ctx }) => {}
```

**Load `references/migration-guide-1.4.0.md` when upgrading from <1.4.0**

---

## Top 5 Errors (See references/error-catalog.md for all 15)

### Error #1: "d1Adapter is not exported"
**Problem**: Trying to use non-existent `d1Adapter`
**Solution**: Use `drizzleAdapter` or Kysely instead (see Quick Start above)

### Error #2: Schema Generation Fails
**Problem**: `better-auth migrate` doesn't work with D1
**Solution**: Use `bunx drizzle-kit generate` then `wrangler d1 migrations apply`

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

**Load `references/configuration-guide.md` when**:
- User asks about production configuration
- User needs environment variable setup or wrangler.toml
- User asks about session configuration or ESM setup
- User needs CORS configuration, rate limiting, or API keys
- User asks about troubleshooting configuration issues

**Load `references/framework-comparison.md` when**:
- User asks "better-auth vs Clerk" or "vs Auth.js"
- User needs help choosing auth framework
- User wants feature comparison, migration advice, or cost analysis
- User asks about v1.4.0+ new features (database joins, stateless sessions)

**Load `references/migration-guide-1.4.0.md` when**:
- User upgrading from better-auth <1.4.0 to 1.4.0+
- User encounters `forgetPassword` errors or ESM issues
- User asks about breaking changes or migration steps
- User needs to migrate callback functions or API endpoints

---

## Configuration Reference

**Quick Config** (ESM-only in v1.4.0+):
```typescript
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "sqlite" }),
});
```

**Load `references/configuration-guide.md` for**:
- Production configuration with email/password and social providers
- wrangler.toml setup and environment variables
- Session configuration, CORS setup, and ESM requirements
- Rate limiting, API keys (v1.4.0+), and troubleshooting

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
- `better-auth@^1.4.3` - Core authentication framework (ESM-only)

**Choose ONE adapter**:
- `drizzle-orm@^0.44.7` + `drizzle-kit@^0.31.7` (recommended)
- `kysely@^0.28.8` + `@noxharmonium/kysely-d1@^0.4.0` (alternative)

**Optional**:
- `@cloudflare/workers-types` - TypeScript types for Workers
- `hono@^4.0.0` - Web framework for routing
- `@better-auth/passkey` - Passkey plugin (v1.4.0+, separate package)
- `@better-auth/api-key` - API key auth (v1.4.0+)

---

## Official Documentation

- **better-auth Docs**: https://better-auth.com
- **GitHub**: https://github.com/better-auth/better-auth (22.4k ⭐)
- **Examples**: https://github.com/better-auth/better-auth/tree/main/examples
- **Drizzle Docs**: https://orm.drizzle.team/docs/get-started-sqlite
- **Kysely Docs**: https://kysely.dev/
- **Discord**: https://discord.gg/better-auth

---

## Framework Comparison

**Load `references/framework-comparison.md` for**:
- Complete feature comparison: better-auth vs Clerk vs Auth.js
- v1.4.0+ new features (database joins, stateless sessions, API keys)
- Migration paths, cost analysis, and performance benchmarks
- Recommendations by use case and 5-year TCO

---

## Production Examples

**Verified working repositories** (all use Drizzle or Kysely):

1. **zwily/example-react-router-cloudflare-d1-drizzle-better-auth** - Drizzle
2. **matthewlynch/better-auth-react-router-cloudflare-d1** - Kysely
3. **foxlau/react-router-v7-better-auth** - Drizzle
4. **zpg6/better-auth-cloudflare** - Drizzle (includes CLI)

**Note**: Check each repo's better-auth version. Repos on v1.3.x need v1.4.0+ migration (see `references/migration-guide-1.4.0.md`). None use a direct `d1Adapter` - all require Drizzle/Kysely.

---

## Complete Setup Checklist

- [ ] Verified ESM support (`"type": "module"` in package.json) - v1.4.0+ required
- [ ] Installed better-auth@1.4.3+ + Drizzle OR Kysely
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
- [ ] Using requestPasswordReset (not forgetPassword) - v1.4.0+ API
- [ ] Deployed to Cloudflare Workers

---

**Questions? Issues?**

1. Check `references/error-catalog.md` for all 12 errors and solutions
2. Review `references/setup-guide.md` for complete 8-step setup
3. See `references/advanced-features.md` for 2FA, organizations, and more
4. Check official docs: https://better-auth.com
5. Ensure you're using **Drizzle or Kysely** (not non-existent d1Adapter)
