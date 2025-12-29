---
name: better-auth:add-plugin
description: Add a better-auth plugin to an existing project. Configures server and client plugins with proper imports.
argument-hint: "<plugin-name>"
---

# Add better-auth Plugin

This command adds a plugin to an existing better-auth configuration.

## Usage

```
/better-auth-add-plugin <plugin-name>
```

## Supported Plugins

| Plugin | Description |
|--------|-------------|
| `2fa` / `two-factor` | Two-factor authentication (TOTP) |
| `passkeys` | WebAuthn/Passkeys |
| `magic-link` | Passwordless magic links |
| `email-otp` | Email-based OTP codes |
| `anonymous` | Anonymous/guest users |
| `organizations` | Multi-tenancy support |
| `sso` / `saml` | SSO/SAML integration |
| `scim` | SCIM user provisioning |
| `admin` | Admin dashboard |
| `api-key` | API key authentication |
| `bearer` | Bearer token support |
| `jwt` | JWT token plugin |
| `oidc` | OIDC provider |
| `stripe` | Stripe payments |
| `polar` | Polar payments |

## Process

### Step 1: Locate Configuration

Find the existing auth configuration:
- `src/auth.ts`
- `lib/auth.ts`
- `server/auth.ts`

Find the client configuration:
- `src/lib/auth-client.ts`
- `lib/auth-client.ts`

### Step 2: Add Server Plugin

Based on the plugin, add the appropriate import and configuration:

#### Two-Factor Authentication
```typescript
import { twoFactor } from "better-auth/plugins";

plugins: [
  twoFactor({
    issuer: "Your App Name",
  }),
],
```

#### Passkeys
```typescript
import { passkey } from "better-auth/plugins";

plugins: [
  passkey({
    rpID: "your-domain.com",
    rpName: "Your App",
    origin: "https://your-domain.com",
  }),
],
```

#### Magic Links
```typescript
import { magicLink } from "better-auth/plugins";

plugins: [
  magicLink({
    sendMagicLink: async ({ email, token, url }) => {
      // TODO: Implement email sending
      await sendEmail({ to: email, subject: "Sign in", html: `<a href="${url}">Click to sign in</a>` });
    },
  }),
],
```

#### Organizations
```typescript
import { organization } from "better-auth/plugins";

plugins: [
  organization({
    allowUserToCreateOrganization: true,
  }),
],
```

#### API Keys
```typescript
import { apiKey } from "better-auth/plugins";

plugins: [
  apiKey({
    prefix: "sk_",
  }),
],
```

#### Admin
```typescript
import { admin } from "better-auth/plugins";

plugins: [
  admin({
    adminUsers: ["admin@your-company.com"],
  }),
],
```

#### Stripe
```typescript
import { stripe } from "better-auth/plugins";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

plugins: [
  stripe({
    stripeClient,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  }),
],
```

### Step 3: Add Client Plugin

Add matching client plugin:

```typescript
// In auth-client.ts
import {
  twoFactorClient,
  passkeyClient,
  magicLinkClient,
  organizationClient,
  apiKeyClient,
  adminClient,
  stripeClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    // Add matching client plugin
    twoFactorClient(),
  ],
});
```

### Step 4: Update Database Schema (if needed)

Some plugins require additional tables:

#### Organizations
```typescript
// Add to schema.ts
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull(),
  userId: text("userId").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

#### API Keys
```typescript
export const apiKeyTable = pgTable("api_key", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

### Step 5: Environment Variables

Add required environment variables:

```env
# Two-Factor - no additional vars needed

# Passkeys
# RP_ID and RP_ORIGIN configured in code

# Magic Links
# Email provider credentials

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SSO/SAML
# IdP-specific configuration
```

### Step 6: Generate Migrations

```bash
# For Drizzle
bunx drizzle-kit generate
bunx drizzle-kit push

# For Prisma
bunx prisma generate
bunx prisma migrate dev
```

## Output

After adding a plugin, report:

```
✓ Added two-factor plugin to src/auth.ts
✓ Added twoFactorClient to src/lib/auth-client.ts
✓ No schema changes required

Next steps:
1. Run migrations if schema was updated
2. Configure plugin options as needed
3. Implement UI components for 2FA setup

Documentation:
- Plugin docs: https://better-auth.com/docs/plugins/two-factor
- Reference: references/plugins/authentication.md
```

## Common Combinations

### Enterprise Setup
```
/better-auth-add-plugin organizations
/better-auth-add-plugin sso
/better-auth-add-plugin scim
/better-auth-add-plugin admin
```

### Enhanced Security
```
/better-auth-add-plugin 2fa
/better-auth-add-plugin passkeys
```

### API Access
```
/better-auth-add-plugin api-key
/better-auth-add-plugin jwt
```

### Monetization
```
/better-auth-add-plugin stripe
```
