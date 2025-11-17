# Common Errors in TypeScript MCP Servers

This document details 10+ production issues that occur when building MCP servers with TypeScript on Cloudflare Workers, along with their solutions.

---

## Error 1: Export Syntax Issues (CRITICAL)

**Error Message:**
```
Cannot read properties of undefined (reading 'map')
```

**Source:** honojs/hono#3955, honojs/vite-plugins#237

**Why It Happens:**
Vite + Cloudflare Workers require direct export of the Hono app, not an object wrapper. The object wrapper `{ fetch: app.fetch }` causes cryptic build errors because Vite's module resolution fails to properly handle the wrapped export.

**Prevention:**
```typescript
// ❌ WRONG - Causes build errors
export default { fetch: app.fetch };

// ✅ CORRECT - Direct export
export default app;

// Also works for Module Worker format:
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => { /* cron handler */ }
};
// But ONLY if you need scheduled/queue/DO handlers
```

**How to Fix:**
1. Search your codebase for `export default { fetch:`
2. Replace with direct export: `export default app;`
3. Rebuild: `npm run build`

---

## Error 2: Unclosed Transport Connections

**Error Symptoms:**
- Memory leaks in production
- Hanging connections
- Gradual performance degradation

**Source:** Best practice from MCP SDK maintainers

**Why It Happens:**
`StreamableHTTPServerTransport` maintains an open connection. If not explicitly closed when the HTTP response ends, the connection remains open, consuming memory.

**Prevention:**
```typescript
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  // CRITICAL: Always close on response end
  c.res.raw.on('close', () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(c.req.raw, c.res.raw, await c.req.json());

  return c.body(null);
});
```

**How to Fix:**
1. Add `c.res.raw.on('close', () => transport.close());` after creating transport
2. Redeploy

---

## Error 3: Tool Schema Validation Failure

**Error Message:**
```
ListTools request handler fails to generate inputSchema
```

**Source:** GitHub modelcontextprotocol/typescript-sdk#1028

**Why It Happens:**
Zod schemas need to be converted to JSON Schema for MCP protocol compliance. The SDK handles this automatically, but errors occur if schemas are malformed or if manual conversion is attempted incorrectly.

**Prevention:**
```typescript
// ✅ CORRECT - SDK handles Zod → JSON Schema conversion
server.registerTool(
  'tool-name',
  {
    description: 'Tool description',
    inputSchema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    })
  },
  async ({ a, b }) => {
    return { content: [{ type: 'text', text: String(a + b) }] };
  }
);

// ❌ WRONG - External conversion package not needed
import zodToJsonSchema from 'zod-to-json-schema';
server.registerTool('tool-name', {
  inputSchema: zodToJsonSchema(schema)  // Don't do this
}, handler);

// ❌ ALSO WRONG - Zod v4's .toJsonSchema() not needed here
server.registerTool('tool-name', {
  inputSchema: schema.toJsonSchema()  // Don't do this either
}, handler);
```

**How to Fix:**
1. Ensure using SDK v1.20.2+
2. Pass Zod schema directly to `inputSchema` - MCP SDK handles conversion automatically
3. Do NOT use external `zod-to-json-schema` package
4. Do NOT use Zod v4's `.toJsonSchema()` method - let MCP SDK handle it

**Note on Zod v4**: While Zod v4 now has built-in `.toJsonSchema()` method, the MCP SDK
still prefers receiving the raw Zod schema object for optimal type inference and validation.
Only use `.toJsonSchema()` if you need JSON Schema for other purposes outside of MCP.

---

## Error 4: Tool Arguments Not Passed to Handler

**Error Symptoms:**
- Handler receives `undefined` for all arguments
- Tool execution fails with "cannot read property"

**Source:** GitHub modelcontextprotocol/typescript-sdk#1026

**Why It Happens:**
Type mismatch between schema definition and handler signature. The SDK expects exact type alignment.

