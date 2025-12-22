# MCP Server Debugging Guide

**Troubleshooting connection issues and common errors**

---

## Quick Diagnosis Flowchart

```
MCP Connection Failing?
         |
         v
[1] Can you curl the Worker?
    curl https://worker.dev/
         |
    NO ──┴─> Worker not deployed
         |   → Run: npx wrangler deploy
         |
    YES ──┴─> Continue
         |
         v
[2] Can you curl the MCP endpoint?
    curl https://worker.dev/sse
         |
    404 ──┴─> URL path mismatch (most common!)
         |   → Check: Client URL matches server base path
         |   → See: "URL Path Mismatch" section below
         |
    OK ──┴─> Continue
         |
         v
[3] Did you update config after deployment?
         |
    NO ──┴─> Update claude_desktop_config.json
         |   → Use deployed URL (not localhost)
         |   → Restart Claude Desktop
         |
    YES ──┴─> Continue
         |
         v
[4] Check Worker logs
    npx wrangler tail
         |
         v
    See errors? → Check "Common Errors" section below
```

---

## Problem 1: URL Path Mismatch (Most Common!)

### Symptoms

- ❌ 404 Not Found
- ❌ Connection failed
- ❌ MCP Inspector shows "Failed to connect"
- ❌ Claude Desktop doesn't show tools

### Root Cause

Client URL doesn't match server base path configuration.

### Debugging Steps

#### Step 1: Check what base path your server uses

Look at your `src/index.ts`:

```typescript
// Option A: Serving at /sse
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(...);
  //                     ↑ Base path is "/sse"
}

// Option B: Serving at root /
return MyMCP.serveSSE("/").fetch(...);
//                       ↑ Base path is "/"
```

#### Step 2: Test with curl

```bash
# If base path is /sse:
curl https://YOUR-WORKER.workers.dev/sse

# If base path is /:
curl https://YOUR-WORKER.workers.dev/
```

**Expected:** JSON response with server info
**Got 404?** Your URL doesn't match the base path

#### Step 3: Update client config

Match the curl URL that worked:

```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://YOUR-WORKER.workers.dev/sse"  // Must match curl URL!
    }
  }
}
```

#### Step 4: Restart Claude Desktop

Config only loads at startup:
1. Quit Claude Desktop completely
2. Reopen
3. Check for tools

### Common Variations

**Server at `/sse`, client missing `/sse`:**
```typescript
// Server
MyMCP.serveSSE("/sse").fetch(...)

// Client (wrong)
"url": "https://worker.dev"  // ❌ Missing /sse
```

**Fix:**
```json
"url": "https://worker.dev/sse"  // ✅ Include /sse
```

---

**Server at `/`, client includes `/sse`:**
```typescript
// Server
MyMCP.serveSSE("/").fetch(...)

// Client (wrong)
"url": "https://worker.dev/sse"  // ❌ Server at root, not /sse
```

**Fix:**
```json
"url": "https://worker.dev"  // ✅ No /sse
```

---

## Problem 2: Localhost After Deployment

### Symptoms

- ❌ Connection timeout
- ❌ Connection refused
- ❌ Works in dev, fails in production

### Root Cause

Client config still using `localhost` URL after deployment.

### Debugging Steps

#### Step 1: Check client config

```bash
cat ~/.config/claude/claude_desktop_config.json
```

Look for:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "http://localhost:8788/sse"  // ❌ localhost!
    }
  }
}
```

#### Step 2: Get deployed URL

```bash
npx wrangler deploy

# Output shows:
# Deployed to: https://my-mcp.YOUR_ACCOUNT.workers.dev
```

#### Step 3: Update client config

```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse"  // ✅ Deployed URL
    }
  }
}
```

#### Step 4: Restart Claude Desktop

---

## Problem 3: Worker Not Deployed

### Symptoms

- ❌ curl returns connection refused/timeout
- ❌ No response at all

### Debugging Steps

#### Step 1: Check deployment status

```bash
npx wrangler whoami
# Shows: logged in as...

npx wrangler deployments list
# Shows: recent deployments (or none)
```

#### Step 2: Deploy

```bash
npx wrangler deploy
```

#### Step 3: Verify deployment

```bash
curl https://YOUR-WORKER.workers.dev/

