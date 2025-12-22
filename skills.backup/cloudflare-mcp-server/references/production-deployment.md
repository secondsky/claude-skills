# Production Deployment & Best Practices

This guide covers production deployment, configuration, authentication, error handling, and best practices for MCP servers on Cloudflare Workers.

---

## Deployment & Testing

### Local Development

```bash
# Start dev server (uses Miniflare for local DOs)
npm run dev

# Start dev server with remote Durable Objects (more accurate)
npx wrangler dev --remote
```

**Access at**: `http://localhost:8788/sse`

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

1. Open `http://localhost:5173`
2. Enter MCP server URL
3. Click "Connect"
4. Use "List Tools" to see available tools
5. Test tool calls with parameters

### Deploy to Cloudflare

```bash
# First time: Login
npx wrangler login

# Deploy
npx wrangler deploy

# Output shows your deployed URL:
# https://my-mcp-server.YOUR_ACCOUNT.workers.dev

# ⚠️ CRITICAL: Update client config with this URL!

# Check deployment logs
npx wrangler tail
```

### Connect Claude Desktop

**~/.config/claude/claude_desktop_config.json** (Linux/Mac):
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp-server.YOUR_ACCOUNT.workers.dev/sse"
    }
  }
}
```

**%APPDATA%/Claude/claude_desktop_config.json** (Windows)

**With OAuth**:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp-oauth.YOUR_ACCOUNT.workers.dev/sse",
      "auth": {
        "type": "oauth",
        "authorizationUrl": "https://my-mcp-oauth.YOUR_ACCOUNT.workers.dev/authorize",
        "tokenUrl": "https://my-mcp-oauth.YOUR_ACCOUNT.workers.dev/token"
      }
    }
  }
}
```

**⚠️ REMEMBER**: Restart Claude Desktop after config changes!

---


---

## Configuration Reference

### Complete wrangler.jsonc (All Features)

```jsonc
{
  "name": "my-mcp-server",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "account_id": "YOUR_ACCOUNT_ID",

  "vars": {
    "ENVIRONMENT": "production",
    "GITHUB_CLIENT_ID": "optional-pre-configured-id"
  },

  "kv_namespaces": [
    {
      "binding": "OAUTH_KV",
      "id": "YOUR_KV_ID",
      "preview_id": "YOUR_PREVIEW_KV_ID"
    }
  ],

  "durable_objects": {
    "bindings": [
      {
        "name": "MY_MCP",
        "class_name": "MyMCP",
        "script_name": "my-mcp-server"
      }
    ]
  },

  "migrations": [
    { "tag": "v1", "new_classes": ["MyMCP"] }
  ],

  "node_compat": true
}
```

### Complete package.json

See `templates/package.json`

### Complete claude_desktop_config.json

See `templates/claude_desktop_config.json`

---


---

## Authentication Patterns

Cloudflare MCP servers support **4 authentication patterns**:

### Pattern 1: No Authentication

**Use case**: Internal tools, development, public APIs

**Template**: `templates/mcp-http-fundamentals.ts`

**Setup**: None required

**Security**: ⚠️ Anyone can access your MCP server

---

### Pattern 2: Token Validation (JWTVerifier)

**Use case**: Pre-authenticated clients, custom auth systems

**How it works**: Client sends Bearer token, server validates

**Template**: Create custom JWTVerifier middleware

**Setup**:
```typescript
import { JWTVerifier } from "agents/mcp";

const verifier = new JWTVerifier({
  secret: env.JWT_SECRET,
  issuer: "your-auth-server"
});

// Validate token before serving MCP requests
```

**Security**: ✅ Secure if tokens are properly managed

---

### Pattern 3: OAuth Proxy (workers-oauth-provider)

**Use case**: GitHub, Google, Azure OAuth integration

**How it works**: Cloudflare Worker proxies OAuth to third-party provider

**Template**: `templates/mcp-oauth-proxy.ts`

**Setup**:
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
      // Fetch user info from GitHub
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

**Required bindings**:
```jsonc
{
  "kv_namespaces": [
    { "binding": "OAUTH_KV", "id": "YOUR_KV_ID" }
  ]
}
```