**Prevention:**
```typescript
// Define schema
const schema = z.object({
  a: z.number(),
  b: z.number()
});

// Infer type from schema
type Input = z.infer<typeof schema>;

// Use typed handler
server.registerTool(
  'add',
  { description: 'Adds numbers', inputSchema: schema },
  async (args: Input) => {  // Type must match schema
    // args.a and args.b are properly typed and passed
    return {
      content: [{ type: 'text', text: String(args.a + args.b) }]
    };
  }
);
```

**How to Fix:**
1. Use `z.infer<typeof schema>` to get the type
2. Type the handler parameter explicitly
3. Ensure parameter names match schema keys exactly

---

## Error 5: CORS Misconfiguration

**Error Symptoms:**
- Browser clients can't connect
- "No 'Access-Control-Allow-Origin' header" error
- Preflight (OPTIONS) requests fail

**Source:** Common production issue

**Why It Happens:**
MCP servers accessed from browsers need CORS headers. Cloudflare Workers don't add these by default.

**Prevention:**
```typescript
import { cors } from 'hono/cors';

app.use('/mcp', cors({
  origin: [
    'http://localhost:3000',       // Dev
    'https://your-app.com'         // Prod
  ],
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // If using cookies/auth
}));

app.post('/mcp', async (c) => {
  // MCP handler
});
```

**How to Fix:**
1. Install: `npm install hono`
2. Add CORS middleware before MCP endpoint
3. Update `origin` array with your domains
4. Redeploy

---

## Error 6: Missing Rate Limiting

**Error Symptoms:**
- API abuse
- DDoS vulnerability
- Unexpected high costs

**Source:** Production security best practice

**Why It Happens:**
Public MCP endpoints without rate limiting are vulnerable to abuse.

**Prevention:**
```typescript
app.post('/mcp', async (c) => {
  // Rate limit by IP
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `ratelimit:${ip}:${Math.floor(Date.now() / 60000)}`;

  const count = await c.env.CACHE.get(rateLimitKey);
  if (count && parseInt(count) >= 100) {  // 100 req/min
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await c.env.CACHE.put(
    rateLimitKey,
    String((parseInt(count || '0') + 1)),
    { expirationTtl: 60 }
  );

  // Continue with MCP handler
});
```

**How to Fix:**
1. Add KV namespace for rate limiting
2. Implement IP-based rate limiting
3. Adjust limits based on your needs
4. Consider using Cloudflare Rate Limiting (paid feature)

---

## Error 7: TypeScript Compilation Memory Issues

**Error Message:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Source:** GitHub modelcontextprotocol/typescript-sdk#985

**Why It Happens:**
The MCP SDK has a large dependency tree. TypeScript compilation can exceed default Node.js memory limits (512MB).

**Prevention:**
```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' tsc && vite build",
    "typecheck": "NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit"
  }
}
```

**How to Fix:**
1. Update build scripts with NODE_OPTIONS
2. Increase to 4096MB (4GB)
3. If still failing, try 8192MB
4. Consider using `tsup` instead of raw `tsc` for faster builds

---

## Error 8: UriTemplate ReDoS Vulnerability

**Error Symptoms:**
- Server hangs on certain URI patterns
- CPU maxed out
- Timeouts

**Source:** GitHub modelcontextprotocol/typescript-sdk#965 (Security)

**Why It Happens:**
Regex denial-of-service (ReDoS) in URI template parsing. Malicious URIs with nested patterns cause exponential regex evaluation.

**Prevention:**
Update to SDK v1.20.2 or later (includes fix):
```bash
npm install @modelcontextprotocol/sdk@latest
```

**How to Fix:**
1. Check current version: `npm list @modelcontextprotocol/sdk`
2. If < 1.20.2, update: `npm install @modelcontextprotocol/sdk@latest`
3. Rebuild and redeploy

---

## Error 9: Authentication Bypass

