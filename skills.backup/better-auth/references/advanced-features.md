# better-auth Advanced Features

Deep dive into 2FA, organizations, rate limiting, and migration guides.

---

## Two-Factor Authentication (2FA)

Add TOTP (Time-based One-Time Password) or SMS-based 2FA to your application.

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  database: /* ... */,
  plugins: [
    twoFactor({
      methods: ["totp", "sms"],
      issuer: "MyApp",
    }),
  ],
});
```

### Client Usage

**Enable 2FA**:
```typescript
// Generate QR code for authenticator app
const { data, error } = await authClient.twoFactor.enable({
  method: "totp",
});

if (data) {
  // Show QR code to user: data.qrCode
  // Or show secret: data.secret
  console.log("Scan this QR code:", data.qrCode);
}
```

**Verify Setup Code**:
```typescript
// User enters code from authenticator app
await authClient.twoFactor.verifySetup({
  code: "123456",
});
```

**Sign In with 2FA**:
```typescript
// Step 1: Sign in with email/password
const { data: session, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Step 2: If 2FA enabled, verify code
if (session?.user.twoFactorEnabled) {
  await authClient.twoFactor.verify({
    code: "123456",
  });
}
```

**Disable 2FA**:
```typescript
await authClient.twoFactor.disable({
  password: "user-password", // Confirm with password
});
```

### Backup Codes

Generate backup codes for account recovery:

```typescript
// Generate backup codes
const { data: codes } = await authClient.twoFactor.generateBackupCodes();

// codes: ["ABC123", "DEF456", "GHI789", ...]
// Show these to user ONCE and tell them to save them

// Use backup code
await authClient.twoFactor.verifyBackupCode({
  code: "ABC123",
});
```

---

## Organizations & Teams

Multi-tenant SaaS with organizations, teams, and role-based permissions.

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: /* ... */,
  plugins: [
    organization({
      roles: ["owner", "admin", "member"],
      permissions: {
        owner: ["read", "write", "delete", "manage_members", "manage_billing"],
        admin: ["read", "write", "delete", "manage_members"],
        member: ["read", "write"],
      },
    }),
  ],
});
```

### Client Usage

**Create Organization**:
```typescript
await authClient.organization.create({
  name: "Acme Corp",
  slug: "acme", // Unique slug for URLs
  metadata: {
    industry: "Technology",
    size: "10-50",
  },
});
```

**List User Organizations**:
```typescript
const { data: orgs } = await authClient.organization.list();

// orgs: [{ id, name, slug, role, ... }, ...]
```

**Switch Active Organization**:
```typescript
await authClient.organization.setActive({
  organizationId: "org_123",
});
```

**Invite Member**:
```typescript
await authClient.organization.inviteMember({
  organizationId: "org_123",
  email: "newuser@example.com",
  role: "member",
});
```

**Update Member Role**:
```typescript
await authClient.organization.updateMemberRole({
  organizationId: "org_123",
  userId: "user_456",
  role: "admin",
});
```

**Remove Member**:
```typescript
await authClient.organization.removeMember({
  organizationId: "org_123",
  userId: "user_456",
});
```

**Check Permissions**:
```typescript
const canDelete = await authClient.organization.hasPermission({
  organizationId: "org_123",
  permission: "delete",
});

if (canDelete) {
  // Show delete button
}
```

**Accept Invitation**:
```typescript
await authClient.organization.acceptInvitation({
  invitationId: "inv_789",
});
```

### Server-Side Permission Checks

```typescript
// In your API route
app.delete("/api/projects/:id", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check permission
  const canDelete = await auth.api.organization.hasPermission({
    userId: session.user.id,
    organizationId: session.activeOrganizationId,
    permission: "delete",
  });

  if (!canDelete) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Delete project
  // ...
});
```

---

## Rate Limiting with KV

Protect your auth endpoints from brute-force attacks.

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { rateLimit } from "better-auth/plugins";

type Env = {
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  // ...
};

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    plugins: [
      rateLimit({
        window: 60, // 60 seconds
        max: 10, // 10 requests per window
        storage: {
          get: async (key) => {
            return await env.RATE_LIMIT_KV.get(key);
          },
          set: async (key, value, ttl) => {
            await env.RATE_LIMIT_KV.put(key, value, {
              expirationTtl: ttl,
            });
          },
        },
      }),
    ],
  });
}
```

### Advanced Rate Limiting

Different limits for different endpoints:

```typescript
rateLimit({
  rules: [
    {
      path: "/api/auth/sign-in",
      window: 60,
      max: 5, // 5 login attempts per minute
    },
    {
      path: "/api/auth/sign-up",
      window: 3600,
      max: 3, // 3 sign-ups per hour
    },
    {
      path: "/api/auth/reset-password",
      window: 3600,
      max: 3, // 3 password resets per hour
    },
  ],
  storage: {
    get: async (key) => await env.RATE_LIMIT_KV.get(key),
    set: async (key, value, ttl) => {
      await env.RATE_LIMIT_KV.put(key, value, { expirationTtl: ttl });
    },
  },
});
```

---

## Passkeys (WebAuthn)

Passwordless authentication using biometric or hardware keys.

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins";

export const auth = betterAuth({
  database: /* ... */,
  plugins: [
    passkey({
      rpName: "MyApp",
      rpID: "yourdomain.com", // Your domain
    }),
  ],
});
```

