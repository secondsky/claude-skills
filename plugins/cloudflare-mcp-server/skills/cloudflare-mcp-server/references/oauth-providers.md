# OAuth Provider Setup Guides

Quick setup guides for common OAuth providers with Cloudflare MCP servers.

---

## GitHub

### 1. Create OAuth App
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: My MCP Server
   - **Homepage URL**: https://my-mcp.workers.dev
   - **Authorization callback URL**: https://my-mcp.workers.dev/oauth/callback
4. Click "Register application"
5. Copy Client ID and Client Secret

### 2. Configure Worker
```typescript
import { GitHubHandler } from "@cloudflare/workers-oauth-provider";

defaultHandler: new GitHubHandler({
  clientId: (env) => env.GITHUB_CLIENT_ID,
  clientSecret: (env) => env.GITHUB_CLIENT_SECRET,
  scopes: ["repo", "user:email"],
})
```

### 3. Add Secrets
```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

### Common Scopes
- `repo` - Full repo access
- `user:email` - Read user email
- `read:org` - Read org membership
- `write:org` - Manage org
- `admin:repo_hook` - Manage webhooks

---

## Google

### 1. Create OAuth Client
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized redirect URIs: https://my-mcp.workers.dev/oauth/callback
5. Click "Create"
6. Copy Client ID and Client Secret

### 2. Configure Worker
```typescript
import { GoogleHandler } from "@cloudflare/workers-oauth-provider";

defaultHandler: new GoogleHandler({
  clientId: (env) => env.GOOGLE_CLIENT_ID,
  clientSecret: (env) => env.GOOGLE_CLIENT_SECRET,
  scopes: ["openid", "email", "profile"],
})
```

### Common Scopes
- `openid` - Required for OpenID Connect
- `email` - User email
- `profile` - Basic profile
- `https://www.googleapis.com/auth/drive.readonly` - Read Drive files
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail

---

## Azure AD

### 1. Register Application
1. Go to https://portal.azure.com → Azure Active Directory
2. App registrations → New registration
3. Name: My MCP Server
4. Redirect URI: https://my-mcp.workers.dev/oauth/callback
5. Click "Register"
6. Copy Application (client) ID
7. Certificates & secrets → New client secret
8. Copy secret value

### 2. Configure Worker
```typescript
import { AzureADHandler } from "@cloudflare/workers-oauth-provider";

defaultHandler: new AzureADHandler({
  clientId: (env) => env.AZURE_CLIENT_ID,
  clientSecret: (env) => env.AZURE_CLIENT_SECRET,
  tenant: "common", // or specific tenant ID
  scopes: ["openid", "email", "User.Read"],
})
```

### Common Scopes
- `openid` - Required
- `email` - User email
- `User.Read` - Read user profile
- `Files.Read` - Read OneDrive files
- `Mail.Read` - Read email

---

## Generic OAuth Provider

### For any OAuth 2.1 provider
```typescript
import { GenericOAuthHandler } from "@cloudflare/workers-oauth-provider";

defaultHandler: new GenericOAuthHandler({
  authorizeUrl: "https://provider.com/oauth/authorize",
  tokenUrl: "https://provider.com/oauth/token",
  userInfoUrl: "https://provider.com/oauth/userinfo",

  clientId: (env) => env.OAUTH_CLIENT_ID,
  clientSecret: (env) => env.OAUTH_CLIENT_SECRET,
  scopes: ["openid", "email"],

  context: async (accessToken) => {
    const response = await fetch("https://provider.com/oauth/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = await response.json();

    return {
      userId: user.id,
      email: user.email,
      accessToken
    };
  }
})
```

---

## Dynamic Client Registration

Skip manual OAuth app creation - let clients register automatically:

```typescript
export default new OAuthProvider({
  allowDynamicClientRegistration: true,
  // No clientId or clientSecret needed!
})
```

**How it works**:
1. Client sends registration request
2. Server generates client credentials
3. Stored in KV namespace
4. Client uses credentials for OAuth flow

**Pros**:
✅ No manual setup
✅ Works immediately
✅ No provider configuration

**Cons**:
❌ Less control
❌ Can't track clients externally

---

## Security Best Practices

### Scopes
✅ Request minimal scopes needed
❌ Don't request `admin` or `delete` unless necessary

### Secrets
✅ Use `npx wrangler secret put`
❌ Never commit secrets to git
❌ Never put secrets in wrangler.jsonc

### Redirect URIs
✅ Use HTTPS in production
✅ Specify exact URI (not wildcard)
❌ Don't use localhost in production

### Consent Screen
✅ Always enable in production: `allowConsentScreen: true`
❌ Never disable consent screen for public apps

---

**Need help?** See `authentication.md` for full OAuth patterns.
