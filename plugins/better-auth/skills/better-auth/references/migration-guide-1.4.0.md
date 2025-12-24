# Migration Guide: better-auth v1.3.x → v1.4.0+

**Published**: 2025-11-27
**Source**: https://www.better-auth.com/blog/1-4
**Breaking Changes**: Yes (8 major changes + 1 critical security fix)
**Migration Time**: 2.4-4.3 hours (depending on project size)

---

## Overview

better-auth v1.4.0 introduces significant improvements including database joins (2-3x faster queries), stateless sessions, API key authentication, and SCIM provisioning. However, these come with **8 breaking changes** that require code updates, plus a critical session fixation vulnerability fix that's automatically applied.

**This guide covers**:
- All 8 breaking changes with before/after code
- Critical session fixation vulnerability fix (automatic)
- Step-by-step migration process
- New v1.4.0 features and how to use them
- Troubleshooting common migration issues
- Rollback plan if needed

---

## Breaking Changes Summary

| Change | Impact | Migration Effort | Affected Code |
|--------|--------|------------------|---------------|
| 1. ESM-only | High | 30-60 min | package.json, all imports |
| 2. `forgetPassword` renamed | Medium | 15-30 min | Password reset flows |
| 3. `/account-info` method change | Low | 5-10 min | Account info API calls |
| 4. Callback signature (`request` → `ctx`) | Medium | 15-30 min | Email/SMS callbacks |
| 5. Passkey plugin package | Low | 5-10 min | If using passkeys |
| 6. `sendChangeEmailVerification` removal | Medium | 20-30 min | Email change flows |
| 7. API Key mock sessions disabled | Medium | 10-15 min | API key auth configs |
| 8. OIDC `redirectURLs` → `redirectUrls` | High | 30-60 min | OIDC configs + DB |

**Security Critical**: Session fixation vulnerability fix (automatic, no code changes required)

**Total Estimated Time**: 145-260 minutes (2.4-4.3 hours)

---

## Breaking Change #1: ESM-Only (No CommonJS)

### What Changed

better-auth v1.4.0+ requires **ES modules** (ESM). CommonJS (`require()`) is no longer supported.

### Impact

- All `require()` statements must become `import` statements
- package.json needs `"type": "module"`
- Build tools must support ESM

### Migration Steps

**Step 1**: Update package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  }
}
```

**Step 2**: Convert all imports

```typescript
// ❌ OLD (v1.3.x - CommonJS)
const { betterAuth } = require('better-auth');
const { drizzleAdapter } = require('better-auth/adapters/drizzle');

// ✅ NEW (v1.4.0+ - ESM)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
```

**Step 3**: Update tsconfig.json

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

### Verification

```bash
# This should work
node --input-type=module -e "import { betterAuth } from 'better-auth'; console.log('ESM works')"

# This should fail
node -e "const { betterAuth } = require('better-auth'); console.log('CJS')"
```

### Common Errors

**Error**: `Cannot use import statement outside a module`
**Fix**: Add `"type": "module"` to package.json

**Error**: `require is not defined`
**Fix**: Convert all `require()` to `import`

---

## Breaking Change #2: `forgetPassword` → `requestPasswordReset`

### What Changed

The password reset API was renamed for clarity:
- ❌ `forgetPassword` (deprecated)
- ✅ `requestPasswordReset` (new name)

### Impact

All password reset flows must update the method name.

### Migration

#### Server-side (auth config)

No changes needed - the server-side API remains the same.

#### Client-side (React, Vue, etc.)

```typescript
// ❌ OLD (v1.3.x)
await authClient.forgetPassword({
  email: "user@example.com",
  redirectTo: "/reset-password",
});

// ✅ NEW (v1.4.0+)
await authClient.requestPasswordReset({
  email: "user@example.com",
  redirectTo: "/reset-password",
});
```

#### Example React Component Update

```tsx
// ❌ OLD
function ForgotPassword() {
  const handleSubmit = async (email: string) => {
    await authClient.forgetPassword({ email });
  };
  // ...
}

// ✅ NEW
function ForgotPassword() {
  const handleSubmit = async (email: string) => {
    await authClient.requestPasswordReset({ email });
  };
  // ...
}
```

### Verification

```bash
# Search for old API usage
grep -r "forgetPassword" src/
# Should return nothing
```

### Common Errors

**Error**: `TypeError: authClient.forgetPassword is not a function`
**Fix**: Replace `forgetPassword` with `requestPasswordReset`

---

## Breaking Change #3: `/account-info` Endpoint Method

### What Changed

The `/account-info` endpoint changed from POST to GET:
- ❌ POST `/api/auth/account-info` (v1.3.x)
- ✅ GET `/api/auth/account-info` (v1.4.0+)

### Impact

Direct API calls to `/account-info` must change HTTP method.

### Migration

#### If using authClient (Recommended)

The authClient now handles the parameter migration automatically:

```typescript
// OLD (v1.3.x) - parameters in body (implicit)
const accountInfo = await authClient.getAccountInfo({
  // No body parameters needed in v1.3.x
});