# Should return SOMETHING (even 404 means it's running)
```

---

## Problem 4: OAuth URL Mismatch

### Symptoms

- ❌ `OAuth error: redirect_uri does not match`
- ❌ OAuth flow starts but fails at callback
- ❌ Token exchange fails

### Root Cause

OAuth URLs don't match deployed URL.

### Debugging Steps

#### Step 1: Check ALL three OAuth URLs

```bash
cat ~/.config/claude/claude_desktop_config.json
```

Look for:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/sse",  // ← Check 1
      "auth": {
        "type": "oauth",
        "authorizationUrl": "https://worker.dev/authorize",  // ← Check 2
        "tokenUrl": "https://worker.dev/token"  // ← Check 3
      }
    }
  }
}
```

#### Step 2: Verify ALL URLs match

**Must all use same:**
- Protocol: `https://` (not mixed http/https)
- Domain: Same Workers domain
- No typos: `authorize` not `auth`, `token` not `tokens`

#### Step 3: Test each endpoint

```bash
curl https://worker.dev/sse  # Main endpoint
curl https://worker.dev/authorize  # OAuth authorize (should show HTML)
curl https://worker.dev/token  # Token endpoint
```

---

## Problem 5: CORS Errors

### Symptoms

- ❌ `Access to fetch at '...' blocked by CORS policy`
- ❌ `Method Not Allowed` for OPTIONS requests
- ❌ Works in curl, fails in browser

### Root Cause

Missing CORS headers or OPTIONS handler.

### Debugging Steps

#### Step 1: Test with browser

Open browser console and try:
```javascript
fetch('https://worker.dev/sse')
```

#### Step 2: Check OPTIONS handler

Your Worker should handle OPTIONS:
```typescript
if (request.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

#### Step 3: Test OPTIONS request

```bash
curl -X OPTIONS https://worker.dev/sse -v
```

**Expected:** 204 No Content with CORS headers
**Got:** 405 Method Not Allowed → Add OPTIONS handler

---

## Problem 6: Environment Variables Missing

### Symptoms

- ❌ `TypeError: env.API_KEY is undefined`
- ❌ Tools return empty data
- ❌ Silent failures (no error, but wrong results)

### Debugging Steps

#### Step 1: Check local development

```bash
# Check .dev.vars exists
cat .dev.vars

# Should have:
API_KEY=dev-key-123
DATABASE_URL=http://localhost:3000
```

#### Step 2: Check production config

```bash
# Check wrangler.jsonc
cat wrangler.jsonc
```

**Public vars:**
```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info"
  }
}
```

**Secrets:**
```bash
# List secrets
npx wrangler secret list

# Add missing secret
npx wrangler secret put API_KEY
```

#### Step 3: Add validation

In your `init()` method:
```typescript
async init() {
  // Validate required env vars
  if (!this.env.API_KEY) {
    throw new Error("API_KEY not configured");
  }

  // Continue...
}
```

---

## Problem 7: Durable Objects Not Working

### Symptoms

- ❌ `TypeError: Cannot read properties of undefined (reading 'idFromName')`
- ❌ State not persisting
- ❌ `Durable Object class MyMCP has no migration defined`

### Debugging Steps

#### Step 1: Check binding

```bash
cat wrangler.jsonc
```

**Must have:**
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

#### Step 2: Check migration

```jsonc
{
  "migrations": [
    { "tag": "v1", "new_classes": ["MyMCP"] }
  ]
}
```

#### Step 3: Deploy with migration

```bash
npx wrangler deploy
```

First deployment requires migration!

---

## Checking Worker Logs

### Real-time logs

```bash
npx wrangler tail
```

**Shows:**
- All console.log() output
- Errors with stack traces
- Request/response info

### Filtering logs

```bash
# Only errors
npx wrangler tail --format=json | jq 'select(.level=="error")'

