---
name: clerk-auth
description: Clerk authentication for React, Next.js, Cloudflare Workers. Use for auth setup, protected routes, JWT verification/templates, clerkMiddleware, shadcn/ui integration, testing flows, or encountering secret key errors, JWKS cache issues, JWT size limits, CSRF vulnerabilities.

  Keywords: clerk, clerk auth, clerk authentication, @clerk/nextjs, @clerk/backend, @clerk/clerk-react, clerkMiddleware, createRouteMatcher, verifyToken, useUser, useAuth, useClerk, JWT template, JWT claims, JWT shortcodes, custom JWT, session claims, getToken template, user.public_metadata, org_id, org_slug, org_role, CustomJwtSessionClaims, sessionClaims metadata, clerk webhook, clerk secret key, clerk publishable key, protected routes, Cloudflare Workers auth, Next.js auth, shadcn/ui auth, @hono/clerk-auth, "Missing Clerk Secret Key", "cannot be used as a JSX component", JWKS error, authorizedParties, clerk middleware, ClerkProvider, UserButton, SignIn, SignUp, clerk testing, test emails, test phone numbers, +clerk_test, 424242 OTP, session token, testing token, @clerk/testing, playwright testing, E2E testing, clerk test mode, bot detection, generate session token, test users
license: MIT
---

# Clerk Authentication

**Status**: Production Ready ✅
**Last Updated**: 2025-11-21
**Dependencies**: None
**Latest Versions**: @clerk/nextjs@6.35.3, @clerk/backend@2.17.2, @clerk/clerk-react@5.51.0, @clerk/testing@1.4.4

---

## Quick Start (10 Minutes)

