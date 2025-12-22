# MCP Authentication Patterns - Comparison Matrix

This document compares all 4 authentication patterns supported by Cloudflare MCP servers.

---

## Quick Reference Table

| Pattern | Security | Complexity | Use Case | Client Setup |
|---------|----------|------------|----------|--------------|
| **No Auth** | ⚠️ None | ⭐ Simple | Internal tools, dev | Just URL |
| **Token Validation** | ✅ Good | ⭐⭐ Medium | Custom auth, API keys | Bearer token |
| **OAuth Proxy** | ✅✅ Excellent | ⭐⭐⭐ Medium | GitHub, Google, Azure | OAuth flow |
| **Full OAuth Provider** | ✅✅✅ Maximum | ⭐⭐⭐⭐⭐ Complex | Custom identity | Full OAuth 2.1 |

---

## Pattern 1: No Authentication

### When to Use
- Internal tools (private network only)
- Development and testing
- Public APIs (intentionally open)

### Security
⚠️ **WARNING**: Anyone with the URL can access your MCP server

### Implementation
```typescript
export class MyMCP extends McpAgent<Env> {
  // No authentication required
}

export default {
  fetch(request, env, ctx) {
    return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
  }
};
```

### Client Configuration
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/sse"
    }
  }
}
```

### Pros
✅ Simplest to implement
✅ No OAuth flow complexity
✅ Fast to test

### Cons
❌ No security
❌ Anyone can use your server
❌ Can't identify users

---

## Pattern 2: Token Validation (JWT)

### When to Use
- Pre-authenticated clients
- Custom authentication systems
- API key-based access
- Service-to-service communication

### Security
✅ **GOOD**: Secure if tokens properly managed

### Implementation
```typescript
import { JWTVerifier } from "agents/mcp";

const verifier = new JWTVerifier({
  secret: env.JWT_SECRET,
  issuer: "your-auth-server",
  audience: "your-mcp-server"
});

export default {
  async fetch(request, env, ctx) {
    // Verify token before serving MCP requests
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const payload = await verifier.verify(token);
      // Token valid, serve MCP
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    } catch (error) {
      return new Response("Invalid token", { status: 403 });
    }
  }
};
```

### Client Configuration
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/sse",
      "headers": {
        "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
      }
    }
  }
}
```

### Pros
✅ Simple integration with existing auth
✅ No OAuth flow needed
✅ Works with any JWT issuer

### Cons
❌ Token management (refresh, expiry)
❌ Manual token distribution
❌ Client must handle token lifecycle

---

## Pattern 3: OAuth Proxy (workers-oauth-provider)

### When to Use
- Integrate with GitHub, Google, Azure, etc.
- User-scoped tools (read/write GitHub repos)
- Need user identity in tools
- Production applications

### Security
✅✅ **EXCELLENT**: Industry-standard OAuth 2.1

### Implementation
```typescript
import { OAuthProvider, GitHubHandler } from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",

  defaultHandler: new GitHubHandler({
    clientId: (env) => env.GITHUB_CLIENT_ID,
    clientSecret: (env) => env.GITHUB_CLIENT_SECRET,
    scopes: ["repo", "user:email"],

    context: async (accessToken) => {
      const octokit = new Octokit({ auth: accessToken });
      const { data: user } = await octokit.rest.users.getAuthenticated();

      return {
        login: user.login,
        email: user.email,
        accessToken
      };
    }
  }),

  kv: (env) => env.OAUTH_KV,

  apiHandlers: {
    "/sse": MyMCP.serveSSE("/sse"),
    "/mcp": MyMCP.serve("/mcp")
  },

  allowConsentScreen: true,
  allowDynamicClientRegistration: true
});
```