// NEW (v1.4.0+) - parameters passed via options
const accountInfo = await authClient.getAccountInfo({
  queryOptions: {
    // Query parameters go here
    includeProfile: true,
    includeRoles: false
  }
});
```

Note: `authClient.getAccountInfo()` automatically converts the `queryOptions` object into URL query parameters and handles the GET request with credentials.

#### If making direct HTTP calls

Parameters must be moved from request body to URL query string:

```typescript
// ❌ OLD (v1.3.x) - parameters in POST body
const response = await fetch('/api/auth/account-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    includeProfile: true,
    includeRoles: false
  }),
});

// ✅ NEW (v1.4.0+) - parameters in GET query string
const response = await fetch('/api/auth/account-info?includeProfile=true&includeRoles=false', {
  method: 'GET',
  credentials: 'include',
  // Note: No Content-Type header or body needed for GET
});
```

#### Building Query Strings Programmatically

For complex parameter objects, use URLSearchParams:

```typescript
const params = new URLSearchParams({
  includeProfile: 'true',
  includeRoles: 'false',
  nestedField: JSON.stringify({ complex: 'object' }) // For nested objects
});

const response = await fetch(`/api/auth/account-info?${params.toString()}`, {
  method: 'GET',
  credentials: 'include',
});
```

### Verification

```bash
# Search for POST requests to account-info
grep -r "POST.*account-info" src/
# Should return nothing
```

---

## Breaking Change #4: Callback Function Signature

### What Changed

Callback functions now receive `ctx` instead of `request`:
- ❌ `request` parameter (v1.3.x)
- ✅ `ctx` parameter (v1.4.0+)

The `ctx` object contains the `request` plus additional context.

### Impact

All callback functions must update parameter names and access patterns.

### Migration

#### Email Verification Callback

```typescript
// ❌ OLD (v1.3.x)
emailAndPassword: {
  enabled: true,
  sendVerificationEmail: async ({ user, url, token, request }) => {
    const origin = request.headers.get('origin');

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${url}">Verify Email</a>`,
    });
  },
}

// ✅ NEW (v1.4.0+)
emailAndPassword: {
  enabled: true,
  sendVerificationEmail: async ({ user, url, token, ctx }) => {
    const origin = ctx.request.headers.get('origin');

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${url}">Verify Email</a>`,
    });
  },
}
```

#### Password Reset Callback

```typescript
// ❌ OLD (v1.3.x)
emailAndPassword: {
  sendResetPasswordEmail: async ({ user, url, request }) => {
    const baseUrl = request.headers.get('host');
    // ...
  },
}

// ✅ NEW (v1.4.0+)
emailAndPassword: {
  sendResetPasswordEmail: async ({ user, url, ctx }) => {
    const baseUrl = ctx.request.headers.get('host');
    // ...
  },
}
```

#### Custom Callbacks

```typescript
// ❌ OLD (v1.3.x)
onSuccess: async (session, request) => {
  console.log('Session created:', session.user.email);
  console.log('IP:', request.headers.get('x-forwarded-for'));
}

// ✅ NEW (v1.4.0+)
onSuccess: async (session, ctx) => {
  console.log('Session created:', session.user.email);
  console.log('IP:', ctx.request.headers.get('x-forwarded-for'));
  // ctx also includes: body, params, context
}
```

### What's in `ctx`?

```typescript
interface CallbackContext {
  request: Request;        // The original request object
  body: any;              // Parsed request body
  params: Record<string, string>;  // URL parameters
  context: any;           // Additional context
}
```

### Verification

```bash
# Search for old callback signatures
grep -r "async ({ .* request })" src/
# Should return nothing (or convert to ctx)
```

### Common Errors

**Error**: `TypeError: Cannot read property 'headers' of undefined`
**Fix**: Change `request` to `ctx.request` in callbacks

**Error**: `request is not defined`
**Fix**: Change callback parameter from `request` to `ctx`

---

## Breaking Change #5: Passkey Plugin Package

### What Changed

The passkey plugin was extracted to a separate npm package:
- ❌ `import { passkey } from "better-auth/plugins"` (v1.3.x)
- ✅ `import { passkey } from "@better-auth/passkey"` (v1.4.0+)

### Impact

If using passkeys, you must install the new package.

### Migration

**Step 1**: Install the passkey package

```bash
bun add @better-auth/passkey
# or
npm install @better-auth/passkey
```

**Step 2**: Update imports

```typescript
// ❌ OLD (v1.3.x)
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [passkey()],
});