Choose your framework:
- [React (Vite)](#react-vite-setup) - ClerkProvider + hooks
- [Next.js App Router](#nextjs-app-router-setup) - Middleware + async auth()
- [Cloudflare Workers](#cloudflare-workers-setup) - Backend verification

---

## React (Vite) Setup

### 1. Install Clerk

\`\`\`bash
bun add @clerk/clerk-react
\`\`\`

**Latest Version**: @clerk/clerk-react@5.51.0 (verified 2025-10-22)

### 2. Configure ClerkProvider

Update \`src/main.tsx\`:

\`\`\`typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Get publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
\`\`\`

**CRITICAL**:
- Use \`VITE_\` prefix for environment variables in Vite
- ClerkProvider must wrap your entire app
- Source: https://clerk.com/docs/references/react/clerk-provider

### 3. Add Environment Variables

Create \`.env.local\`:

\`\`\`bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
\`\`\`

**Security Note**: Only \`VITE_\` prefixed vars are exposed to client code.

### 4. Use Authentication Hooks

\`\`\`typescript
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'

function App() {
  // Get user object (includes email, metadata, etc.)
  const { isLoaded, isSignedIn, user } = useUser()

  // Get auth state and session methods
  const { userId, sessionId, getToken } = useAuth()

  // Get Clerk instance for advanced operations
  const { openSignIn, signOut } = useClerk()

  // Always check isLoaded before rendering auth-dependent UI
  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <button onClick={() => openSignIn()}>Sign In</button>
  }

  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
\`\`\`

**Why This Matters**:
- \`isLoaded\` prevents flash of wrong content
- \`useUser()\` provides full user object with metadata
- \`useAuth()\` provides session tokens and auth state
- Source: https://clerk.com/docs/references/react/use-user

---

## Next.js App Router Setup

### 1. Install Clerk

\`\`\`bash
bun add @clerk/nextjs
\`\`\`

**Latest Version**: @clerk/nextjs@6.33.3 (verified 2025-10-22)
- **New in v6**: Async auth() helper, Next.js 15 support, static rendering by default
- Source: https://clerk.com/changelog/2024-10-22-clerk-nextjs-v6

### 2. Configure Environment Variables

Create \`.env.local\`:

\`\`\`bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Customize sign-in/up pages
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
\`\`\`

**CRITICAL**:
- \`CLERK_SECRET_KEY\` must NEVER be exposed to client
- Use \`NEXT_PUBLIC_\` prefix for client-side vars only
- Source: https://clerk.com/docs/guides/development/clerk-environment-variables

### 3. Add Middleware for Route Protection

Create \`middleware.ts\` in project root:

\`\`\`typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes are public (everything else requires auth)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Clerk webhooks should be public
])

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
\`\`\`

**CRITICAL**:
- \`auth.protect()\` is async in v6 (breaking change from v5)
- \`createRouteMatcher()\` accepts glob patterns
- Alternative: protect specific routes instead of inverting logic
- Source: https://clerk.com/docs/reference/nextjs/clerk-middleware

### 4. Wrap App with ClerkProvider

Update \`app/layout.tsx\`:

\`\`\`typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
\`\`\`

### 5. Use auth() in Server Components

\`\`\`typescript
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  // Get auth state (lightweight)
  const { userId, sessionId } = await auth()

  // Get full user object (heavier, fewer calls)
  const user = await currentUser()

  if (!userId) {
    return <div>Unauthorized</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {userId}</p>
      <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  )
}
\`\`\`

**CRITICAL**:
- \`auth()\` is async in v6 (breaking change)
- Use \`auth()\` for lightweight checks
- Use \`currentUser()\` when you need full user object

---

## Cloudflare Workers Setup

### 1. Install Dependencies

\`\`\`bash
bun add @clerk/backend hono
\`\`\`

**Latest Versions**:
- @clerk/backend@2.17.2 (verified 2025-10-22)
- hono@4.10.1

### 2. Configure Environment Variables

Create \`.dev.vars\` for local development:

\`\`\`bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
\`\`\`

**Production**: Use \`wrangler secret put CLERK_SECRET_KEY\`

### 3. Implement Token Verification

Create \`src/index.ts\`:

\`\`\`typescript
import { Hono } from 'hono'
import { verifyToken } from '@clerk/backend'

type Bindings = {
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
}

type Variables = {
  userId: string | null
  sessionClaims: any | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware: Verify Clerk token
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    c.set('userId', null)
    c.set('sessionClaims', null)
    return next()
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const { data, error } = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      // IMPORTANT: Set authorizedParties to prevent CSRF attacks
      authorizedParties: ['https://yourdomain.com'],
    })

    if (error) {
      console.error('Token verification failed:', error)
      c.set('userId', null)
      c.set('sessionClaims', null)
    } else {
      c.set('userId', data.sub)
      c.set('sessionClaims', data)
    }
  } catch (err) {
    console.error('Token verification error:', err)
    c.set('userId', null)
    c.set('sessionClaims', null)
  }

  return next()
})

// Protected route
app.get('/api/protected', (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    message: 'This is protected',
    userId,
    sessionClaims: c.get('sessionClaims'),
  })
})

export default app
\`\`\`

**CRITICAL**:
- Always set \`authorizedParties\` to prevent CSRF attacks
- Use \`secretKey\`, not deprecated \`apiKey\`
- Source: https://clerk.com/docs/reference/backend/verify-token

---

## JWT Templates & Custom Claims

Clerk allows customizing JWT (JSON Web Token) structure using templates. This enables integration with third-party services, role-based access control, and multi-tenant applications.

### Quick Start: Create a JWT Template

**1. Navigate to Clerk Dashboard**:
- Go to **Sessions** page
- Click **Customize session token**
- Click **Create template**

**2. Define Template**:
```json
{
  "user_id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role || 'user'}}"
}
```

**3. Use Template in Code**:
```typescript
// Frontend (React/Next.js)
const { getToken } = useAuth()
const token = await getToken({ template: 'my-template' })

// Backend (Cloudflare Workers)
const sessionClaims = c.get('sessionClaims')
const role = sessionClaims?.role
```

### Available Shortcodes

| Category | Shortcodes | Example |
|----------|-----------|---------|
| **User ID & Name** | `{{user.id}}`, `{{user.first_name}}`, `{{user.last_name}}`, `{{user.full_name}}` | `"John Doe"` |
| **Contact** | `{{user.primary_email_address}}`, `{{user.primary_phone_address}}` | `"john@example.com"` |
| **Profile** | `{{user.image_url}}`, `{{user.username}}`, `{{user.created_at}}` | `"https://..."` |
| **Verification** | `{{user.email_verified}}`, `{{user.phone_number_verified}}` | `true` |
| **Metadata** | `{{user.public_metadata}}`, `{{user.public_metadata.FIELD}}` | `{"role": "admin"}` |
| **Organization** | `org_id`, `org_slug`, `org_role` (in sessionClaims) | `"org:admin"` |

### Advanced Features

**String Interpolation**:
```json
{
  "full_name": "{{user.last_name}} {{user.first_name}}",
  "greeting": "Hello, {{user.first_name}}!"
}
```

**Conditional Fallbacks**:
```json
{
  "role": "{{user.public_metadata.role || 'user'}}",
  "age": "{{user.public_metadata.age || 18}}",
  "verified": "{{user.email_verified || user.phone_number_verified}}"
}
```

**Nested Metadata with Dot Notation**:
```json
{
  "interests": "{{user.public_metadata.profile.interests}}",
  "department": "{{user.public_metadata.department}}"
}
```

### Default Claims (Auto-Included)

Every JWT includes these claims automatically (cannot be overridden):

```json
{
  "azp": "http://localhost:3000",              // Authorized party
  "exp": 1639398300,                            // Expiration time
  "iat": 1639398272,                            // Issued at
  "iss": "https://your-app.clerk.accounts.dev", // Issuer
  "jti": "10db7f531a90cb2faea4",               // JWT ID
  "nbf": 1639398220,                            // Not before
  "sub": "user_1deJLArSTiWiF1YdsEWysnhJLLY"    // User ID
}
```

### Size Limitation: 1.2KB for Custom Claims

**Problem**: Browser cookies limited to 4KB. Clerk's default claims consume ~2.8KB, leaving **1.2KB for custom claims**.

**⚠️ Development Note**: When testing custom claims in Vite dev mode, you may encounter **"431 Request Header Fields Too Large"** error. This is caused by Clerk's handshake token in the URL exceeding Vite's 8KB limit. See [Issue #11](#issue-11-431-request-header-fields-too-large-vite-dev-mode) for solution.

**Solution**:
```json
// ✅ GOOD: Minimal claims
{
  "user_id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role}}"
}

// ❌ BAD: Exceeds limit
{
  "bio": "{{user.public_metadata.bio}}",  // 6KB field
  "all_metadata": "{{user.public_metadata}}"  // Entire object
}
```

**Best Practice**: Store large data in database, include only identifiers/roles in JWT.

### TypeScript Type Safety

Add global type declarations for auto-complete:

**Create `types/globals.d.ts`**:
```typescript
export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'admin' | 'moderator' | 'user'
      onboardingComplete?: boolean
      organizationId?: string
    }
  }
}
```

### Common Use Cases

**Role-Based Access Control**:
```json
{
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role || 'user'}}",
  "permissions": "{{user.public_metadata.permissions}}"
}
```

**Multi-Tenant Applications**:
```json
{
  "user_id": "{{user.id}}",
  "org_id": "{{user.public_metadata.org_id}}",
  "org_role": "{{user.public_metadata.org_role}}"
}
```

**Supabase Integration**:
```json
{
  "email": "{{user.primary_email_address}}",
  "app_metadata": {
    "provider": "clerk"
  },
  "user_metadata": {
    "full_name": "{{user.full_name}}"
  }
}
```

### See Also

- **Complete Reference**: See `references/jwt-claims-guide.md` for comprehensive documentation
- **Template Examples**: See `templates/jwt/` directory for working examples
- **TypeScript Types**: See `templates/typescript/custom-jwt-types.d.ts`
- **Official Docs**: https://clerk.com/docs/guides/sessions/jwt-templates

---

## Testing

Clerk provides comprehensive testing tools for local development and CI/CD pipelines.

### Quick Start: Test Credentials

**Test Emails** (no emails sent, fixed OTP):
```
john+clerk_test@example.com
jane+clerk_test@gmail.com
```

**Test Phone Numbers** (no SMS sent, fixed OTP):
```
+12015550100
+19735550133
```

**Fixed OTP Code**: `424242` (works for all test credentials)

### Generate Session Tokens

For testing API endpoints, generate valid session tokens (60-second lifetime):

```bash
# Using the provided script
CLERK_SECRET_KEY=sk_test_... node scripts/generate-session-token.js