### Client Usage

**Register Passkey**:
```typescript
// User must be authenticated first
const { data, error } = await authClient.passkey.register({
  name: "MacBook Touch ID", // User-friendly name
});

if (data) {
  console.log("Passkey registered successfully");
}
```

**Sign In with Passkey**:
```typescript
const { data: session, error } = await authClient.passkey.signIn();

if (session) {
  console.log("Signed in with passkey:", session.user);
}
```

**List User's Passkeys**:
```typescript
const { data: passkeys } = await authClient.passkey.list();

// passkeys: [{ id, name, createdAt, lastUsed }, ...]
```

**Remove Passkey**:
```typescript
await authClient.passkey.remove({
  passkeyId: "pk_123",
});
```

---

## Magic Links

Passwordless authentication via email links.

### Server Setup

```typescript
export const auth = betterAuth({
  database: /* ... */,
  magicLink: {
    enabled: true,
    expiresIn: 60 * 10, // 10 minutes
    sendMagicLink: async ({ email, url, token }) => {
      await sendEmail({
        to: email,
        subject: "Sign in to MyApp",
        html: `
          <p>Click the link below to sign in:</p>
          <a href="${url}">Sign In</a>
          <p>Or use this code: ${token}</p>
          <p>This link expires in 10 minutes.</p>
        `,
      });
    },
  },
});
```

### Client Usage

```typescript
// Request magic link
await authClient.magicLink.request({
  email: "user@example.com",
  callbackURL: "/dashboard",
});

// User clicks link in email, gets redirected to callbackURL with token
// better-auth automatically verifies token and creates session
```

---

## Session Management Best Practices

### Custom Session Data

Store additional data in session:

```typescript
export const auth = betterAuth({
  database: /* ... */,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours

    // Add custom session data
    onSession: async ({ session, user }) => {
      return {
        ...session,
        activeOrganizationId: user.activeOrganizationId,
        permissions: await getPermissions(user.id),
      };
    },
  },
});
```

### Session Device Tracking

Track user devices and active sessions:

```typescript
// List active sessions
const { data: sessions } = await authClient.session.list();

// sessions: [
//   { id, device: "Chrome on MacOS", ipAddress: "192.168.1.1", lastActive: ... },
//   { id, device: "Safari on iPhone", ipAddress: "192.168.1.2", lastActive: ... },
// ]

// Revoke specific session
await authClient.session.revoke({
  sessionId: "ses_123",
});

// Revoke all other sessions (keep current)
await authClient.session.revokeOthers();
```

---

## Migration Guides

### From Clerk

**Key differences**:
- Clerk: Third-party service → better-auth: Self-hosted
- Clerk: Proprietary → better-auth: Open source
- Clerk: Monthly cost → better-auth: Free

**Migration steps**:

1. **Export user data** from Clerk (CSV or API)
2. **Import into better-auth database**:
   ```typescript
   // migration script
   const clerkUsers = await fetchClerkUsers();

   for (const clerkUser of clerkUsers) {
     await db.insert(user).values({
       id: clerkUser.id,
       email: clerkUser.email,
       emailVerified: clerkUser.email_verified,
       name: clerkUser.first_name + " " + clerkUser.last_name,
       image: clerkUser.profile_image_url,
     });
   }
   ```