// ✅ NEW (v1.4.0+)
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  plugins: [passkey()],
});
```

**Step 3**: Update dependencies

```json
{
  "dependencies": {
    "better-auth": "^1.4.3",
    "@better-auth/passkey": "^1.0.0"
  }
}
```

### Verification

```bash
# Check if package is installed
npm list @better-auth/passkey
```

---

## Breaking Change #6: `sendChangeEmailVerification` Removal

### What Changed

The `sendChangeEmailVerification` function was removed and consolidated into the generic `sendVerificationEmail`:
- ❌ `sendChangeEmailVerification` (v1.3.x)
- ✅ `emailVerification.sendVerificationEmail` (v1.4.0+)

### Impact

Email change verification flows must use the new API.

### Migration

```typescript
// ❌ OLD (v1.3.x)
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
      await sendEmail({
        to: newEmail,
        subject: "Confirm email change",
        html: `<a href="${url}">Confirm Email Change</a>`,
      });
    },
  },
});

// ✅ NEW (v1.4.0+)
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    sendResetPassword: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<a href="${url}">Reset Password</a>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token, isNewEmail }) => {
      // This handles both initial verification and email changes
      const to = isNewEmail ? isNewEmail : user.email;
      const subject = isNewEmail ? "Confirm email change" : "Verify your email";
      const html = `<a href="${url}">${isNewEmail ? 'Confirm Email Change' : 'Verify Email'}</a>`;
      
      await sendEmail({
        to,
        subject,
        html,
      });
    },
  },
});
```

### Verification

```bash
# Search for old function name
grep -r "sendChangeEmailVerification" src/
# Should return nothing
```

---

## Breaking Change #7: API Key Mock Sessions Disabled by Default

### What Changed

API key authentication no longer enables mock sessions by default for security:
- ❌ Mock sessions enabled by default (v1.3.x)
- ✅ Mock sessions disabled by default (v1.4.0+)

### Impact

API key authentication requires explicit opt-in for session mocking in development.

### Migration

```typescript
// ❌ OLD (v1.3.x) - mock sessions enabled automatically
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  apiKey: {
    enabled: true,
    // Mock sessions were enabled by default in development
  },
});

// ✅ NEW (v1.4.0+) - must explicitly enable mock sessions
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  apiKey: {
    enabled: true,
    mockSession: process.env.NODE_ENV === 'development', // Explicit opt-in
  },
});
```

### Why This Changed

Mock sessions in production could lead to security vulnerabilities. The new default requires developers to consciously enable this feature only in development environments.

### Verification

```bash
# Check API key configurations
grep -r "apiKey:" src/
# Verify mockSession is explicitly set if needed
```

---

## Breaking Change #8: OIDC Plugin `redirectURLs` → `redirectUrls`

### What Changed

The OIDC plugin configuration option name was corrected for consistency:
- ❌ `redirectURLs` (v1.3.x)
- ✅ `redirectUrls` (v1.4.0+)

### Impact

OIDC configurations must update the property name and may require database migration.

### Migration

**Step 1**: Update configuration

```typescript
// ❌ OLD (v1.3.x)
import { betterAuth } from "better-auth";
import { oidc } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    oidc({
      redirectURLs: [
        "https://app.example.com/auth/callback",
        "https://admin.example.com/auth/callback"
      ],
    }),
  ],
});

// ✅ NEW (v1.4.0+)
import { betterAuth } from "better-auth";
import { oidc } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    oidc({
      redirectUrls: [
        "https://app.example.com/auth/callback",
        "https://admin.example.com/auth/callback"
      ],
    }),
  ],
});
```

**Step 2**: Database migration (if using database storage)

The column name in your OIDC clients table may need to be updated:

```sql
-- For PostgreSQL/MySQL
ALTER TABLE oidc_clients RENAME COLUMN redirectURLs TO redirectUrls;

-- For SQLite (requires recreating table)
CREATE TABLE oidc_clients_new (
  -- ... other columns
  redirectUrls TEXT NOT NULL
);

INSERT INTO oidc_clients_new SELECT 
  id, 
  name, 
  -- ... other columns
  redirectURLs as redirectUrls,
  -- ... other columns
