# Worker & Durable Objects Basics

This guide covers the fundamentals of Cloudflare Workers and Durable Objects that are essential for building MCP servers.

---

## Worker & Durable Objects Basics

*Self-contained section for standalone use*

### Worker Export Pattern

**Workers must export a `fetch` handler**:
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    // Handle request
    return new Response("Hello");
  }
};
```

### Durable Objects Class Structure

**DOs extend McpAgent** (for MCP servers):
```typescript
export class MyMCP extends McpAgent<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  // Your methods here
}
```

### Bindings Configuration

**Environment bindings** give Workers access to resources:
```jsonc
{
  "kv_namespaces": [{ "binding": "MY_KV", "id": "..." }],
  "durable_objects": {
    "bindings": [{ "name": "MY_DO", "class_name": "MyDO" }]
  },
  "r2_buckets": [{ "binding": "MY_BUCKET", "bucket_name": "..." }]
}
```

**Access in code**:
```typescript
env.MY_KV.get("key");
env.MY_DO.idFromName("session-123").getStub(env);
env.MY_BUCKET.get("file.txt");
```

---


---

## Transport Selection Guide

MCP supports **two transport methods**: SSE (legacy) and Streamable HTTP (2025 standard).

### SSE (Server-Sent Events)

**Best for**: Wide client compatibility (2024 clients), legacy support

**Serving**:
```typescript
MyMCP.serveSSE("/sse").fetch(request, env, ctx)
```

**Client config**:
```json
{
  "url": "https://my-mcp.workers.dev/sse"
}
```

**Pros**:
- ✅ Supported by all MCP clients (2024+)
- ✅ Easy debugging (plain HTTP)
- ✅ Works with MCP Inspector

**Cons**:
- ❌ Less efficient than HTTP streaming
- ❌ Being deprecated in 2025

---

### Streamable HTTP

**Best for**: Modern clients (2025+), better performance

**Serving**:
```typescript
MyMCP.serve("/mcp").fetch(request, env, ctx)
```

**Client config**:
```json
{
  "url": "https://my-mcp.workers.dev/mcp"
}
```

**Pros**:
- ✅ More efficient than SSE
- ✅ 2025 standard
- ✅ Better streaming support

**Cons**:
- ❌ Newer clients only
- ❌ Less mature tooling

---

### Support Both (Recommended)

**Serve both transports** for maximum compatibility:

```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    // SSE transport (legacy)
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // HTTP transport (2025 standard)
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check endpoint (optional but recommended)
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "My MCP Server",
          version: "1.0.0",
          transports: {
            sse: "/sse",
            http: "/mcp"
          },
          status: "ok",
          timestamp: new Date().toISOString()
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Why this works**:
- SSE clients connect to `/sse`
- HTTP clients connect to `/mcp`
- Health checks available at `/` or `/health`
- No transport conflicts

**CRITICAL**: Use `pathname.startsWith()` to match paths correctly!

---


---

## ⚠️ CRITICAL: HTTP Transport Fundamentals

**The #1 reason MCP servers fail to connect is URL path configuration mistakes.**

### URL Path Configuration Deep-Dive

When you serve an MCP server at a specific path, **the client URL must match exactly**.

**Example 1: Serving at `/sse`**
```typescript
// src/index.ts
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);  // ← Base path is "/sse"
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Client configuration MUST include `/sse`**:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/sse"  // ✅ Correct
    }
  }
}
```

**❌ WRONG client configurations**:
```json
"url": "https://my-mcp.workers.dev"      // Missing /sse → 404
"url": "https://my-mcp.workers.dev/"     // Missing /sse → 404
"url": "http://localhost:8788"           // Wrong after deploy
```

---

**Example 2: Serving at `/` (root)**
```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return MyMCP.serveSSE("/").fetch(request, env, ctx);  // ← Base path is "/"
  }
};
```

**Client configuration**:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev"  // ✅ Correct (no /sse)
    }
  }
}
```

---

### How Base Path Affects Tool URLs

**When you call `serveSSE("/sse")`**, MCP tools are served at:
```
https://my-mcp.workers.dev/sse/tools/list
https://my-mcp.workers.dev/sse/tools/call
https://my-mcp.workers.dev/sse/resources/list
```

**When you call `serveSSE("/")`**, MCP tools are served at:
```
https://my-mcp.workers.dev/tools/list
https://my-mcp.workers.dev/tools/call
https://my-mcp.workers.dev/resources/list
```

**The base path is prepended to all MCP endpoints automatically.**

---

### Request/Response Lifecycle

```
1. Client connects to: https://my-mcp.workers.dev/sse
                                ↓
2. Worker receives request: { url: "https://my-mcp.workers.dev/sse", ... }
                                ↓
3. Your fetch handler: const { pathname } = new URL(request.url)
                                ↓
4. pathname === "/sse" → Check passes
                                ↓
5. MyMCP.serveSSE("/sse").fetch() → MCP server handles request
                                ↓
6. Tool calls routed to: /sse/tools/call
```

**If client connects to `https://my-mcp.workers.dev`** (missing `/sse`):
```
pathname === "/" → Check fails → 404 Not Found
```

---

### Testing Your URL Configuration

**Step 1: Deploy your MCP server**
```bash
npx wrangler deploy
# Output: Deployed to https://my-mcp.YOUR_ACCOUNT.workers.dev
```

**Step 2: Test the base path with curl**
```bash
# If serving at /sse, test this URL:
curl https://my-mcp.YOUR_ACCOUNT.workers.dev/sse

# Should return MCP server info (not 404)
```

**Step 3: Update client config with the EXACT URL you tested**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.YOUR_ACCOUNT.workers.dev/sse"  // Match curl URL
    }
  }
}
```

**Step 4: Restart Claude Desktop**

---

### Post-Deployment Checklist

After deploying, verify:
- [ ] `curl https://worker.dev/sse` returns MCP server info (not 404)
- [ ] Client config URL matches deployed URL exactly
- [ ] No typos in URL (common: `workes.dev` instead of `workers.dev`)
- [ ] Using `https://` (not `http://`) for deployed Workers
- [ ] If using OAuth, redirect URI also updated

---

