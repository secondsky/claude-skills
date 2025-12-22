# Common Issues and Troubleshooting

Detailed troubleshooting for the 15 most common Cloudflare MCP server errors.

---

## 1. McpAgent Class Not Exported

**Error**: `TypeError: Cannot read properties of undefined (reading 'serve')`

**Diagnosis**: Check if your McpAgent class is exported

**Solution**:
```typescript
// ✅ CORRECT
export class MyMCP extends McpAgent { ... }

// ❌ WRONG
class MyMCP extends McpAgent { ... }  // Missing export!
```

---

## 2. Transport Mismatch

**Error**: `Connection failed: Unexpected response format`

**Diagnosis**: Client and server transport don't match

**Debug**:
```bash
# Check what your server supports
curl https://my-mcp.workers.dev/sse
curl https://my-mcp.workers.dev/mcp
```

**Solution**: Serve both transports (see SKILL.md Transport section)

---

## 3. OAuth Redirect URI Mismatch

**Error**: `OAuth error: redirect_uri does not match`

**Diagnosis**: Check client configuration vs deployed URL

**Common causes**:
- Developed with localhost, deployed to workers.dev
- HTTP vs HTTPS
- Missing `/oauth/callback` path
- Typo in domain

**Solution**:
```json
// Update after deployment
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse",
      "auth": {
        "authorizationUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/authorize",
        "tokenUrl": "https://my-mcp.YOUR_ACCOUNT.workers.dev/token"
      }
    }
  }
}
```

---

## 4. WebSocket Hibernation State Loss

**Error**: State not found after WebSocket reconnect

**Diagnosis**: Using in-memory state instead of storage

**Wrong**:
```typescript
class MyMCP extends McpAgent {
  userId: string;  // ❌ Lost on hibernation!

  async init() {
    this.userId = "123";
  }
}
```

**Correct**:
```typescript
class MyMCP extends McpAgent {
  async init() {
    await this.state.storage.put("userId", "123");  // ✅ Persisted
  }
}
```

---

## 5. Durable Objects Binding Missing

**Error**: `Cannot read properties of undefined (reading 'idFromName')`

**Diagnosis**: Check wrangler.jsonc

**Solution**:
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

## 6. Migration Not Defined

**Error**: `Durable Object class MyMCP has no migration defined`

**Diagnosis**: First DO deployment needs migration

**Solution**:
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["MyMCP"]
    }
  ]
}
```

**After first deployment**, migrations are locked. Subsequent changes require new migration tags (v2, v3, etc.).

---

## 7. CORS Errors

**Error**: `Access blocked by CORS policy`

**Diagnosis**: Remote MCP server needs CORS headers

**Solution**: Use OAuthProvider (handles CORS automatically) or add headers:
```typescript
return new Response(body, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
});
```

---

## 8. Client Configuration Format Error

**Error**: Claude Desktop doesn't see MCP server

**Diagnosis**: Check JSON format

**Wrong**:
```json
{
  "mcpServers": [  // ❌ Array instead of object!
    {
      "name": "my-mcp",
      "url": "..."
    }
  ]
}
```

**Correct**:
```json
{
  "mcpServers": {  // ✅ Object with named servers
    "my-mcp": {
      "url": "..."
    }
  }
}
```

**Location**:
- Mac: `~/.config/claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

---

## 9. serializeAttachment() Not Used

**Error**: WebSocket metadata lost on hibernation

**Solution**:
```typescript
// Store metadata on WebSocket
webSocket.serializeAttachment({
  userId: "123",
  sessionId: "abc",
  connectedAt: Date.now()
});

// Retrieve on wake
const metadata = webSocket.deserializeAttachment();
console.log(metadata.userId);  // "123"
```

---

## 10. OAuth Consent Screen Disabled

**Security risk**: Users don't know what they're authorizing

**Wrong**:
```typescript
allowConsentScreen: false  // ❌ Never in production!
```

**Correct**:
```typescript
allowConsentScreen: true  // ✅ Always in production
```

---

## 11. JWT Signing Key Missing

**Error**: `JWT_SIGNING_KEY environment variable not set`

**Solution**:
```bash
# Generate secure key
openssl rand -base64 32

# Add to secrets
npx wrangler secret put JWT_SIGNING_KEY

# Or add to wrangler.jsonc (less secure)
"vars": {
  "JWT_SIGNING_KEY": "generated-key-here"
}
```

---

## 12. Environment Variables Not Configured

**Error**: `env.MY_VAR is undefined`

**Diagnosis**: Variables only in `.dev.vars`, not in wrangler.jsonc

**Wrong**:
```bash
# .dev.vars only (works locally, fails in production)
MY_VAR=value
```

**Correct**:
```jsonc
// wrangler.jsonc
{
  "vars": {
    "MY_VAR": "production-value"
  }
}
```

**For secrets**:
```bash
npx wrangler secret put MY_SECRET
```

---

## 13. Tool Schema Validation Error

**Error**: `ZodError: Invalid input type`

**Diagnosis**: Client sends different type than schema expects

**Solution**: Use Zod transforms or coerce
```typescript
// Client sends string "123", but you need number
{
  count: z.string().transform(val => parseInt(val, 10))
}

// Or use coerce
{
  count: z.coerce.number()
}
```

---

## 14. Multiple Transport Endpoints Conflicting

**Error**: `/sse` returns 404 after adding `/mcp`

**Diagnosis**: Path matching issue

**Wrong**:
```typescript
if (pathname === "/sse") {  // ❌ Misses /sse/message
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

**Correct**:
```typescript
if (pathname === "/sse" || pathname.startsWith("/sse/")) {  // ✅
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

---

## 15. Local Testing Limitations

**Error**: OAuth flow fails in `npm run dev`

**Diagnosis**: Miniflare doesn't support all DO features

**Solutions**:

**Option 1**: Use remote dev
```bash
npx wrangler dev --remote
```

**Option 2**: Test OAuth on deployed Worker
```bash
npx wrangler deploy
# Test at https://my-mcp.workers.dev
```

**Option 3**: Mock OAuth for local testing
```typescript
if (env.ENVIRONMENT === "development") {
  // Skip OAuth, use mock user
  return {
    userId: "test-user",
    email: "test@example.com"
  };
}
```

---

## General Debugging Tips

### Check Logs
```bash
npx wrangler tail
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector@latest
```

### Verify Bindings
```bash
npx wrangler kv:namespace list
npx wrangler d1 list
```

### Check Deployment
```bash
npx wrangler deployments list
```

### View Worker Code
```bash
npx wrangler whoami
# Visit dashboard: https://dash.cloudflare.com/
```

---

**Still stuck?** Check:
- Cloudflare Docs: https://developers.cloudflare.com/agents/
- MCP Spec: https://modelcontextprotocol.io/
- Community: https://community.cloudflare.com/