**⚠️ CRITICAL OAuth URL Configuration**: When using OAuth, your redirect URIs MUST match:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse",
      "auth": {
        "type": "oauth",
        "authorizationUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/authorize",
        "tokenUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/token"
      }
    }
  }
}
```

All URLs must use the **same domain and protocol** (https://).

**Security**: ✅✅ Secure, production-ready

---

### Pattern 4: Remote OAuth with DCR

**Use case**: Full OAuth provider, custom consent screens

**How it works**: Your Worker is the OAuth provider

**Template**: See Cloudflare's `remote-mcp-authkit` demo

**Setup**: Complex, requires full OAuth 2.1 implementation

**Security**: ✅✅✅ Most secure, full control

---


---

## 22 Known Errors (With Solutions)

### 1. McpAgent Class Not Exported

**Error**: `TypeError: Cannot read properties of undefined (reading 'serve')`

**Cause**: Forgot to export McpAgent class

**Solution**:
```typescript
export class MyMCP extends McpAgent { ... }  // ✅ Must export
export default { fetch() { ... } }
```

---

### 2. Base Path Configuration Mismatch (Most Common!)

**Error**: `404 Not Found` or `Connection failed`

**Cause**: `serveSSE("/sse")` but client configured with `https://worker.dev` (missing `/sse`)

**Solution**: Match base paths exactly
```typescript
// Server serves at /sse
MyMCP.serveSSE("/sse").fetch(...)

// Client MUST include /sse
{ "url": "https://worker.dev/sse" }  // ✅ Correct
{ "url": "https://worker.dev" }      // ❌ Wrong - 404
```

**Debug steps**:
1. Check what path your server uses: `serveSSE("/sse")` vs `serveSSE("/")`
2. Test with curl: `curl https://worker.dev/sse`
3. Update client config to match curl URL

---

### 3. Transport Type Confusion

**Error**: `Connection failed: Unexpected response format`

**Cause**: Client expects SSE but connects to HTTP endpoint (or vice versa)

**Solution**: Match transport types
```typescript
// SSE transport
MyMCP.serveSSE("/sse")  // Client URL: https://worker.dev/sse

// HTTP transport
MyMCP.serve("/mcp")     // Client URL: https://worker.dev/mcp
```

**Best practice**: Support both transports (see Transport Selection Guide)

---

### 4. pathname.startsWith() Logic Error

**Error**: Both `/sse` and `/mcp` routes fail or conflict

**Cause**: Incorrect path matching logic

**Solution**: Use `startsWith()` correctly
```typescript
// ✅ CORRECT
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(...);
}
if (pathname.startsWith("/mcp")) {
  return MyMCP.serve("/mcp").fetch(...);
}

// ❌ WRONG: Exact match breaks sub-paths
if (pathname === "/sse") {  // Breaks /sse/tools/list
  return MyMCP.serveSSE("/sse").fetch(...);
}
```

---

### 5. Local vs Deployed URL Mismatch

**Error**: Works in dev, fails after deployment

**Cause**: Client still configured with localhost URL

**Solution**: Update client config after deployment
```json
// Development
{ "url": "http://localhost:8788/sse" }

// ⚠️ MUST UPDATE after npx wrangler deploy
{ "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse" }
```

**Post-deployment checklist**:
- [ ] Run `npx wrangler deploy` and note output URL
- [ ] Update client config with deployed URL
- [ ] Test with curl
- [ ] Restart Claude Desktop

---

### 6. OAuth Redirect URI Mismatch

**Error**: `OAuth error: redirect_uri does not match`

**Cause**: OAuth redirect URI doesn't match deployed URL

**Solution**: Update ALL OAuth URLs after deployment
```json
{
  "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse",
  "auth": {
    "type": "oauth",
    "authorizationUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/authorize",  // Must match deployed domain
    "tokenUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/token"
  }
}
```

**CRITICAL**: All URLs must use the same protocol and domain!

---

### 7. Missing OPTIONS Handler (CORS Preflight)