3. **Replace Clerk SDK** with better-auth client:
   ```typescript
   // Before (Clerk)
   import { useUser } from "@clerk/nextjs";
   const { user } = useUser();

   // After (better-auth)
   import { authClient } from "@/lib/auth-client";
   const { data: session } = authClient.useSession();
   const user = session?.user;
   ```
4. **Update middleware** for session verification
5. **Configure social providers** (same OAuth apps, different config)

---

### From Auth.js (NextAuth)

**Key differences**:
- Auth.js: Limited features → better-auth: Comprehensive (2FA, orgs, etc.)
- Auth.js: Callbacks-heavy → better-auth: Plugin-based
- Auth.js: Session handling varies → better-auth: Consistent

**Migration steps**:

1. **Database schema**: Auth.js and better-auth use similar schemas, but column names differ
2. **Replace configuration**:
   ```typescript
   // Before (Auth.js)
   import NextAuth from "next-auth";
   import GoogleProvider from "next-auth/providers/google";

   export default NextAuth({
     providers: [GoogleProvider({ /* ... */ })],
   });

   // After (better-auth)
   import { betterAuth } from "better-auth";

   export const auth = betterAuth({
     socialProviders: {
       google: { /* ... */ },
     },
   });
   ```
3. **Update client hooks**:
   ```typescript
   // Before
   import { useSession } from "next-auth/react";

   // After
   import { authClient } from "@/lib/auth-client";
   const { data: session } = authClient.useSession();
   ```

---

## Security Best Practices

### 1. Always use HTTPS in production

```typescript
const auth = betterAuth({
  baseURL: process.env.NODE_ENV === "production"
    ? "https://yourdomain.com"
    : "http://localhost:3000",
  // ...
});
```

### 2. Rotate secrets regularly

```bash
openssl rand -base64 32
wrangler secret put BETTER_AUTH_SECRET
```

### 3. Validate email domains for sign-up

```typescript
emailAndPassword: {
  enabled: true,
  validate: async (email) => {
    const blockedDomains = ["tempmail.com", "guerrillamail.com"];
    const domain = email.split("@")[1];
    if (blockedDomains.includes(domain)) {
      throw new Error("Email domain not allowed");
    }
  },
}
```

### 4. Enable rate limiting for auth endpoints

See "Rate Limiting with KV" section above.

### 5. Log auth events for security monitoring

```typescript
export const auth = betterAuth({
  database: /* ... */,
  hooks: {
    after: {
      signIn: async ({ user, session }) => {
        await logAuthEvent({
          type: "sign_in",
          userId: user.id,
          ip: session.ipAddress,
          userAgent: session.userAgent,
          timestamp: new Date(),
        });
      },
      signUp: async ({ user }) => {
        await logAuthEvent({
          type: "sign_up",
          userId: user.id,
          timestamp: new Date(),
        });
      },
    },
  },
});
```

---

## Performance Optimization

### 1. Cache session lookups (use KV for Workers)

See "D1 Eventual Consistency Issues" in error-catalog.md

### 2. Use indexes on frequently queried fields

```sql
CREATE INDEX idx_sessions_user_id ON session(userId);
CREATE INDEX idx_accounts_provider ON account(providerId, accountId);
CREATE INDEX idx_sessions_token ON session(token);
```

### 3. Minimize session data (only essential fields)

```typescript
session: {
  onSession: async ({ session, user }) => {
    // Only include what you need
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // Don't include everything
      },
    };
  },
}
```

---

## Development Workflow

### Environment-Specific Configs

```typescript
const isDev = process.env.NODE_ENV === "development";

export const auth = betterAuth({
  baseURL: isDev ? "http://localhost:3000" : "https://yourdomain.com",
  session: {
    expiresIn: isDev
      ? 60 * 60 * 24 * 365 // 1 year for dev
      : 60 * 60 * 24 * 7, // 7 days for prod
  },
});
```

### Test Social Auth Locally with ngrok

```bash
ngrok http 3000
# Use ngrok URL as redirect URI in OAuth provider
```

---

**Official Resources**:
- 2FA Plugin: https://better-auth.com/docs/plugins/two-factor
- Organizations: https://better-auth.com/docs/plugins/organization
- Passkeys: https://better-auth.com/docs/plugins/passkey
- Magic Links: https://better-auth.com/docs/authentication/magic-link
- Rate Limiting: https://better-auth.com/docs/plugins/rate-limit