**Error Symptoms:**
- Unauthorized access to tools
- API abuse
- Data leaks

**Source:** Production security best practice

**Why It Happens:**
MCP servers deployed without authentication are publicly accessible.

**Prevention:**
```typescript
// Use API key authentication
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const isValid = await c.env.MCP_API_KEYS.get(`key:${apiKey}`);

  if (!isValid) {
    return c.json({ error: 'Invalid API key' }, 403);
  }

  await next();
});
```

**How to Fix:**
1. Add authentication middleware (see `authenticated-server.ts` template)
2. Create KV namespace for API keys
3. Generate secure API keys
4. Distribute keys securely to authorized clients

---

## Error 10: Environment Variable Leakage

**Error Symptoms:**
- Secrets exposed in logs
- API keys visible in error messages
- Security breach

**Source:** Cloudflare Workers security best practice

**Why It Happens:**
Logging or returning `env` objects exposes all secrets.

**Prevention:**
```typescript
// ❌ WRONG - Exposes ALL secrets
console.log('Env:', JSON.stringify(env));
return c.json({ env }, 500);

// ✅ CORRECT - Never log env directly
try {
  const apiKey = env.MY_API_KEY;  // Use specific keys only
  // ... use apiKey
} catch (error) {
  console.error('Operation failed:', error.message);  // Safe
  return c.json({ error: 'Internal error' }, 500);
}
```

**How to Fix:**
1. Search codebase for `console.log(env` or `JSON.stringify(env)`
2. Remove all env logging
3. Use specific environment variables only
4. Never return env in responses

---

## Additional Common Issues

### Issue 11: Missing Zod Descriptions

**Why It Matters:**
LLMs use parameter descriptions to understand tools. Missing descriptions = poor tool usage.

**Fix:**
```typescript
// ❌ BAD - No descriptions
z.object({ name: z.string(), age: z.number() })

// ✅ GOOD - Clear descriptions
z.object({
  name: z.string().describe('User full name'),
  age: z.number().describe('User age in years')
})
```

### Issue 12: Large Response Payloads

**Problem:**
Returning huge JSON objects or binary data causes timeouts.

**Fix:**
```typescript
// Limit response size
const MAX_RESPONSE_SIZE = 100000;  // 100KB

server.registerTool('fetch-data', { ... }, async ({ url }) => {
  const response = await fetch(url);
  const text = await response.text();

  if (text.length > MAX_RESPONSE_SIZE) {
    return {
      content: [{
        type: 'text',
        text: `Response too large (${text.length} bytes). First 100KB:\n${text.slice(0, MAX_RESPONSE_SIZE)}`
      }]
    };
  }

  return { content: [{ type: 'text', text }] };
});
```

### Issue 13: Not Handling Async Errors

**Problem:**
Unhandled promise rejections crash Workers.

**Fix:**
```typescript
server.registerTool('risky-operation', { ... }, async (args) => {
  try {
    const result = await riskyAsyncOperation(args);
    return { content: [{ type: 'text', text: result }] };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Operation failed: ${(error as Error).message}`
      }],
      isError: true
    };
  }
});
```

---

## Debugging Checklist

When encountering MCP server issues:

1. [ ] Check SDK version (`npm list @modelcontextprotocol/sdk`)
2. [ ] Verify export syntax (direct export, not object wrapper)
3. [ ] Confirm transport is closed on response end
4. [ ] Test with MCP Inspector (`npx @modelcontextprotocol/inspector`)
5. [ ] Check Cloudflare Workers logs (`wrangler tail`)
6. [ ] Verify authentication middleware (if production)
7. [ ] Test CORS headers (if browser clients)
8. [ ] Review Zod schemas for proper types
9. [ ] Check rate limiting implementation
10. [ ] Ensure no env variables are logged

---

**Last Updated:** 2025-10-28
**Verified Against:** @modelcontextprotocol/sdk@1.20.2
