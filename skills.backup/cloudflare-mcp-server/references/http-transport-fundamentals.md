# HTTP Transport Fundamentals

**Deep dive on URL paths and routing for Cloudflare MCP servers**

This document explains how URL path configuration works in MCP servers and why mismatches are the #1 cause of connection failures.

---

## The Problem

**Most common MCP server connection error:**
```
❌ 404 Not Found
❌ Connection failed
❌ MCP Inspector shows "Failed to connect"
```

**Root cause:** Client URL doesn't match server base path configuration

---

## How Base Paths Work

### The Core Concept

When you call `MyMCP.serveSSE("/sse")`, you're telling the MCP server:

> "All MCP endpoints are available under the `/sse` base path"

This means:
- Initial connection: `https://worker.dev/sse`
- List tools: `https://worker.dev/sse/tools/list`
- Call tool: `https://worker.dev/sse/tools/call`
- List resources: `https://worker.dev/sse/resources/list`

**The base path is prepended to ALL MCP-specific endpoints automatically.**

---

## Example 1: Serving at `/sse`

**Server code:**
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
      //                     ↑ Base path is "/sse"
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Client configuration:**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/sse"
      //                                  ↑ Must include /sse
    }
  }
}
```

**What happens:**
1. Client connects to: `https://my-mcp.workers.dev/sse`
2. Worker receives request with `pathname = "/sse"`
3. Check: `pathname.startsWith("/sse")` → TRUE ✅
4. MCP server handles request
5. Tools available at:
   - `/sse/tools/list`
   - `/sse/tools/call`
   - etc.

---

## Example 2: Serving at `/` (root)

**Server code:**
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return MyMCP.serveSSE("/").fetch(request, env, ctx);
    //                       ↑ Base path is "/" (root)
  }
};
```

**Client configuration:**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev"
      //                                  ↑ No /sse!
    }
  }
}
```

**What happens:**
1. Client connects to: `https://my-mcp.workers.dev`
2. Worker receives request with `pathname = "/"`
3. MCP server handles request at root
4. Tools available at:
   - `/tools/list`
   - `/tools/call`
   - etc. (no /sse prefix)

---

## Example 3: Custom base path

**Server code:**
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/mcp")) {
      return MyMCP.serveSSE("/api/mcp").fetch(request, env, ctx);
      //                     ↑ Base path is "/api/mcp"
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Client configuration:**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/api/mcp"
      //                                  ↑ Must match base path exactly
    }
  }
}
```

---

## Why `pathname.startsWith()` is Critical

**❌ WRONG: Using exact match**
```typescript
if (pathname === "/sse") {
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

**Problem:** This ONLY matches `/sse` exactly
- `/sse` → ✅ Matches
- `/sse/tools/list` → ❌ Doesn't match! 404!
- `/sse/tools/call` → ❌ Doesn't match! 404!

**✅ CORRECT: Using `startsWith()`**
```typescript
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

**Result:** This matches ALL paths under `/sse`
- `/sse` → ✅ Matches
- `/sse/tools/list` → ✅ Matches
- `/sse/tools/call` → ✅ Matches
- `/sse/resources/list` → ✅ Matches

---

## Request/Response Lifecycle

Let's trace a complete MCP request from start to finish.

### Step 1: Client Connection

Client initiates connection:
```
POST https://my-mcp.workers.dev/sse
```

### Step 2: Worker Receives Request

Worker `fetch()` handler is called:
```typescript
const { pathname } = new URL(request.url);
console.log(pathname); // "/sse"
```

### Step 3: Path Matching

Worker checks if path matches:
```typescript
if (pathname.startsWith("/sse")) {  // TRUE!
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

### Step 4: MCP Server Handles Request

MCP Agent processes the request and returns available endpoints.

### Step 5: Client Lists Tools

Client makes follow-up request:
```
POST https://my-mcp.workers.dev/sse/tools/list
```

Worker receives:
```typescript
const { pathname } = new URL(request.url);
console.log(pathname); // "/sse/tools/list"

if (pathname.startsWith("/sse")) {  // TRUE! Matches because of startsWith()
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

MCP server sees `/tools/list` (after stripping `/sse` base path) and returns tool list.

---

## Common Mistakes and Fixes

### Mistake 1: Missing Base Path in Client URL

**Server:**
```typescript
MyMCP.serveSSE("/sse").fetch(...)
```

**Client:**
```json
"url": "https://worker.dev"  // ❌ Missing /sse
```

**Result:** 404 Not Found

**Fix:**
```json
"url": "https://worker.dev/sse"  // ✅ Include /sse
```

---

### Mistake 2: Wrong Base Path

**Server:**
```typescript
if (pathname.startsWith("/api")) {
  return MyMCP.serveSSE("/api").fetch(...);
}
```

**Client:**
```json
"url": "https://worker.dev/sse"  // ❌ Server expects /api
```

**Result:** 404 Not Found

**Fix:**
```json
"url": "https://worker.dev/api"  // ✅ Match server path
```

---

### Mistake 3: Localhost After Deployment

**Development:**
```json
"url": "http://localhost:8788/sse"  // ✅ Works in dev
```

**After deployment** (forgot to update):
```json
"url": "http://localhost:8788/sse"  // ❌ Worker is deployed!
```

**Result:** Connection refused / timeout

**Fix:**
```json
"url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse"  // ✅ Deployed URL
```

---

### Mistake 4: Using Exact Match Instead of `startsWith()`

**Server:**
```typescript
if (pathname === "/sse") {  // ❌ Only matches /sse exactly
  return MyMCP.serveSSE("/sse").fetch(...);
}
```

**Result:**
- `/sse` → ✅ Works (initial connection)
- `/sse/tools/list` → ❌ 404 (tool listing fails)

**Fix:**
```typescript
if (pathname.startsWith("/sse")) {  // ✅ Matches all sub-paths
  return MyMCP.serveSSE("/sse").fetch(...);
}
```

---

## Debugging Workflow

When MCP connection fails:

### Step 1: Check Worker is Running

```bash
curl https://YOUR-WORKER.workers.dev/
```

**Expected:** Some response (even 404 is OK - means Worker is running)
**Problem:** Timeout or connection refused → Worker not deployed

### Step 2: Test MCP Endpoint

```bash
curl https://YOUR-WORKER.workers.dev/sse
```

**Expected:** JSON response with MCP server info
**Problem:** 404 → Client URL doesn't match server base path

### Step 3: Verify Client Config

Check `~/.config/claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://YOUR-WORKER.workers.dev/sse"
    }
  }
}
```

**Verify:**
- [ ] URL matches deployed Worker URL
- [ ] URL includes base path (e.g., `/sse`)
- [ ] No typos in domain or path
- [ ] Using `https://` (not `http://`)

