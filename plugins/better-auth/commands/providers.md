---
description: Display Better Auth available authentication providers and their configuration
argument-hint: [provider_name]
---

# Authentication Providers Reference

Provide quick reference for Better Auth authentication providers.

## Usage

1. **Specific provider** (e.g., `/better-auth:providers google`):
   - Show detailed configuration for that provider
   - Display code example with Cloudflare D1 integration
   - List required environment variables
   - OAuth callback URL format
   - Common issues and solutions

2. **No argument** (e.g., `/better-auth:providers`):
   - Show overview of all available providers by category
   - Display setup instructions
   - Link to full documentation

## Provider Categories

### OAuth Providers (45+)

**Popular:**
- Google (openid, email, profile scopes)
- GitHub (user, email scopes)
- Microsoft (openid, email, profile)
- Apple (name, email)
- Discord (identify, email, guilds)

**Social Media:**
- Twitter/X (tweet.read, users.read)
- Facebook (email, public_profile)
- LinkedIn (openid, profile, email)
- TikTok (user.info.basic)
- Instagram (user_profile, user_media)
- Reddit (identity, read)

**Developer Platforms:**
- GitLab (read_user, email)
- Bitbucket (account, email)
- Vercel (user, email) - v1.4.3+
- Atlassian (read:me, read:account)

**Gaming & Streaming:**
- Twitch (user:read:email)
- Kick (user:read) - v1.4.6+
- Steam (identity, email)
- Patreon (identity, campaigns) - v1.4.8+

**Communication:**
- Slack (users:read, users:read.email)
- Spotify (user-read-email, user-read-private)
- Dropbox (account_info.read)
- Box (manage_app_users)

**Enterprise:**
- Okta (openid, profile, email)
- Azure AD / Entra ID
- Keycloak (openid)
- Auth0 (openid, profile, email)

**Other Providers:**
- Strava, Lichess, Workos, Roblox, Coinbase, Line, Vk, Yandex, and 15+ more

### Email/Password Authentication

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url, ctx }) => {
    // Send password reset email
  }
}
```

### Magic Link Authentication

```typescript
import { magicLink } from "better-auth/plugins/magic-link"

plugins: [
  magicLink({
    sendMagicLink: async ({ email, url, ctx }) => {
      // Send magic link email
    }
  })
]
```

### Passkey/WebAuthn

```typescript
import { passkey } from "@better-auth/passkey"

plugins: [passkey()]
```

## Configuration Template

For a specific provider (e.g., Google):

```typescript
// Server config (auth.ts)
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email", "profile"]  // Optional
    }
  }
})

// Client code
import { authClient } from "./auth-client"

await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard"
})
```

## Environment Variables

```env
# For each OAuth provider
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# ... repeat for each provider
```

## OAuth Callback URL Format

```
https://yourdomain.com/api/auth/callback/{provider}
```

Examples:
- `https://yourdomain.com/api/auth/callback/google`
- `https://yourdomain.com/api/auth/callback/github`
- `http://localhost:8787/api/auth/callback/google` (development)

**Critical**: No trailing slash, exact match required in provider dashboard

## Common Provider Setup Steps

1. **Create OAuth app** in provider dashboard
2. **Set redirect URI** to callback URL (exact match)
3. **Copy client ID and secret** to environment variables
4. **Configure scopes** (optional, use defaults)
5. **Add to socialProviders config**
6. **Test authentication flow**

## Provider-Specific Notes

**Google:**
- Requires verified domain for production
- Consent screen must be configured
- Refresh tokens require offline_access scope

**GitHub:**
- No refresh tokens by default
- Private email requires user:email scope
- Organizations need read:org scope

**Microsoft:**
- Use common endpoint for multi-tenant
- Requires app registration in Azure AD
- Graph API requires additional scopes

**Apple:**
- Requires developer account ($99/year)
- Returns user info only on first login
- Refresh tokens valid for 6 months

**Discord:**
- Bot vs OAuth app distinction
- Refresh tokens valid for 30 days
- Guild info requires special scope

## New Providers (v1.4+)

**Vercel (v1.4.3)**
```typescript
vercel: {
  clientId: env.VERCEL_CLIENT_ID,
  clientSecret: env.VERCEL_CLIENT_SECRET
}
```

**Kick (v1.4.6)** - with refresh tokens
```typescript
kick: {
  clientId: env.KICK_CLIENT_ID,
  clientSecret: env.KICK_CLIENT_SECRET
}
```

**Patreon (v1.4.8)**
```typescript
patreon: {
  clientId: env.PATREON_CLIENT_ID,
  clientSecret: env.PATREON_CLIENT_SECRET,
  scope: ["identity", "identity[email]", "campaigns"]
}
```

## Documentation Links

- **Full provider list**: https://better-auth.com/docs/authentication/social
- **OAuth setup**: https://better-auth.com/docs/concepts/authentication
- **Provider-specific guides**: https://better-auth.com/docs

## Offer to Generate Code

If user is currently working on authentication code, offer to:
1. Generate complete integration code for selected provider
2. Create environment variable template
3. Set up OAuth callback route
4. Implement client-side sign-in component