**Error**: `Access to fetch at '...' blocked by CORS policy` or `Method Not Allowed`

**Cause**: Browser clients send OPTIONS requests for CORS preflight, but server doesn't handle them

**Solution**: Add OPTIONS handler
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // ... rest of your fetch handler
  }
};
```

**When needed**: Browser-based MCP clients (like MCP Inspector in browser)

---

### 8. Request Body Validation Missing

**Error**: `TypeError: Cannot read properties of undefined` or `Unexpected token` in JSON parsing

**Cause**: Client sends malformed JSON, server doesn't validate before parsing

**Solution**: Wrap request handling in try/catch
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      // Your MCP server logic
      return await MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    } catch (error) {
      console.error("Request handling error:", error);
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: error.message
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};
```

---

### 9. Environment Variable Validation Missing

**Error**: `TypeError: env.API_KEY is undefined` or silent failures (tools return empty data)

**Cause**: Required environment variables not configured or missing at runtime

**Solution**: Add startup validation
```typescript
export class MyMCP extends McpAgent<Env> {
  async init() {
    // Validate required environment variables
    if (!this.env.API_KEY) {
      throw new Error("API_KEY environment variable not configured");
    }
    if (!this.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable not configured");
    }

    // Continue with tool registration
    this.server.tool(...);
  }
}
```

**Configuration checklist**:
- Development: Add to `.dev.vars` (local only, gitignored)
- Production: Add to `wrangler.jsonc` `vars` (public) or use `wrangler secret` (sensitive)

**Best practices**:
```bash
# .dev.vars (local development, gitignored)
API_KEY=dev-key-123
DATABASE_URL=http://localhost:3000

# wrangler.jsonc (public config)
{
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info"
  }
}

# wrangler secret (production secrets)
npx wrangler secret put API_KEY
npx wrangler secret put DATABASE_URL
```

---

### 10. McpAgent vs McpServer Confusion

**Error**: `TypeError: server.registerTool is not a function` or `this.server is undefined`

**Cause**: Trying to use standalone SDK patterns with McpAgent class

**Solution**: Use McpAgent's `this.server.tool()` pattern
```typescript
// ❌ WRONG: Mixing standalone SDK with McpAgent
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "My Server" });
server.registerTool(...);  // Not compatible with McpAgent!

export class MyMCP extends McpAgent { /* no server property */ }

// ✅ CORRECT: McpAgent pattern
export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "My MCP Server",
    version: "1.0.0"
  });

  async init() {
    this.server.tool("tool_name", ...);  // Use this.server
  }
}
```

**Key difference**: McpAgent provides `this.server` property, standalone SDK doesn't.

---

### 11. WebSocket Hibernation State Loss

**Error**: Tool calls fail after reconnect with "state not found"

**Cause**: In-memory state cleared on hibernation

**Solution**: Use `this.state.storage` instead of instance properties
```typescript
// ❌ DON'T: Lost on hibernation
this.userId = "123";

// ✅ DO: Persists through hibernation
await this.state.storage.put("userId", "123");
```

---

### 12. Durable Objects Binding Missing

**Error**: `TypeError: Cannot read properties of undefined (reading 'idFromName')`

**Cause**: Forgot DO binding in wrangler.jsonc

**Solution**: Add binding (see Stateful MCP Servers section)
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "MY_MCP",
        "class_name": "MyMCP",
        "script_name": "my-mcp-server"
      }
    ]
  }
}
```

---

### 13. Migration Not Defined

**Error**: `Error: Durable Object class MyMCP has no migration defined`

**Cause**: First DO deployment requires migration

**Solution**:
```jsonc
{
  "migrations": [
    { "tag": "v1", "new_classes": ["MyMCP"] }
  ]
}
```

---

### 14. serializeAttachment() Not Used

**Error**: WebSocket metadata lost on hibernation wake

**Cause**: Not using `serializeAttachment()` to preserve connection metadata

**Solution**: See WebSocket Hibernation section

---

### 15. OAuth Consent Screen Disabled

**Security risk**: Users don't see what permissions they're granting

**Cause**: `allowConsentScreen: false` in production

**Solution**: Always enable in production
```typescript
export default new OAuthProvider({
  allowConsentScreen: true,  // ✅ Always true in production
  // ...
});
```

---

### 16. JWT Signing Key Missing

**Error**: `Error: JWT_SIGNING_KEY environment variable not set`

**Cause**: OAuth Provider requires signing key for tokens

**Solution**:
```bash
# Generate secure key
openssl rand -base64 32