### Step 4: Restart Claude Desktop

Config changes require restart:
1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Check for MCP server in tools list

---

## Multiple Transports

You can serve multiple transports at different paths:

**Server:**
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    // SSE at /sse
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // HTTP at /mcp
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check
    if (pathname === "/" || pathname === "/health") {
      return new Response(JSON.stringify({
        transports: {
          sse: "/sse",
          http: "/mcp"
        }
      }));
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Clients can choose:**
- SSE: `"url": "https://worker.dev/sse"`
- HTTP: `"url": "https://worker.dev/mcp"`

**Why this works:**
- `/sse` and `/mcp` don't conflict
- Each transport has isolated namespace
- Health check available at root `/`

---

## Best Practices

### 1. Always Use `startsWith()` for Path Matching

```typescript
// ✅ CORRECT
if (pathname.startsWith("/sse")) { ... }

// ❌ WRONG
if (pathname === "/sse") { ... }
```

### 2. Add Health Check Endpoint

```typescript
if (pathname === "/" || pathname === "/health") {
  return new Response(JSON.stringify({
    name: "My MCP Server",
    version: "1.0.0",
    transports: {
      sse: "/sse",
      http: "/mcp"
    },
    status: "ok"
  }));
}
```

**Benefits:**
- Quickly verify Worker is running
- Discover available transports
- Debug connection issues

### 3. Use Descriptive 404 Messages

```typescript
return new Response(JSON.stringify({
  error: "Not Found",
  requestedPath: pathname,
  availablePaths: ["/sse", "/mcp", "/health"],
  hint: "Client URL must include base path (e.g., /sse)"
}), { status: 404 });
```

### 4. Test After Every Deployment

```bash
# Deploy
npx wrangler deploy

# Test immediately
curl https://YOUR-WORKER.workers.dev/sse

# Update client config
# Restart Claude Desktop
```

### 5. Document Base Path in Comments

```typescript
// SSE transport at /sse
// Client URL MUST be: https://worker.dev/sse
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
```

---

## Summary

**Key Takeaways:**

1. **Base path in `serveSSE()` determines client URL**
   - `serveSSE("/sse")` → Client uses `https://worker.dev/sse`
   - `serveSSE("/")` → Client uses `https://worker.dev`

2. **Always use `pathname.startsWith()` for matching**
   - Matches sub-paths like `/sse/tools/list`

3. **Test with curl after deployment**
   - `curl https://worker.dev/sse` should return server info

4. **Update client config after every deployment**
   - Development: `http://localhost:8788/sse`
   - Production: `https://worker.workers.dev/sse`

5. **Restart Claude Desktop after config changes**
   - Config only loaded at startup

**Remember:** The #1 MCP connection failure is URL path mismatch. Always verify your base paths match!