# Create new test user
CLERK_SECRET_KEY=sk_test_... node scripts/generate-session-token.js --create-user

# Auto-refresh token every 50 seconds
CLERK_SECRET_KEY=sk_test_... node scripts/generate-session-token.js --refresh
```

**Manual Flow**:
1. Create user: `POST /v1/users`
2. Create session: `POST /v1/sessions`
3. Generate token: `POST /v1/sessions/{session_id}/tokens`
4. Use in header: `Authorization: Bearer <token>`

### E2E Testing with Playwright

Install `@clerk/testing` for automatic Testing Token management:

```bash
bun add -d @clerk/testing
```

**Global Setup** (`global.setup.ts`):
```typescript
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

setup('global setup', async ({}) => {
  await clerkSetup()
})
```

**Test File** (`auth.spec.ts`):
```typescript
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test } from '@playwright/test'

test('sign up', async ({ page }) => {
  await setupClerkTestingToken({ page })

  await page.goto('/sign-up')
  await page.fill('input[name="emailAddress"]', 'test+clerk_test@example.com')
  await page.fill('input[name="password"]', 'TestPassword123!')
  await page.click('button[type="submit"]')

  // Verify with fixed OTP
  await page.fill('input[name="code"]', '424242')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

### Testing Tokens (Bot Detection Bypass)

Testing Tokens bypass bot detection in test suites.

**Obtain Token**:
```bash
curl -X POST https://api.clerk.com/v1/testing_tokens \
  -H "Authorization: Bearer sk_test_..."
```

**Use in Frontend API Requests**:
```
POST https://your-app.clerk.accounts.dev/v1/client/sign_ups?__clerk_testing_token=TOKEN
```

**Note**: `@clerk/testing` handles this automatically for Playwright/Cypress.

### Production Limitations

Testing Tokens work in both development and production, but:
- ❌ Code-based auth (SMS/Email OTP) not supported in production
- ✅ Email + password authentication supported
- ✅ Magic links supported

### See Also

- **Complete Guide**: See `references/testing-guide.md` for comprehensive testing documentation
- **Session Token Script**: See `scripts/generate-session-token.js`
- **Demo Repository**: https://github.com/clerk/clerk-playwright-nextjs
- **Official Docs**: https://clerk.com/docs/guides/development/testing/overview

---

## Known Issues Prevention

This skill prevents **11 documented issues**:

### Issue #1: Missing Clerk Secret Key
**Error**: "Missing Clerk Secret Key or API Key"
**Source**: https://stackoverflow.com/questions/77620604
**Prevention**: Always set in \`.env.local\` or via \`wrangler secret put\`

### Issue #2: API Key → Secret Key Migration
**Error**: "apiKey is deprecated, use secretKey"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Replace \`apiKey\` with \`secretKey\` in all calls

### Issue #3: JWKS Cache Race Condition
**Error**: "No JWK available"
**Source**: https://github.com/clerk/javascript/blob/main/packages/backend/CHANGELOG.md
**Prevention**: Use @clerk/backend@2.17.2 or later (fixed)

### Issue #4: Missing authorizedParties (CSRF)
**Error**: No error, but CSRF vulnerability
**Source**: https://clerk.com/docs/reference/backend/verify-token
**Prevention**: Always set \`authorizedParties: ['https://yourdomain.com']\`

### Issue #5: Import Path Changes (Core 2)
**Error**: "Cannot find module"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Update import paths for Core 2

### Issue #6: JWT Size Limit Exceeded
**Error**: Token exceeds size limit
**Source**: https://clerk.com/docs/backend-requests/making/custom-session-token
**Prevention**: Keep custom claims under 1.2KB

### Issue #7: Deprecated API Version v1
**Error**: "API version v1 is deprecated"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Use latest SDK versions (API v2025-04-10)

### Issue #8: ClerkProvider JSX Component Error
**Error**: "cannot be used as a JSX component"
**Source**: https://stackoverflow.com/questions/79265537
**Prevention**: Ensure React 19 compatibility with @clerk/clerk-react@5.51.0+

### Issue #9: Async auth() Helper Confusion
**Error**: "auth() is not a function"
**Source**: https://clerk.com/changelog/2024-10-22-clerk-nextjs-v6
**Prevention**: Always await: \`const { userId } = await auth()\`

### Issue #10: Environment Variable Misconfiguration
**Error**: "Missing Publishable Key" or secret leaked
**Prevention**: Use correct prefixes (\`NEXT_PUBLIC_\`, \`VITE_\`), never commit secrets

### Issue #11: 431 Request Header Fields Too Large (Vite Dev Mode)
**Error**: "431 Request Header Fields Too Large" when signing in
**Source**: Common in Vite dev mode when testing custom JWT claims
**Cause**: Clerk's `__clerk_handshake` token in URL exceeds Vite's 8KB header limit
**Prevention**:

Add to `package.json`:
\`\`\`json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-http-header-size=32768' vite"
  }
}
\`\`\`

**Temporary Workaround**: Clear browser cache, sign out, sign back in

**Why**: Clerk dev tokens are larger than production; custom JWT claims increase handshake token size

**Note**: This is different from Issue #6 (session token size). Issue #6 is about cookies (1.2KB), this is about URL parameters in dev mode (8KB → 32KB).

---

## Critical Rules

### Always Do

✅ Set \`authorizedParties\` when verifying tokens
✅ Use \`CLERK_SECRET_KEY\` environment variable
✅ Check \`isLoaded\` before rendering auth UI
✅ Use \`getToken()\` fresh for each request
✅ Await \`auth()\` in Next.js v6+
✅ Use \`NEXT_PUBLIC_\` prefix for client vars only
✅ Store secrets via \`wrangler secret put\`
✅ Implement middleware for route protection
✅ Use API version 2025-04-10 or later

### Never Do

❌ Store \`CLERK_SECRET_KEY\` in client code
❌ Use deprecated \`apiKey\` parameter
❌ Store tokens in localStorage
❌ Skip \`authorizedParties\` check
❌ Exceed 1.2KB for custom JWT claims
❌ Forget to check \`isLoaded\`
❌ Expose secrets with \`NEXT_PUBLIC_\` prefix
❌ Use API version v1

---

## When to Load References

| Reference | Load When... |
|-----------|--------------|
| `common-errors.md` | Debugging authentication failures, token issues, or 401/403 errors |
| `jwt-claims-guide.md` | Setting up custom JWT claims, RBAC, multi-tenant auth, or Supabase integration |
| `testing-guide.md` | Writing E2E tests with Playwright, generating test session tokens |

---

## Official Documentation

- **Clerk Docs**: https://clerk.com/docs
- **Next.js Guide**: https://clerk.com/docs/references/nextjs/overview
- **React Guide**: https://clerk.com/docs/references/react/overview
- **Backend SDK**: https://clerk.com/docs/reference/backend/overview
- **JWT Templates**: https://clerk.com/docs/guides/sessions/jwt-templates
- **shadcn/ui Integration**: https://clerk.com/docs/guides/development/shadcn-cli
- **Context7 Library ID**: \`/clerk/clerk-docs\`

---

## Package Versions (Verified 2025-10-22)

\`\`\`json
{
  "dependencies": {
    "@clerk/nextjs": "^6.33.3",
    "@clerk/clerk-react": "^5.51.0",
    "@clerk/backend": "^2.17.2"
  }
}
\`\`\`