### Client Configuration
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/sse",
      "auth": {
        "type": "oauth",
        "authorizationUrl": "https://my-mcp.workers.dev/authorize",
        "tokenUrl": "https://my-mcp.workers.dev/token"
      }
    }
  }
}
```

### Required Bindings
```jsonc
{
  "kv_namespaces": [
    { "binding": "OAUTH_KV", "id": "YOUR_KV_ID" }
  ],
  "vars": {
    "GITHUB_CLIENT_ID": "optional-preconfig",
    "GITHUB_CLIENT_SECRET": "optional-preconfig"
  }
}
```

### Pros
✅ Standard OAuth 2.1 flow
✅ User identity in tools (`this.props.login`)
✅ Automatic token management
✅ Works with multiple providers
✅ Dynamic Client Registration (no pre-config needed)
✅ Consent screen for permissions

### Cons
❌ Requires KV namespace
❌ More complex than token validation
❌ OAuth flow adds latency on first connect

---

## Pattern 4: Full OAuth Provider

### When to Use
- You ARE the identity provider
- Custom consent screens
- Full control over auth flow
- Enterprise B2B applications

### Security
✅✅✅ **MAXIMUM**: Complete control over security

### Implementation
Complex - requires full OAuth 2.1 server implementation.

See Cloudflare's `remote-mcp-authkit` template for example.

### Client Configuration
Same as Pattern 3

### Pros
✅ Full control over authentication
✅ Custom user management
✅ Custom consent screens
✅ Fine-grained permissions
✅ Works with any OAuth client

### Cons
❌ Very complex to implement
❌ Must handle OAuth 2.1 spec correctly
❌ Token management, refresh, expiry
❌ User database required
❌ Audit logs recommended

---

## Supported OAuth Providers

### GitHub
**Handler**: `GitHubHandler`
**Scopes**: `repo`, `user:email`, `read:org`, `write:org`
**Example**: `templates/mcp-oauth-proxy.ts`

### Google
**Handler**: `GoogleHandler`
**Scopes**: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`
**Setup**: See `references/oauth-providers.md`

### Azure AD
**Handler**: `AzureADHandler`
**Scopes**: `openid`, `email`, `User.Read`
**Setup**: See `references/oauth-providers.md`

### Custom Provider
**Handler**: `GenericOAuthHandler`
**Use case**: Any OAuth 2.1 compliant provider

---

## Migration Path

### From No Auth → Token Validation
1. Generate JWT signing key
2. Add JWTVerifier middleware
3. Issue tokens to clients
4. Update client config with Authorization header

### From Token Validation → OAuth Proxy
1. Choose OAuth provider (GitHub, Google, etc.)
2. Add KV namespace binding
3. Replace fetch handler with OAuthProvider
4. Update client config with OAuth URLs
5. Remove Authorization headers

### From OAuth Proxy → Full OAuth Provider
1. Implement OAuth 2.1 server logic
2. Add user database (D1, KV, external)
3. Implement consent screen UI
4. Implement token refresh logic
5. Add audit logging

---

## Security Best Practices

### All Patterns
✅ Use HTTPS in production (automatic on Cloudflare)
✅ Validate all inputs (Zod schemas)
✅ Log authentication attempts
✅ Rate limit authentication endpoints

### Token Validation
✅ Use strong secrets (256-bit minimum)
✅ Short token expiry (15-60 minutes)
✅ Implement token refresh
✅ Rotate secrets regularly

### OAuth Patterns
✅ Always use `allowConsentScreen: true` in production
✅ Request minimal scopes needed
✅ Validate redirect URIs
✅ Use PKCE for authorization code flow
✅ Store tokens securely (KV, encrypted)

### Full OAuth Provider
✅ Implement OAuth 2.1 spec correctly
✅ Use authorization code flow (not implicit)
✅ Validate all OAuth parameters
✅ Implement token introspection
✅ Add audit logging for all auth events

---

## Common Mistakes

### ❌ Disabling Consent Screen
```typescript
allowConsentScreen: false  // ❌ NEVER in production
```

Users won't see what permissions they're granting!

### ❌ Storing Secrets in Code
```typescript
const secret = "my-secret-key";  // ❌ NEVER commit secrets
```

Use environment variables or secrets management.

### ❌ Overly Broad Scopes
```typescript
scopes: ["repo", "delete_repo", "admin:org"]  // ❌ Too powerful
```

Request minimal scopes needed.

### ❌ No Token Validation
```typescript
// ❌ Trusting token without verification
const token = request.headers.get("Authorization");
// Use token without verifying...
```

Always validate tokens before use.

---

## Testing Authentication

### Test No Auth
```bash
curl https://my-mcp.workers.dev/sse
# Should connect immediately
```

### Test Token Validation
```bash
# Without token (should fail)
curl https://my-mcp.workers.dev/sse

# With token (should succeed)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://my-mcp.workers.dev/sse
```

### Test OAuth Flow
```bash
# Use MCP Inspector
npx @modelcontextprotocol/inspector@latest

# Or use Claude Desktop (will trigger OAuth flow)
```

---

## Further Reading

- **OAuth 2.1 Spec**: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
- **workers-oauth-provider**: https://github.com/cloudflare/workers-oauth-provider
- **Cloudflare Auth Docs**: https://developers.cloudflare.com/agents/model-context-protocol/authorization/
- **MCP Auth Spec**: https://spec.modelcontextprotocol.io/specification/draft/basic/authorization/