FROM oidc_clients;

DROP TABLE oidc_clients;
ALTER TABLE oidc_clients_new RENAME TO oidc_clients;
```

**Step 3**: Update Drizzle schema

```typescript
// ❌ OLD (v1.3.x)
export const oidcClientsTable = pgTable("oidc_clients", {
  // ... other columns
  redirectURLs: text("redirectURLs").notNull(),
});

// ✅ NEW (v1.4.0+)
export const oidcClientsTable = pgTable("oidc_clients", {
  // ... other columns
  redirectUrls: text("redirectUrls").notNull(),
});
```

### Verification

```bash
# Search for old configuration
grep -r "redirectURLs" src/
# Should return nothing
```

---

## Security Update: Session Fixation Vulnerability Fix

### What Changed

better-auth v1.4.0+ includes a critical security fix for session fixation attacks. The fix automatically regenerates session IDs after authentication and privilege elevation.

### Why This Matters

Session fixation attacks allow an attacker to fix a victim's session ID before login, then hijack the session after authentication. This fix prevents such attacks by:

1. **Automatic session regeneration** after successful authentication
2. **Session ID rotation** on privilege changes
3. **Enhanced session validation** checks

### Migration Impact

No code changes are required - the fix is automatically applied when upgrading to v1.4.0+. However, you should:

1. **Test all authentication flows** to ensure they work correctly
2. **Monitor for session-related errors** in the first week after upgrade
3. **Verify concurrent session handling** if your app supports multiple devices

### Verification

```bash
# Test login flow and verify session ID changes
# Before login: document session ID
# After login: confirm new session ID is generated
```

---

## Step-by-Step Migration Process

### Phase 1: Preparation (15 min)

1. **Backup your project**
   ```bash
   git commit -am "Pre-migration checkpoint: better-auth v1.3.x"
   git tag pre-migration-v1.3.x
   ```

2. **Review breaking changes**
   - Read this guide completely
   - Identify affected files in your project

3. **Check dependencies**
   ```bash
   npm list better-auth drizzle-orm drizzle-kit
   ```

### Phase 2: Update Dependencies (10 min)

```bash
# Update better-auth and related packages
bun add better-auth@^1.4.3 drizzle-orm@^0.44.7 drizzle-kit@^0.31.7

# If using passkeys
bun add @better-auth/passkey

# If using Kysely
bun add kysely@^0.28.8 @noxharmonium/kysely-d1@^0.4.0
```

### Phase 3: Enable ESM (20 min)

1. **Update package.json**
   ```json
   {
     "type": "module"
   }
   ```

2. **Convert all imports**
   ```bash
   # Find all require() statements
   grep -r "require(" src/

   # Convert manually or use codemod tool
   ```

3. **Update tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "bundler"
     }
   }
   ```

4. **Test ESM**
   ```bash
   bun run dev
   ```

### Phase 4: Update API Calls (30 min)

1. **Replace `forgetPassword`**
   ```bash
   # Find usage
   grep -r "forgetPassword" src/

   # Replace with requestPasswordReset
   ```

2. **Update callback signatures**
   ```bash
   # Find callbacks with 'request' parameter
   grep -r "async ({ .* request })" src/

   # Change to 'ctx' and update access patterns
   ```

3. **Update passkey imports** (if applicable)
   ```typescript
   // Change import source
   import { passkey } from "@better-auth/passkey";
   ```

### Phase 5: Testing (30 min)

1. **Unit tests**
   ```bash
   bun test
   ```

2. **Integration tests**
   - Test sign-in/sign-up flows
   - Test password reset
   - Test email verification
   - Test OAuth providers

3. **Manual testing**
   - Create new account
   - Sign in/out
   - Reset password
   - Check session persistence

### Phase 6: Deploy (15 min)

1. **Deploy to staging**
   ```bash
   wrangler deploy --env staging
   ```

2. **Test in staging**
   - Smoke test all auth flows
   - Check error logs

3. **Deploy to production**
   ```bash
   wrangler deploy
   ```

4. **Monitor**
   - Watch error rates
   - Check user login success rates
   - Monitor API latency

---

## New Features in v1.4.0+

After migrating, you can take advantage of new features:

### 1. Database Joins (2-3x Faster Queries)

```typescript
// Automatically enabled - no code changes needed
// Queries now use JOINs instead of multiple round-trips
const session = await auth.api.getSession({ headers });
// ^ This is now 2-3x faster
```

### 2. Stateless Sessions

```typescript
export const auth = betterAuth({
  session: {
    strategy: "jwt", // Enable stateless sessions
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
```

### 3. API Key Plugin

