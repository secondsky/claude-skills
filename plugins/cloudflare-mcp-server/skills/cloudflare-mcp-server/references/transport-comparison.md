# MCP Transport Comparison: SSE vs Streamable HTTP

**Detailed comparison of MCP transport methods for Cloudflare Workers**

---

## Overview

MCP supports two transport methods:
1. **SSE (Server-Sent Events)** - Legacy standard (2024)
2. **Streamable HTTP** - New standard (2025+)

Both work on Cloudflare Workers. You can (and should) support both for maximum compatibility.

---

## SSE (Server-Sent Events)

### What It Is

SSE is a W3C standard for server-to-client streaming over HTTP. The server holds the connection open and pushes events as they occur.

**Technical Details:**
- Protocol: HTTP/1.1 or HTTP/2
- Content-Type: `text/event-stream`
- Connection: Long-lived, unidirectional (server → client)
- Format: Plain text with `data:`, `event:`, `id:` fields

### Code Example

**Server:**
```typescript
MyMCP.serveSSE("/sse").fetch(request, env, ctx)
```

**Client config:**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/sse"
    }
  }
}
```

### Pros

✅ **Wide compatibility** - Supported by all MCP clients (2024+)
✅ **Well-documented** - Lots of examples and tooling
✅ **Easy debugging** - Plain text format, human-readable
✅ **Works with proxies** - Most HTTP proxies support SSE
✅ **Battle-tested** - Used in production for years

### Cons

❌ **Less efficient** - Overhead from text encoding
❌ **Being deprecated** - MCP is moving to Streamable HTTP
❌ **Unidirectional** - Server can push, but client uses separate requests
❌ **Text-only** - Binary data must be base64-encoded
❌ **Connection limits** - Browsers limit SSE connections per domain

### When to Use

- **2024-2025 transition period** - Maximum compatibility
- **Debugging** - Easier to inspect traffic
- **Legacy clients** - Older MCP implementations
- **Development** - Simpler to test with curl/MCP Inspector

---

## Streamable HTTP

### What It Is

Streamable HTTP is a modern standard for bidirectional streaming using HTTP/2+ streams. More efficient than SSE.

**Technical Details:**
- Protocol: HTTP/2 or HTTP/3
- Content-Type: `application/json` (streaming)
- Connection: Bidirectional (client ↔ server)
- Format: NDJSON (newline-delimited JSON)

### Code Example

**Server:**
```typescript
MyMCP.serve("/mcp").fetch(request, env, ctx)
```

**Client config:**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/mcp"
    }
  }
}
```

### Pros

✅ **More efficient** - Binary-safe, less overhead
✅ **2025 standard** - MCP's future default
✅ **Bidirectional** - Full-duplex communication
✅ **Better streaming** - Natively supports streaming responses
✅ **HTTP/2 multiplexing** - Multiple streams over one connection

### Cons

❌ **Newer clients only** - Not all 2024 clients support it
❌ **Less tooling** - Fewer debugging tools than SSE
❌ **HTTP/2 required** - Cloudflare Workers support this automatically
❌ **More complex** - Harder to debug than plain text SSE

### When to Use

- **2025+** - Future-proof your implementation
- **Performance-critical** - High-throughput or low-latency needs
- **Modern clients** - Latest Claude Desktop, MCP Inspector
- **Production** - When paired with SSE fallback

---

## Side-by-Side Comparison

| Feature | SSE | Streamable HTTP |
|---------|-----|-----------------|
| **Protocol** | HTTP/1.1+ | HTTP/2+ |
| **Direction** | Unidirectional | Bidirectional |
| **Format** | Text (`text/event-stream`) | NDJSON |
| **Efficiency** | Lower | Higher |
| **Compatibility** | All MCP clients | 2025+ clients |
| **Debugging** | Easy (plain text) | Moderate (JSON) |
| **Binary data** | base64-encoded | Native support |
| **Cloudflare cost** | Standard | Standard (no difference) |
| **MCP Standard** | Legacy (2024) | Current (2025+) |

---

## Supporting Both Transports

**Best practice:** Serve both for maximum compatibility during 2024-2025 transition.

### Implementation

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

    // Health check showing available transports
    if (pathname === "/" || pathname === "/health") {
      return new Response(JSON.stringify({
        name: "My MCP Server",
        version: "1.0.0",
        transports: {
          sse: "/sse",    // For legacy clients
          http: "/mcp"    // For modern clients
        }
      }));
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

### Client Configuration

Clients can choose which transport to use:

**Legacy client (SSE):**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/sse"
    }
  }
}
```

**Modern client (HTTP):**
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://worker.dev/mcp"
    }
  }
}
```

---

## Performance Comparison

### Latency

**SSE:**
- Initial connection: ~100-200ms
- Tool call: ~50-100ms
- Streaming response: Good (text-based)

