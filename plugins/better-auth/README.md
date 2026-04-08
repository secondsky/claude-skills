# better-auth Skill

**Production-ready authentication for TypeScript with Cloudflare D1 support + 18 frameworks**

---

## What This Skill Does

Provides complete patterns for implementing authentication with **better-auth**, a comprehensive TypeScript auth framework. Primary focus on Cloudflare Workers + D1 via **Drizzle ORM** or **Kysely**, with additional reference files for Next.js, Nuxt, Remix, SvelteKit, Express, and more.

**⚠️ v2.0.0 Breaking Change**: Previous skill version incorrectly documented a non-existent `d1Adapter()`. This version corrects all patterns to use Drizzle ORM or Kysely as required by better-auth.

**🆕 v3.0.0**: Updated to better-auth@1.6.0 with v1.5 and v1.6 features: D1 native support, OAuth 2.1 Provider, Electron, i18n, OpenTelemetry, passkey pre-auth, dynamic base URL, SSO production hardening, test utils, secret key rotation, and more.

---

## Auto-Trigger Keywords

This skill should be automatically invoked when you mention:

- **"better-auth"** - The library name
- **"authentication with D1"** - Cloudflare D1 auth setup
- **"self-hosted auth"** - Alternative to managed services
- **"alternative to Clerk"** - Migration or comparison
- **"alternative to Auth.js"** - Upgrading from Auth.js
- **"TypeScript authentication"** - Type-safe auth
- **"better auth setup"** - Initial configuration
- **"social auth with Cloudflare"** - OAuth on Workers
- **"D1 authentication"** - Database-backed auth on D1
- **"multi-tenant auth"** - SaaS authentication patterns
- **"organization auth"** - Team/org features
- **"2FA authentication"** - Two-factor auth setup
- **"passkeys"** - Passwordless auth
- **"magic link auth"** - Email-based passwordless
- **"better-auth CLI"** - CLI tool usage
- **"Electron auth"** - Desktop app authentication
- **"better-auth i18n"** - Error message translations
- **"OpenTelemetry auth"** - Distributed tracing
- **"test better-auth"** - Testing utilities
- **"SAML authentication"** - SAML/SSO setup
- **"OAuth 2.1"** - Standards compliance
- **"better-auth Next.js"** - Next.js integration
- **"better-auth Nuxt"** - Nuxt 3 integration
- **"better-auth Stripe"** - Payment integration

---

## When to Use This Skill

✅ **Use this skill when**:
- Building authentication for Cloudflare Workers + D1 applications
- Need a self-hosted, vendor-independent auth solution
- Migrating from Clerk to avoid vendor lock-in and costs
- Upgrading from Auth.js to get more features (2FA, organizations, RBAC)
- Implementing multi-tenant SaaS with organizations/teams
- Require advanced features: 2FA, passkeys, social auth, rate limiting
- Want full control over auth logic and data

❌ **Don't use this skill when**:
- You're happy with Clerk and don't mind the cost
- Using Firebase Auth (different ecosystem)
- Building a simple prototype (Auth.js may be faster)
- Auth requirements are extremely basic (custom JWT might suffice)

---

## What You'll Get

### Patterns Included

1. **Cloudflare Workers + D1** - Complete Worker setup with Drizzle/Kysely
2. **18 Frameworks** - Next.js, Nuxt, Remix, SvelteKit, Express, Fastify, NestJS, Hono, Expo
3. **9 Database Adapters** - PostgreSQL, MongoDB, MySQL, D1, SQLite, Prisma, and more
4. **30+ Plugins** - 2FA, passkeys, organizations, SSO/SAML, SCIM, Stripe, API keys
5. **45+ OAuth Providers** - Google, GitHub, Microsoft, Apple, Discord, Patreon, Vercel
6. **Migration Guides** - From Clerk, Auth.js, Auth0, Supabase, WorkOS
7. **Interactive Commands** - `/better-auth-setup`, `/better-auth-add-plugin`
8. **Debugging Agent** - Autonomous auth issue diagnosis

### Errors Prevented (15 Common Issues)

- ✅ **D1 adapter misconfiguration** (use D1 native or Drizzle/Kysely)
- ✅ **Schema generation failures** (using `npx auth generate` or Drizzle Kit)
- ✅ D1 eventual consistency causing stale session reads
- ✅ CORS misconfiguration for SPA applications
- ✅ Session serialization errors in Workers
- ✅ OAuth redirect URI mismatch
- ✅ Email verification not sending
- ✅ JWT token expiration issues
- ✅ Password hashing performance bottlenecks (non-blocking scrypt in v1.6)
- ✅ Social provider scope issues (missing user data)
- ✅ Multi-tenant data leakage
- ✅ Rate limit false positives
- ✅ Session freshness issues (`createdAt` vs `updatedAt` in v1.6)
- ✅ SAML replay attacks (InResponseTo default ON in v1.6)
- ✅ API key import errors (moved to `@better-auth/api-key` in v1.5)

### Reference Files (32 total)