# Only specific message
npx wrangler tail | grep "API_KEY"
```

---

## Common Error Messages

### Error: "404 Not Found"

**Cause:** URL path mismatch (see Problem 1)

**Fix:**
1. Check server base path
2. Update client URL to match
3. Restart Claude Desktop

---

### Error: "Connection refused" / "ECONNREFUSED"

**Cause:** Worker not deployed or wrong URL

**Fix:**
1. Deploy: `npx wrangler deploy`
2. Update client config with deployed URL
3. Restart Claude Desktop

---

### Error: "OAuth error: redirect_uri does not match"

**Cause:** OAuth URLs don't match deployed domain

**Fix:**
1. Update ALL three OAuth URLs in client config
2. Use same domain and protocol for all
3. Restart Claude Desktop

---

### Error: "TypeError: env.BINDING is undefined"

**Cause:** Missing binding in wrangler.jsonc

**Fix:**
1. Add binding to wrangler.jsonc
2. Deploy: `npx wrangler deploy`
3. Restart

---

### Error: "Access to fetch blocked by CORS policy"

**Cause:** Missing CORS headers or OPTIONS handler

**Fix:**
1. Add OPTIONS handler (see Problem 5)
2. Deploy
3. Test in browser

---

### Error: "ZodError: Invalid input type"

**Cause:** Client sends wrong data type for parameter

**Fix:**
```typescript
// Use Zod transform
param: z.string().transform(val => parseInt(val, 10))
```

---

## Testing Checklist

Before declaring "it works":

- [ ] Worker deployed: `npx wrangler deploy` succeeded
- [ ] Worker running: `curl https://worker.dev/` returns something
- [ ] MCP endpoint: `curl https://worker.dev/sse` returns server info
- [ ] Client config updated with deployed URL
- [ ] Client config URL matches curl test
- [ ] Claude Desktop restarted
- [ ] Tools visible in Claude Desktop
- [ ] Test tool call succeeds
- [ ] Worker logs clean: `npx wrangler tail` shows no errors
- [ ] (OAuth) All three URLs match
- [ ] (DO) Bindings configured
- [ ] (Secrets) Environment variables set

---

## Advanced Debugging

### Enable verbose logging

```typescript
export class MyMCP extends McpAgent<Env> {
  async init() {
    console.log("MyMCP initializing...");
    console.log("Environment:", {
      hasAPIKey: !!this.env.API_KEY,
      hasDB: !!this.env.DB,
    });

    this.server.tool(
      "test",
      "Test tool",
      { msg: z.string() },
      async ({ msg }) => {
        console.log("Tool called with:", msg);
        return { content: [{ type: "text", text: `Echo: ${msg}` }] };
      }
    );
  }
}
```

**View logs:**
```bash
npx wrangler tail
```

---

### Test MCP protocol directly

Use MCP Inspector for protocol-level debugging:

```bash
npx @modelcontextprotocol/inspector@latest
```

1. Open http://localhost:5173
2. Enter Worker URL
3. Click "Connect"
4. Try "List Tools"
5. Inspect request/response

**Benefits:**
- See exact JSON-RPC messages
- Test individual tool calls
- Verify protocol compliance

---

### Check Cloudflare dashboard

1. Visit https://dash.cloudflare.com/
2. Go to Workers & Pages
3. Find your Worker
4. Check:
   - Deployment status
   - Recent logs
   - Analytics

---

## Prevention

### Add health check endpoint

```typescript
if (pathname === "/" || pathname === "/health") {
  return new Response(JSON.stringify({
    name: "My MCP Server",
    version: "1.0.0",
    transports: { sse: "/sse", http: "/mcp" },
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
}
```

**Test:** `curl https://worker.dev/health`

---

### Add startup validation

```typescript
async init() {
  // Validate environment
  if (!this.env.API_KEY) {
    throw new Error("API_KEY not configured");
  }

  // Log successful initialization
  console.log("MCP server initialized successfully");
}
```

---

### Use descriptive 404 messages

```typescript
return new Response(JSON.stringify({
  error: "Not Found",
  requestedPath: pathname,
  availablePaths: ["/sse", "/mcp", "/health"],
  hint: "Client URL must include base path",
  example: "https://worker.dev/sse"
}), { status: 404 });
```

---

## Summary

**Most common issues (in order):**

1. **URL path mismatch** (80% of problems)
   - Fix: Match client URL to server base path

2. **Localhost after deployment** (10%)
   - Fix: Update config with deployed URL

3. **OAuth URL mismatch** (5%)
   - Fix: Update ALL three OAuth URLs

4. **Missing environment variables** (3%)
   - Fix: Add to .dev.vars or wrangler secrets

5. **Other** (2%)
   - Check Worker logs: `npx wrangler tail`

**Golden debugging workflow:**
```bash
1. curl https://worker.dev/          # Worker running?
2. curl https://worker.dev/sse       # MCP endpoint works?
3. Check client config matches URL   # Config correct?
4. Restart Claude Desktop            # Reloaded config?
5. npx wrangler tail                 # Any errors?
```

**Remember:** 80% of MCP connection issues are URL path mismatches. Always start there!