**Streamable HTTP:**
- Initial connection: ~100-200ms (similar)
- Tool call: ~40-80ms (slightly faster)
- Streaming response: Excellent (binary-safe)

**Verdict:** Streamable HTTP is marginally faster, but difference is negligible for most use cases.

---

### Bandwidth

**Example: 1KB text response**

**SSE:**
```
data: {"content":[{"type":"text","text":"Hello"}]}\n\n
```
- Overhead: `data: ` prefix, double newlines
- Total: ~1.05KB

**Streamable HTTP:**
```json
{"content":[{"type":"text","text":"Hello"}]}
```
- Overhead: None (pure JSON)
- Total: ~1.00KB

**Verdict:** Streamable HTTP is 5-10% more efficient (text) and much better for binary data.

---

### Connection Limits

**SSE:**
- Browsers: 6 connections per domain (HTTP/1.1)
- Not an issue for CLI/Desktop clients

**Streamable HTTP:**
- HTTP/2 multiplexing: Effectively unlimited
- Multiple streams over single connection

**Verdict:** Streamable HTTP scales better for multi-connection scenarios.

---

## Migration Path

### 2024 (Now)

**Recommendation:** Support both transports
- SSE for wide compatibility
- HTTP for future-proofing

**Code:**
```typescript
// Support both
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(...);
}
if (pathname.startsWith("/mcp")) {
  return MyMCP.serve("/mcp").fetch(...);
}
```

---

### 2025 (Future)

**Recommendation:** Deprecate SSE, keep as fallback
- HTTP as primary
- SSE for legacy clients only

**Code:**
```typescript
// Prefer HTTP
if (pathname.startsWith("/mcp")) {
  return MyMCP.serve("/mcp").fetch(...);
}
// Legacy SSE fallback
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(...);
}
```

---

### 2026+ (Long-term)

**Recommendation:** HTTP only
- Remove SSE support
- All clients updated to HTTP

**Code:**
```typescript
// HTTP only
if (pathname.startsWith("/mcp")) {
  return MyMCP.serve("/mcp").fetch(...);
}
```

---

## Cloudflare Workers Considerations

### Cost

**Both transports cost the same** on Cloudflare Workers:
- Charged per request
- Charged per CPU time
- No difference in pricing

### Performance

**Cloudflare Workers natively support both:**
- SSE: Works perfectly (HTTP/1.1 and HTTP/2)
- HTTP/2: Automatic (no configuration needed)
- Streaming: Both transports can stream responses

### Limits

**No transport-specific limits:**
- Request size: 100MB (both)
- CPU time: 50ms-30s depending on plan (both)
- Concurrent requests: Unlimited (both)

---

## Debugging

### SSE Debugging

**curl:**
```bash
curl -N https://worker.dev/sse
```

**Output:**
```
data: {"jsonrpc":"2.0","method":"initialize",...}

data: {"jsonrpc":"2.0","method":"tools/list",...}
```

**Human-readable:** ✅ Easy to inspect

---

### HTTP Debugging

**curl:**
```bash
curl https://worker.dev/mcp -H "Content-Type: application/json" -d '{...}'
```

**Output:**
```json
{"jsonrpc":"2.0","method":"initialize",...}
{"jsonrpc":"2.0","method":"tools/list",...}
```

**Human-readable:** ✅ Still readable (NDJSON)

---

## When to Choose One Over the Other

### Choose SSE When:

- Supporting 2024 MCP clients
- Debugging connection issues (easier to inspect)
- Working with legacy systems
- Need maximum compatibility
- Developing/testing with basic tools

### Choose Streamable HTTP When:

- Building for 2025+
- Performance matters (high-throughput)
- Using modern clients (latest Claude Desktop)
- Want future-proof implementation
- Need bidirectional streaming

### Support Both When:

- In production (2024-2025 transition)
- Serving diverse clients
- Want maximum compatibility
- No cost difference (same Worker code)

---

## Summary

**Current Recommendation (2024-2025):**
```typescript
// Support BOTH transports
if (pathname.startsWith("/sse")) {
  return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
}
if (pathname.startsWith("/mcp")) {
  return MyMCP.serve("/mcp").fetch(request, env, ctx);
}
```

**Why:**
- SSE: Maximum compatibility
- HTTP: Future-proof
- No cost difference
- Clients choose what they support

**Future (2026+):**
- HTTP will be the only standard
- SSE will be deprecated
- But for now, support both!

---

## Additional Resources

- **MCP Specification**: https://modelcontextprotocol.io/
- **SSE Spec (W3C)**: https://html.spec.whatwg.org/multipage/server-sent-events.html
- **HTTP/2 Spec (RFC 7540)**: https://httpwg.org/specs/rfc7540.html
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
