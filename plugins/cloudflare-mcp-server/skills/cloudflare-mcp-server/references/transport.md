# MCP Transport Methods - SSE vs Streamable HTTP

Comparison of the two MCP transport protocols supported by Cloudflare.

---

## Quick Comparison

| Feature | SSE | Streamable HTTP |
|---------|-----|-----------------|
| **Status** | Legacy | Current (2025) |
| **Efficiency** | Lower | Higher |
| **Adoption** | High (all clients) | Low (new clients) |
| **Endpoint** | `/sse` | `/mcp` |
| **Method** | `serveSSE()` | `serve()` |
| **Recommendation** | Support both | Support both |

---

## SSE (Server-Sent Events)

### Overview
- Original MCP transport
- Uses HTTP + Server-Sent Events
- Widely supported by all MCP clients

### Implementation
```typescript
MyMCP.serveSSE("/sse").fetch(request, env, ctx)
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
✅ Supported by all MCP clients
✅ Established protocol
✅ Works everywhere

### Cons
❌ Less efficient
❌ Higher latency
❌ More bandwidth

---

## Streamable HTTP

### Overview
- New MCP transport (2025)
- Uses HTTP with streaming
- More efficient, lower latency

### Implementation
```typescript
MyMCP.serve("/mcp").fetch(request, env, ctx)
```

### Client Configuration
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp.workers.dev/mcp"
    }
  }
}
```

### Pros
✅ More efficient
✅ Lower latency
✅ Less bandwidth
✅ Better error handling

### Cons
❌ Not all clients support yet
❌ Newer standard

---

## Supporting Both (Recommended)

```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

**Why support both?**
- Maximum client compatibility
- Smooth transition as clients upgrade
- No breaking changes

---

## With OAuth

```typescript
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
  // ... OAuth config ...

  apiHandlers: {
    "/sse": MyMCP.serveSSE("/sse"),
    "/mcp": MyMCP.serve("/mcp")
  }
});
```

---

## Testing

### Test SSE
```bash
npx @modelcontextprotocol/inspector@latest
# Enter: http://localhost:8788/sse
```

### Test Streamable HTTP
```bash
# Use mcp-remote adapter
npx mcp-remote http://localhost:8788/mcp
```

---

**Recommendation**: **Support both transports** for maximum compatibility.
