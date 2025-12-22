# better-auth Error Catalog

Complete catalog of 15 documented errors with solutions and troubleshooting.

**Last Updated**: 2025-11-27 (Added v1.4.0+ errors #13-#15)

---

## Error #1: "d1Adapter is not exported"

**Error**: `import { d1Adapter } from 'better-auth/adapters/d1'` - TypeScript error or runtime error

**Source**: Verified from 4 production repositories using better-auth + D1

**Why It Happens**: better-auth does NOT have a direct D1 adapter. This is a common misconception.

**Solution**: Use Drizzle or Kysely instead:

```typescript
// ❌ WRONG - This doesn't exist
import { d1Adapter } from 'better-auth/adapters/d1'
database: d1Adapter(env.DB)

// ✅ CORRECT - Use Drizzle
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
const db = drizzle(env.DB, { schema })
database: drizzleAdapter(db, { provider: "sqlite" })

// ✅ CORRECT - Use Kysely
import { Kysely } from 'kysely'
import { D1Dialect } from '@noxharmonium/kysely-d1'
database: {
  db: new Kysely({ dialect: new D1Dialect({ database: env.DB }) }),
  type: "sqlite"
}
```

---

## Error #2: Schema Generation Fails

**Error**: `npx better-auth migrate` doesn't create D1-compatible schema

**Source**: https://better-auth.com/docs/concepts/database#migrations

**Why It Happens**: better-auth's built-in migration tool may not generate SQLite-compatible SQL for D1

**Solution**: Use Drizzle Kit to generate migrations:

```bash
# Generate migration from Drizzle schema
npx drizzle-kit generate

# Apply to D1
wrangler d1 migrations apply my-app-db --remote
```

**Why**: Drizzle Kit generates SQLite-compatible SQL that works perfectly with D1.

---

## Error #3: CamelCase vs snake_case Column Mismatch

**Error**: Database has `email_verified` but better-auth expects `emailVerified`

**Source**: https://better-auth.com/docs/concepts/database#naming-conventions

**Why It Happens**: Naming convention mismatch between database schema and better-auth expectations

**Solution**: Use `CamelCasePlugin` with Kysely or configure Drizzle properly:

**With Kysely**:
```typescript
import { CamelCasePlugin } from "kysely";

new Kysely({
  dialect: new D1Dialect({ database: env.DB }),
  plugins: [new CamelCasePlugin()], // Converts between naming conventions
})
```

**With Drizzle**: Define schema with camelCase from the start:
```typescript
export const user = sqliteTable("user", {
  emailVerified: integer({ mode: "boolean" }), // camelCase
  // NOT: email_verified
});
```

---

## Error #4: D1 Eventual Consistency Issues

**Error**: Session reads immediately after write return stale data

**Source**: Cloudflare D1 documentation on eventual consistency

**Why It Happens**: D1 has eventual consistency - writes may not be immediately visible to subsequent reads

**Solution**: Use Cloudflare KV for session storage (strong consistency):

```typescript
import { betterAuth } from "better-auth";

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    session: {
      storage: {
        get: async (sessionId) => {
          const session = await env.SESSIONS_KV.get(sessionId);
          return session ? JSON.parse(session) : null;
        },
        set: async (sessionId, session, ttl) => {
          await env.SESSIONS_KV.put(sessionId, JSON.stringify(session), {
            expirationTtl: ttl,
          });
        },
        delete: async (sessionId) => {
          await env.SESSIONS_KV.delete(sessionId);
        },
      },
    },
  });
}
```

**Add to `wrangler.toml`**:
```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "your-kv-namespace-id"
```

---

## Error #5: CORS Errors for SPA Applications

**Error**: `Access-Control-Allow-Origin` errors in browser console

**Source**: https://better-auth.com/docs/concepts/cors

**Why It Happens**: CORS errors when auth API is on different origin than frontend

**Solution**: Configure CORS headers in Worker:

```typescript
import { cors } from "hono/cors";

app.use(
  "/api/auth/*",
  cors({
    origin: ["https://yourdomain.com", "http://localhost:3000"],
    credentials: true, // CRITICAL - Allow cookies
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
```

---

## Error #6: OAuth Redirect URI Mismatch

**Error**: Social sign-in fails with "redirect_uri_mismatch" error

**Source**: OAuth provider documentation (Google, GitHub, etc.)

**Why It Happens**: OAuth callback URL doesn't match exactly what's configured in provider settings

**Solution**: Ensure exact match in OAuth provider settings:

```
Provider setting: https://yourdomain.com/api/auth/callback/google
better-auth URL:  https://yourdomain.com/api/auth/callback/google

❌ Wrong: http vs https, trailing slash, subdomain mismatch
✅ Right: Exact character-for-character match
```

**Check better-auth callback URL**:
```typescript
// It's always: {baseURL}/api/auth/callback/{provider}
const callbackURL = `${env.BETTER_AUTH_URL}/api/auth/callback/google`;
console.log("Configure this URL in Google Console:", callbackURL);
```

---

## Error #7: Missing Dependencies

**Error**: `Cannot find module 'drizzle-orm'` or similar TypeScript/runtime errors

**Source**: Package installation

**Why It Happens**: Required packages not installed

**Solution**: Install all required packages:

**For Drizzle approach**:
```bash
npm install better-auth drizzle-orm drizzle-kit @cloudflare/workers-types
```

**For Kysely approach**:
```bash
npm install better-auth kysely @noxharmonium/kysely-d1 @cloudflare/workers-types
```

---

## Error #8: Email Verification Not Sending

**Error**: Email verification links never arrive

**Source**: https://better-auth.com/docs/authentication/email-password

**Why It Happens**: `sendVerificationEmail` handler not implemented

**Solution**: Implement email sending handler:

```typescript
export const auth = betterAuth({
  database: /* ... */,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      // Use your email service (SendGrid, Resend, etc.)
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `
          <p>Click the link below to verify your email:</p>
          <a href="${url}">Verify Email</a>
          <p>Or use this code: ${token}</p>
        `,
      });
    },
  },
});
```

**For Cloudflare**: Use Cloudflare Email Routing or external service (Resend, SendGrid).

---

## Error #9: Session Expires Too Quickly

**Error**: Session expires unexpectedly or never expires

**Source**: https://better-auth.com/docs/concepts/session

**Why It Happens**: Default session expiration not configured correctly

**Solution**: Configure session expiration:

```typescript
export const auth = betterAuth({
  database: /* ... */,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (in seconds)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
});
```

---

## Error #10: Social Provider Missing User Data

**Error**: Social sign-in succeeds but missing user data (name, avatar)

**Source**: OAuth provider scope documentation

**Why It Happens**: Not requesting sufficient scopes from OAuth provider

**Solution**: Request additional scopes:

```typescript
socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    scope: ["openid", "email", "profile"], // Include 'profile' for name/image
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    scope: ["user:email", "read:user"], // 'read:user' for full profile
  },
}
```

---

## Error #11: TypeScript Errors with Drizzle Schema

**Error**: `Type 'DrizzleD1Database' is not assignable to...`

**Source**: TypeScript type inference

**Why It Happens**: Incorrect type exports from database module

**Solution**: Export proper types from database:

```typescript
// src/db/index.ts
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export function createDatabase(d1: D1Database): Database {
  return drizzle(d1, { schema });
}
```

---

## Error #12: Wrangler Dev Mode Not Working

**Error**: `wrangler dev` fails with database errors like "Database not found"

**Source**: Wrangler D1 local development

**Why It Happens**: Migrations not applied to local D1 database

**Solution**: Apply migrations locally first:

```bash
# Apply migrations to local D1
wrangler d1 migrations apply my-app-db --local

# Then run dev server
wrangler dev
```

---

## Error #13: "forgetPassword is not a function" (v1.4.0+)

**Error**: `TypeError: authClient.forgetPassword is not a function`

**Source**: https://github.com/better-auth/better-auth/issues/2946

**Why It Happens**: v1.4.0 renamed `forgetPassword` to `requestPasswordReset`

**Solution**: Update all password reset calls:

```typescript
// ❌ WRONG (v1.3.x API)
await authClient.forgetPassword({
  email: "user@example.com",
  redirectTo: "/reset-password",
});

// ✅ CORRECT (v1.4.0+ API)
await authClient.requestPasswordReset({
  email: "user@example.com",
  redirectTo: "/reset-password",
});
```

**Prevention**: When upgrading to v1.4.0+, search codebase for `forgetPassword` and replace all occurrences.

---

## Error #14: "Cannot use import statement outside a module"

**Error**: `SyntaxError: Cannot use import statement outside a module`

**Source**: better-auth v1.4.0 ESM-only requirement

**Why It Happens**: Missing `"type": "module"` in package.json or trying to use CommonJS

**Solution**: Enable ESM in your project:

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev": "wrangler dev"
  }
}
```

Also update tsconfig.json:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

**Prevention**: better-auth v1.4.0+ is ESM-only. Do NOT use `require()`. Only use `import`.

---

## Error #15: "request is undefined" in callbacks (v1.4.0+)

**Error**: `TypeError: Cannot read property 'headers' of undefined` or `request is not defined`

**Source**: v1.4.0 callback signature change

**Why It Happens**: Callback functions changed from `request` parameter to `ctx` parameter

**Solution**: Update callback signatures:

```typescript
// ❌ WRONG (v1.3.x signature)
emailAndPassword: {
  sendVerificationEmail: async ({ user, url, request }) => {
    const origin = request.headers.get('origin');
    // ...
  },
}

// ✅ CORRECT (v1.4.0+ signature)
emailAndPassword: {
  sendVerificationEmail: async ({ user, url, ctx }) => {
    const origin = ctx.request.headers.get('origin');
    // ...
  },
}
```

**Prevention**: When upgrading to v1.4.0+, search for all callback functions with `request` parameter and change to `ctx`, then access via `ctx.request`.

---

## Troubleshooting Guide

### Problem: better-auth routes return 404

**Solution**:
1. Verify route handler: `app.all("/api/auth/*", async (c) => { ... })`
2. Check `baseURL` matches your deployment URL
3. Test with: `curl http://localhost:8787/api/auth/session`

### Problem: Session not persisting across requests

**Solution**:
1. Ensure CORS `credentials: true` is set
2. Check cookies are being sent (same-site policy)
3. Verify `BETTER_AUTH_SECRET` is set correctly
4. Use KV for session storage if D1 consistency is an issue

### Problem: OAuth returns "invalid_client" error

**Solution**:
1. Verify client ID and secret are correct
2. Check environment variables are set: `wrangler secret list`
3. Ensure secrets match OAuth provider configuration
4. Test callback URL is accessible

### Problem: Database queries fail with "no such table"

**Solution**:
1. Run migrations: `wrangler d1 migrations apply my-app-db --local`
2. Check schema.ts defines all required tables
3. Verify Drizzle config points to correct schema file
4. Regenerate migrations: `npx drizzle-kit generate`

---

## Prevention Checklist

Use this to avoid all 15 errors:

- [ ] Using **Drizzle or Kysely adapter** (not non-existent d1Adapter)
- [ ] Using **Drizzle Kit** for schema migrations (not better-auth migrate)
- [ ] Schema uses **camelCase** column names (or CamelCasePlugin with Kysely)
- [ ] Using **KV for sessions** if experiencing D1 consistency issues
- [ ] CORS configured with `credentials: true` for cross-origin requests
- [ ] OAuth **callback URLs match exactly** in provider settings
- [ ] All **required packages installed** (drizzle-orm, drizzle-kit, etc.)
- [ ] **Email sending handler** implemented (sendVerificationEmail)
- [ ] Session **expiration configured** appropriately
- [ ] OAuth **scopes include profile data** (email, profile, read:user)
- [ ] Database **types exported correctly** from db module
- [ ] Migrations **applied to local D1** before running wrangler dev

---

**Official Resources**:
- better-auth Troubleshooting: https://better-auth.com/docs/troubleshooting
- Drizzle + D1: https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