**Core**:
- **`references/setup-guide.md`** - 8-step D1 setup walkthrough
- **`references/error-catalog.md`** - 15 errors with solutions
- **`references/advanced-features.md`** - 2FA, organizations, migrations
- **`references/v1.4-features.md`** - Background tasks, new OAuth, CLI
- **`references/v1.5-features.md`** - D1 native, OAuth 2.1 Provider, Electron, i18n, secret rotation
- **`references/v1.6-features.md`** - OpenTelemetry, passkey pre-auth, non-blocking scrypt
- **`references/migration-guide-1.5.0.md`** - Upgrading to v1.5.0+

**Frameworks** (`references/frameworks/`):
- **nextjs.md**, **nuxt.md**, **remix.md**, **sveltekit.md**, **api-frameworks.md**, **expo-mobile.md**

**Databases** (`references/databases/`):
- **postgresql.md**, **mongodb.md**, **mysql.md**

**Plugins** (`references/plugins/`):
- **authentication.md** (2FA, passkeys incl. pre-auth), **enterprise.md** (SSO, SCIM), **api-tokens.md** (API keys, org-owned), **payments.md** (Stripe), **sso.md** (production OIDC/SAML), **test-utils.md** (testing helpers)

**Integrations** (`references/integrations/`):
- **electron.md** - Electron desktop auth

**Scripts**:
- **`scripts/generate-secret.sh`** - Generate BETTER_AUTH_SECRET
- **`scripts/validate-config.ts`** - Validate auth configuration
- **`scripts/test-auth-health.sh`** - Test auth endpoints

---

## Quick Example

### Cloudflare Worker Setup (Drizzle ORM)

**v1.5.0+**: D1 can now be used directly without Drizzle. For simple setups:

```typescript
import { betterAuth } from 'better-auth'

const auth = betterAuth({
    database: env.DB, // D1 binding, auto-detected
    secret: env.BETTER_AUTH_SECRET,
})
```

For complex schemas with Drizzle ORM:

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from './db/schema' // Your Drizzle schema

type Env = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.all('/api/auth/*', async (c) => {
  // Initialize Drizzle with D1
  const db = drizzle(c.env.DB, { schema })

  const auth = betterAuth({
    // Use Drizzle adapter with SQLite provider
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: c.env.GOOGLE_CLIENT_ID,
        clientSecret: c.env.GOOGLE_CLIENT_SECRET
      }
    }
  })

  return auth.handler(c.req.raw)
})

export default app
```

**Required dependencies**:
```bash
bun add better-auth drizzle-orm drizzle-kit @cloudflare/workers-types hono  # preferred
# or: npm install better-auth drizzle-orm drizzle-kit @cloudflare/workers-types hono
```

**Complete setup guide**: See SKILL.md for full step-by-step instructions including schema definition, migrations, and deployment.

---

## Performance

- **Token Savings**: ~70% (15k → 4.5k tokens)
- **Time Savings**: ~2-3 hours of setup and debugging
- **Error Prevention**: 15 documented issues with solutions

---

## Comparison to Alternatives

| Feature | better-auth | Clerk | Auth.js |
|---------|-------------|-------|---------|
| **Hosting** | Self-hosted | Third-party | Self-hosted |
| **Cost** | Free | $25/mo+ | Free |
| **Cloudflare D1** | ✅ First-class | ❌ No | ✅ Adapter |
| **2FA/Passkeys** | ✅ Plugin | ✅ Built-in | ⚠️ Limited |
| **Organizations** | ✅ Plugin | ✅ Built-in | ❌ No |
| **Vendor Lock-in** | ✅ None | ❌ High | ✅ None |

---

## Production Tested

- **Project**: better-chatbot (https://github.com/cgoinglove/better-chatbot)
- **Stars**: 852
- **Status**: Active production deployment
- **Stack**: Next.js + PostgreSQL + better-auth + Vercel AI SDK

---

## Official Resources

- **Docs**: https://better-auth.com
- **GitHub**: https://github.com/better-auth/better-auth (22.4k ⭐)
- **Package**: `better-auth@1.6.0`
- **Examples**: https://github.com/better-auth/better-auth/tree/main/examples
- **Changelog**: https://www.better-auth.com/changelogs

---

## Installation

```bash
bun add better-auth  # preferred
# or: npm install better-auth
# or: pnpm add better-auth
# or: yarn add better-auth
```

**For Cloudflare D1**:
```bash
bun add @cloudflare/workers-types  # preferred
# or: npm install @cloudflare/workers-types
```

**For PostgreSQL**:
```bash
bun add pg drizzle-orm  # preferred
# or: npm install pg drizzle-orm
```

---

## Version Info

- **Skill Version**: 3.0.0 (v1.5/v1.6 features: D1 native, Electron, i18n, OpenTelemetry, SSO, test utils)
- **Package Version**: better-auth@1.6.0
- **Drizzle ORM**: drizzle-orm@0.45.1, drizzle-kit@0.31.8
- **Kysely**: kysely@0.28.9, @noxharmonium/kysely-d1@0.4.0
- **Last Verified**: 2026-04-08
- **Compatibility**: Node.js 18+, Bun 1.0+, Cloudflare Workers

---

## License

MIT (same as better-auth)

---

**Questions?** Check the official docs or ask Claude Code to invoke this skill!