# Add to wrangler secret
npx wrangler secret put JWT_SIGNING_KEY
```

---

### 17. Tool Schema Validation Error

**Error**: `ZodError: Invalid input type`

**Cause**: Client sends string, schema expects number (or vice versa)

**Solution**: Use Zod transforms
```typescript
// Accept string, convert to number
param: z.string().transform(val => parseInt(val, 10))

// Or: Accept both types
param: z.union([z.string(), z.number()]).transform(val =>
  typeof val === "string" ? parseInt(val, 10) : val
)
```

---

### 18. Multiple Transport Endpoints Conflicting

**Error**: `/sse` returns 404 after adding `/mcp`

**Cause**: Incorrect path matching (missing `startsWith()`)

**Solution**: Use `startsWith()` or exact matches correctly (see Error #4)

---

### 19. Local Testing with Miniflare Limitations

**Error**: OAuth flow fails in local dev, or Durable Objects behave differently

**Cause**: Miniflare doesn't support all DO features

**Solution**: Use `npx wrangler dev --remote` for full DO support
```bash
# Local simulation (faster but limited)
npm run dev

# Remote DOs (slower but accurate)
npx wrangler dev --remote
```

---

### 20. Client Configuration Format Error

**Error**: Claude Desktop doesn't recognize server

**Cause**: Wrong JSON format in `claude_desktop_config.json`

**Solution**: See "Connect Claude Desktop" section for correct format

**Common mistakes**:
```json
// ❌ WRONG: Missing "mcpServers" wrapper
{
  "my-mcp": {
    "url": "https://worker.dev/sse"
  }
}

// ❌ WRONG: Trailing comma
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/sse",  // ← Remove comma
    }
  }
}

// ✅ CORRECT
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/sse"
    }
  }
}
```

---

### 21. Health Check Endpoint Missing

**Issue**: Can't tell if Worker is running or if URL is correct

**Impact**: Debugging connection issues takes longer

**Solution**: Add health check endpoint (see Transport Selection Guide)

**Test**:
```bash
curl https://my-mcp.workers.dev/health
# Should return: {"status":"ok","transports":{...}}
```

---

### 22. CORS Headers Missing

**Error**: `Access to fetch at '...' blocked by CORS policy`

**Cause**: MCP server doesn't return CORS headers for cross-origin requests

**Solution**: Add CORS headers to all responses
```typescript
// Manual CORS (if not using OAuthProvider)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Or specific origin
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Add to responses
return new Response(body, {
  headers: {
    ...corsHeaders,
    "Content-Type": "application/json"
  }
});
```

**Note**: OAuthProvider handles CORS automatically!

---


---

## When NOT to Use This Skill

**Don't use this skill when**:
- Building Python MCP servers (use `fastmcp` skill instead)
- Building local-only MCP servers (use `typescript-mcp` skill)
- You need non-Cloudflare hosting (AWS Lambda, GCP, etc.)
- You're working with Claude.ai web interface skills (different from MCP)

**Use this skill specifically for**: TypeScript + Cloudflare Workers + Remote MCP

---

## Version Information

- **@modelcontextprotocol/sdk**: 1.21.0
- **@cloudflare/workers-oauth-provider**: 0.0.13
- **agents (Cloudflare Agents SDK)**: 0.2.20
- **Last Verified**: 2025-11-08

**Production tested**: Based on Cloudflare's official MCP servers (mcp-server-cloudflare, workers-mcp)

---

## Token Efficiency

**Without this skill**:
- Research scattered docs: ~10k tokens
- Debug URL path issues: ~15k tokens
- Debug other 21 errors: ~30k tokens
- **Total: ~55k tokens**

**With this skill**:
