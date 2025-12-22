# Better-Auth Configuration Guide

**Last Updated**: 2025-11-27
**Package**: `better-auth@1.4.3`
**Requirements**: ESM-only (v1.4.0+)

---

## Overview

This guide provides complete configuration examples for better-auth v1.4.0+ with Cloudflare D1, Drizzle ORM, and Hono.

**CRITICAL**: better-auth v1.4.0+ is **ESM-only**. CommonJS is no longer supported.

---

## ESM Requirements

### package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "better-auth": "^1.4.3",
    "drizzle-orm": "^0.44.7",
    "hono": "^4.0.0"
  }
}
```

### Import Syntax

```typescript
// ✅ CORRECT (ESM)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// ❌ WRONG (CommonJS - no longer works)
const { betterAuth } = require('better-auth');
```

---

## Minimal Configuration

For quick setup with email/password authentication:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export function createAuth(env: {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}) {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite" }),
  });
}
```

---

## Production Configuration

Complete setup with email/password and social providers:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db, { provider: "sqlite" }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendVerificationEmail: async ({ user, url, token, ctx }) => {
        // v1.4.0+: callback signature changed (request → ctx)
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
      // v1.4.3+ New: Vercel provider
      vercel: {
        clientId: env.VERCEL_CLIENT_ID,
        clientSecret: env.VERCEL_CLIENT_SECRET,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update every 24 hours
      // v1.4.0+: JWE encryption by default (cookie caching)
    },

    // v1.4.0+ New: Trusted proxy headers support
    trustedOrigins: ["https://yourdomain.com"],
  });
}
```

---

## wrangler.toml Configuration

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

# Set secrets via: wrangler secret put SECRET_NAME
# Required secrets:
# - BETTER_AUTH_SECRET (generate: openssl rand -base64 32)
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET
```

---

## Environment Variables

### Local Development (.dev.vars)

```bash
# DO NOT COMMIT THIS FILE
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=your-secret-here-generate-with-openssl
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
```

### Production Secrets

```bash
# Set via Wrangler CLI (not in wrangler.toml)
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

---

## Advanced Configuration Options

### CORS Configuration

For cross-origin requests (e.g., frontend on different domain):

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/auth/*", cors({
  origin: ["https://yourdomain.com", "http://localhost:3000"],
  credentials: true, // CRITICAL: Required for sessions
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});
```

### Session Configuration (v1.4.0+)

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // Update every 24 hours

  // v1.4.0+ New: Cookie caching with JWE encryption (stateless sessions)
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minutes
    strategy: "jwe", // "jwe", "jwt", or "compact" for stateless sessions
  },
  // Note: For stateless sessions, omit database session storage and use cookieCache strategy
}
```

### Rate Limiting Configuration

```typescript
import { betterAuth } from "better-auth";
import { rateLimit } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    rateLimit({
      window: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute
    }),
  ],
});
```

### API Key Plugin (v1.4.0+)

```typescript
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    apiKey({
      // Enable API key authentication
      enabled: true,
    }),
  ],
});
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  }
}
```

### Type Definitions

```typescript
// src/types/env.d.ts
export interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}
```

---

## Migration from v1.3.x

If upgrading from better-auth v1.3.x, see `migration-guide-1.4.0.md` for:
- ESM migration steps
- API rename changes
- Callback signature updates
- Breaking changes checklist

---

## Troubleshooting

### "Cannot use import statement outside a module"

**Cause**: Missing `"type": "module"` in package.json
**Fix**: Add to package.json: `{ "type": "module" }`

### CORS Errors

**Cause**: Missing `credentials: true` in CORS config
**Fix**: Ensure CORS middleware includes `credentials: true`

### Session Not Persisting

**Cause**: Cookie domain mismatch or missing CORS credentials
**Fix**:
1. Verify `baseURL` matches deployed domain
2. Ensure CORS `credentials: true`
3. Check cookie `SameSite` and `Secure` settings

### OAuth Redirect URI Mismatch

**Cause**: Callback URL doesn't match provider settings
**Fix**: Ensure exact match in provider settings:
- ✅ `https://yourdomain.com/api/auth/callback/google`
- ❌ `https://yourdomain.com/api/auth/callback/google/` (trailing slash)
- ❌ `http://yourdomain.com/api/auth/callback/google` (http vs https)

---

## Official Documentation

- **better-auth Docs**: https://better-auth.com
- **v1.4.0 Changelog**: https://www.better-auth.com/blog/1-4
- **Drizzle ORM**: https://orm.drizzle.team
- **Cloudflare D1**: https://developers.cloudflare.com/d1

---

**Last verified**: 2025-11-27 with better-auth@1.4.3