```typescript
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    apiKey({
      enabled: true,
    }),
  ],
});

// Usage
const apiKeyId = await auth.api.createApiKey({
  userId: session.user.id,
  name: "My API Key",
});
```

### 4. SCIM Provisioning

```typescript
import { scim } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    scim({
      enabled: true,
      token: env.SCIM_TOKEN,
    }),
  ],
});
```

### 5. Vercel OAuth Provider

```typescript
socialProviders: {
  vercel: {
    clientId: env.VERCEL_CLIENT_ID,
    clientSecret: env.VERCEL_CLIENT_SECRET,
  },
}
```

### 6. Trusted Proxy Headers

```typescript
export const auth = betterAuth({
  trustedOrigins: ["https://yourdomain.com"],
  // Supports X-Forwarded-For, X-Real-IP, etc.
});
```

---

## Troubleshooting

### Issue: "Cannot use import statement outside a module"

**Cause**: Missing `"type": "module"` in package.json
**Fix**:
```json
{
  "type": "module"
}
```

### Issue: "forgetPassword is not a function"

**Cause**: Using old API name after upgrade
**Fix**: Replace `forgetPassword` with `requestPasswordReset`

### Issue: "request is undefined" in callbacks

**Cause**: Callback signature changed from `request` to `ctx`
**Fix**: Change `async ({ user, request })` to `async ({ user, ctx })` and access via `ctx.request`

### Issue: "Module not found: @better-auth/passkey"

**Cause**: Passkey plugin moved to separate package
**Fix**: `bun add @better-auth/passkey`

### Issue: Sessions not persisting after upgrade

**Cause**: JWE encryption changed in v1.4.0
**Fix**: Users may need to re-authenticate. Consider:
```typescript
// Temporarily increase session expiry to ease transition
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30 days
}
```

### Issue: "Unexpected token 'export'"

**Cause**: Node.js trying to execute ESM as CommonJS
**Fix**: Ensure package.json has `"type": "module"`

---

## Rollback Plan

If migration fails, you can rollback:

### Option 1: Git Revert

```bash
git checkout pre-migration-v1.3.x
bun install
wrangler deploy
```

### Option 2: Downgrade Packages

```bash
bun add better-auth@1.3.34 drizzle-orm@0.36.0 drizzle-kit@0.28.0

# Remove ESM from package.json
# Revert code changes
# Deploy
```

### Option 3: Parallel Deployment

Keep v1.3.x running while testing v1.4.0:
```bash
# Deploy v1.4.0 to staging
wrangler deploy --env staging

# Keep v1.3.x in production
# Test thoroughly in staging
# Switch when confident
```

---

## Migration Checklist

Use this checklist to ensure complete migration:

- [ ] **Preparation**
  - [ ] Git backup created
  - [ ] Dependencies reviewed
  - [ ] Breaking changes identified

- [ ] **ESM Migration**
  - [ ] `"type": "module"` added to package.json
  - [ ] All `require()` converted to `import`
  - [ ] tsconfig.json updated
  - [ ] ESM tested locally

- [ ] **API Updates**
  - [ ] `forgetPassword` → `requestPasswordReset`
  - [ ] `/account-info` POST → GET (if using direct calls)
  - [ ] Callback `request` → `ctx`
  - [ ] Passkey plugin package installed (if applicable)

- [ ] **Dependencies Updated**
  - [ ] better-auth@^1.4.3
  - [ ] drizzle-orm@^0.44.7
  - [ ] drizzle-kit@^0.31.7
  - [ ] @better-auth/passkey (if needed)

- [ ] **Testing**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Manual testing complete
  - [ ] Staging deployment successful

- [ ] **Deployment**
  - [ ] Production deployed
  - [ ] Monitoring active
  - [ ] No error spikes
  - [ ] User login rates normal

- [ ] **Optional: New Features**
  - [ ] Database joins verified (2-3x speedup)
  - [ ] Stateless sessions enabled (if desired)
  - [ ] API keys configured (if needed)
  - [ ] New providers tested (Vercel, etc.)

---

## Getting Help

**Official Resources**:
- **v1.4 Blog Post**: https://www.better-auth.com/blog/1-4
- **Changelog**: https://www.better-auth.com/changelogs
- **Documentation**: https://better-auth.com
- **Discord**: https://discord.gg/better-auth

**GitHub**:
- **Issues**: https://github.com/better-auth/better-auth/issues
- **Discussions**: https://github.com/better-auth/better-auth/discussions

---

**Last updated**: 2025-11-27
**Next review**: Check for v1.5.0 changelog when released
