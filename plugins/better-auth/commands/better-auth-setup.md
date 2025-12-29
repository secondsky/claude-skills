---
name: better-auth:setup
description: Interactive setup wizard for better-auth authentication. Guides through database, framework, OAuth providers, and plugin configuration.
---

# better-auth Setup Wizard

This command walks through configuring better-auth for your project.

## Step 1: Gather Requirements

Use the AskUserQuestion tool to collect configuration preferences:

### Question 1: Database
```
Which database will you use?
- Cloudflare D1 (Recommended for Cloudflare)
- PostgreSQL (Drizzle)
- PostgreSQL (Prisma)
- MongoDB
- MySQL
- SQLite
```

### Question 2: ORM (if applicable)
```
Which ORM do you prefer?
- Drizzle ORM (Recommended)
- Prisma
- Kysely
- None (Direct adapter)
```

### Question 3: Framework
```
Which framework are you using?
- Cloudflare Workers + Hono
- Next.js (App Router)
- Next.js (Pages Router)
- Nuxt 3
- Remix
- SvelteKit
- Express
- Fastify
- Expo (React Native)
```

### Question 4: OAuth Providers
```
Which OAuth providers do you need? (Select all that apply)
- Google
- GitHub
- Microsoft/Azure AD
- Apple
- Discord
- Twitter/X
- None (Email/password only)
```

### Question 5: Plugins
```
Which features do you need? (Select all that apply)
- Two-Factor Authentication (2FA)
- Passkeys (WebAuthn)
- Magic Links
- Organizations (Multi-tenancy)
- API Keys
- Admin Dashboard
- None
```

## Step 2: Generate Configuration

Based on answers, generate the appropriate files:

### Core Files to Create

1. **`src/auth.ts`** (or `lib/auth.ts`)
   - betterAuth configuration
   - Database adapter
   - Selected plugins
   - OAuth providers

2. **Database Schema**
   - For Drizzle: `src/db/schema.ts`
   - For Prisma: `prisma/schema.prisma`
   - For D1: Include in Drizzle schema

3. **Auth Route**
   - Cloudflare: `src/index.ts` with Hono
   - Next.js App: `app/api/auth/[...all]/route.ts`
   - Next.js Pages: `pages/api/auth/[...all].ts`
   - Nuxt: `server/api/auth/[...all].ts`
   - Remix: `app/routes/api.auth.$.tsx`
   - SvelteKit: `src/routes/api/auth/[...all]/+server.ts`

4. **Client**
   - `src/lib/auth-client.ts` or framework equivalent
   - Include selected client plugins

5. **Environment Variables Template**
   - `.env.example` with all required variables

## Step 3: Framework-Specific Setup

### Cloudflare Workers + Hono

Load `references/core-setup.md` and `references/cloudflare-binding.md` for:
- wrangler.jsonc configuration
- D1 binding setup
- Environment variables in Cloudflare Dashboard

### Next.js

Load `references/frameworks/nextjs.md` for:
- Route handler setup
- Middleware for protected routes
- Server Components integration

### Nuxt 3

Load `references/frameworks/nuxt.md` for:
- H3 event handler
- Composables setup
- Middleware configuration

### Expo/React Native

Load `references/frameworks/expo-mobile.md` for:
- SecureStore configuration
- Deep linking for OAuth
- Session management

## Step 4: Database Setup

### Cloudflare D1

```bash
# Create D1 database
wrangler d1 create auth-db

# Generate schema
bunx drizzle-kit generate

# Apply migrations
wrangler d1 migrations apply auth-db --local
```

### PostgreSQL

```bash
# Generate migrations
bunx drizzle-kit generate
# OR for Prisma
bunx prisma generate

# Apply migrations
bunx drizzle-kit push
# OR for Prisma
bunx prisma migrate dev
```

### MongoDB

No migrations needed - collections created automatically.

## Step 5: Environment Variables

Generate `.env.example`:

```env
# Required
BETTER_AUTH_SECRET=  # Generate: openssl rand -base64 32
APP_URL=http://localhost:3000

# Database (choose one)
DATABASE_URL=  # PostgreSQL/MySQL
MONGODB_URI=   # MongoDB

# OAuth (if selected)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare (if applicable)
# Set via: wrangler secret put BETTER_AUTH_SECRET
```

## Step 6: Generate Secret

Run the generate-secret script:
```bash
./scripts/generate-secret.sh
```

Or manually:
```bash
openssl rand -base64 32
```

## Step 7: Verification

After setup, verify configuration:

```bash
# Run validation script
npx tsx scripts/validate-config.ts

# Test auth endpoints
./scripts/test-auth-health.sh
```

## Step 8: Next Steps

Provide user with:
1. List of created files
2. Commands to run (install deps, migrations)
3. Link to relevant documentation
4. Common next steps:
   - Set up OAuth app credentials
   - Configure email provider (if using verification)
   - Add protected routes
   - Customize UI

## Example Output

```
✓ Created src/auth.ts (Cloudflare D1 + Drizzle)
✓ Created src/db/schema.ts (user, session, account, verification)
✓ Created src/lib/auth-client.ts
✓ Created .env.example
✓ Updated wrangler.jsonc with D1 binding

Next steps:
1. Generate secret: ./scripts/generate-secret.sh
2. Set secret: wrangler secret put BETTER_AUTH_SECRET
3. Create D1 database: wrangler d1 create auth-db
4. Generate migrations: bunx drizzle-kit generate
5. Apply migrations: wrangler d1 migrations apply auth-db --local

Documentation:
- Setup guide: references/core-setup.md
- D1 integration: references/cloudflare-binding.md
- OAuth setup: https://better-auth.com/docs/authentication/social-sign-in
```
