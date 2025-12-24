# Troubleshooting Guide

**Last Updated**: 2025-11-11
**Skill**: mcp-dynamic-orchestrator
**Maintainer**: Claude Skills Maintainers

---

## Quick Diagnosis

**Run this command first**:
```bash
# Check if skill is installed
ls -la ~/.claude/skills/mcp-dynamic-orchestrator

# Check registry file
cat ~/.claude/skills/mcp-dynamic-orchestrator/mcp.registry.json | jq .servers[].id
```

**Expected output**:
```
cloudflare
nuxt
shadcn
playwright
... (16 total MCPs)
```

---

## Common Issues

### 1. "No MCP servers configured"

#### Symptoms
```
list_mcp_capabilities({ query: "Cloudflare" })
→ Result: { servers: [], message: "No MCP servers configured" }
```

#### Causes
-  `mcp.registry.json` is empty or missing
- Registry file has invalid JSON
- Registry file is in wrong location

#### Solutions

**Check if file exists**:
```bash
ls -la skills/mcp-dynamic-orchestrator/mcp.registry.json
```

**Validate JSON**:
```bash
jq . skills/mcp-dynamic-orchestrator/mcp.registry.json
```

If it shows error: Fix JSON syntax.

**Check file permissions**:
```bash
chmod 644 skills/mcp-dynamic-orchestrator/mcp.registry.json
```

**Restore from backup** (if you have one):
```bash
cp mcp.registry.json.bak mcp.registry.json
```

**Re-create minimal registry**:
```json
{
  "servers": [
    {
      "id": "time",
      "title": "Time MCP",
      "summary": "Provide time and timezone utilities",
      "mcp": {
        "transport": "stdio",
        "command": "uvx",
        "args": ["mcp-server-time"]
      },
      "domains": ["time", "timezone"],
      "tags": ["time", "timezone"],
      "examples": ["Query current time"],
      "sensitivity": "low",
      "visibility": "default",
      "priority": 6,
      "autoDiscoverTools": true
    }
  ]
}
```

---

### 2. "MCP connection timeout"

#### Symptoms
```
describe_mcp({ id: "cloudflare" })
→ Error: MCP connection timeout after 10s
```

#### Causes
- MCP server not installed
- MCP server takes >10s to start
- Network issue (for HTTP transport)
- MCP server crashed on startup

#### Solutions

**Test MCP manually**:
```bash
# For stdio MCPs
npx mcp-remote https://docs.mcp.cloudflare.com/sse

# Should output JSON-RPC messages
# Press Ctrl+C to exit

# For Python MCPs
uvx mcp-server-time
```

**Check MCP server logs**:
```bash
# Redirect stderr to see error messages
npx mcp-remote https://docs.mcp.cloudflare.com/sse 2>&1 | tee mcp.log
```

**Increase timeout** (temporary workaround):

Edit `src/orchestrator.ts`:
```typescript
// Line ~160
const DEFAULT_TIMEOUT = 10000;  // Change to 30000
```

**Install MCP server explicitly**:
```bash
# For npm packages
npm install -g mcp-remote

# For Python packages
pip install mcp-server-time
# or
uv tool install mcp-server-time
```

**Check network** (for HTTP MCPs):
```bash
curl -X POST https://docs.mcp.cloudflare.com/sse \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

---

### 3. "execute_mcp_code not enabled"

#### Symptoms
```
execute_mcp_code({ code: "...", allowedMcpIds: [...] })
→ Error: Sandbox not enabled. Set MCP_ORCH_ENABLE_SANDBOX=1
```

#### Cause
Sandbox is disabled by default for security reasons.

#### Solution

**Enable sandbox** (only if you trust the code source):
```bash
# Temporary (current terminal session)
export MCP_ORCH_ENABLE_SANDBOX=1

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export MCP_ORCH_ENABLE_SANDBOX=1' >> ~/.bashrc
source ~/.bashrc
```

**⚠️ Security Warning**:
- Only enable for Claude-generated code
- DO NOT enable for user-provided code
- See [security-model.md](./security-model.md) for details

---

### 4. "Module import failed"

#### Symptoms
```typescript
import * as cloudflare from "mcp-clients/cloudflare";
→ Error: Cannot find module 'mcp-clients/cloudflare'
```

#### Cause
Module resolution not yet implemented in sandbox.

#### Solution

**Use `$call` API instead**:
```typescript
// ❌ This doesn't work yet
import * as cloudflare from "mcp-clients/cloudflare";
const result = await cloudflare.search_docs({ query: "..." });

// ✅ Use this instead
const cloudflare = await import("mcp-clients/cloudflare");
const result = await cloudflare.$call("search_cloudflare_documentation", {
  query: "..."
});
```

**Why**:
Module resolution requires custom require() hook, not yet implemented.

**Status**: Planned for v1.1 (see [plan.md](../../plan.md))

---

### 5. "Tool not found"

#### Symptoms
```typescript
await cloudflare.$call("unknown_tool", {})
→ Error: Tool 'unknown_tool' not found
```

#### Causes
- Tool name misspelled
- Tool not available in this MCP
- MCP server version mismatch

#### Solutions

**List available tools**:
```typescript
describe_mcp({ id: "cloudflare", detail: "full" })
→ Returns: [
  { tool: "search_cloudflare_documentation", ... },
  { tool: "migrate_pages_to_workers_guide", ... }
]
```

**Check tool name spelling**:
```bash
# Search registry for tool mention
jq '.servers[] | select(.id=="cloudflare") | .examples' \
  skills/mcp-dynamic-orchestrator/mcp.registry.json
```

**Test MCP directly**:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  npx mcp-remote https://docs.mcp.cloudflare.com/sse | \
  jq '.result.tools[].name'
```

**Update MCP server**:
```bash
# Clear npx cache
npx clear-npx-cache

# Re-run MCP
npx mcp-remote https://docs.mcp.cloudflare.com/sse
```

---

### 6. "Invalid arguments"

#### Symptoms
```typescript
await cloudflare.$call("search_cloudflare_documentation", {})
→ Error: Invalid arguments: query is required
```

#### Cause
Missing required argument or wrong type.

#### Solutions

**Check tool schema**:
```typescript
describe_mcp({ id: "cloudflare", detail: "schema" })
→ Returns: {
  tools: [{
    name: "search_cloudflare_documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]  // ← query is required
    }
  }]
}
```

**Provide all required arguments**:
```typescript
// ❌ Missing query
await cloudflare.$call("search_cloudflare_documentation", {})

// ✅ With query
await cloudflare.$call("search_cloudflare_documentation", {
  query: "Workers KV"
})
```

**Check argument types**:
```typescript
// ❌ Wrong type
await cloudflare.$call("search_cloudflare_documentation", {
  query: 123  // Should be string
})

// ✅ Correct type
await cloudflare.$call("search_cloudflare_documentation", {
  query: "Workers KV"  // String
})
```

---

### 7. "MCP not discovered"

#### Symptoms
```typescript
list_mcp_capabilities({ query: "Cloudflare Workers" })
→ Returns: { servers: [] }  // Empty, but Cloudflare MCP exists
```

#### Causes
- Query doesn't match domains/tags
- MCP visibility is opt_in/experimental
- Priority too low

#### Solutions

**Check MCP configuration**:
```bash
jq '.servers[] | select(.id=="cloudflare") | {domains, tags, visibility, priority}' \
  skills/mcp-dynamic-orchestrator/mcp.registry.json
```

**Adjust query to match domains**:
```typescript
// ❌ Doesn't match domains
list_mcp_capabilities({ query: "documentation" })

// ✅ Matches domains: ["cloudflare", "workers", ...]
list_mcp_capabilities({ query: "Cloudflare Workers" })
```

**Check visibility**:
```bash
# If visibility is "opt_in", must explicitly allow
jq '.servers[] | select(.id=="playwright") | .visibility' \
  mcp.registry.json
→ "opt_in"
```

For opt_in MCPs, use `execute_mcp_code` with explicit allow:
```typescript
execute_mcp_code({
  code: "...",
  allowedMcpIds: ["playwright"]  // Explicitly allow opt_in MCP
})
```

**Increase priority** (edit registry):
```json
{
  "id": "cloudflare",
  "priority": 10  // Higher = appears first
}
```

---

### 8. "Rate limit exceeded"

#### Symptoms
```
→ Error: Rate limit exceeded: max 50 calls/min for sensitivity=low
```

#### Cause
Too many MCP calls in short time (based on sensitivity level).

#### Solutions

**Wait and retry**:
```bash
# Rate limits reset after 1 minute
sleep 60
```

**Reduce call frequency**:
```typescript
// ❌ Bad - calls in tight loop
for (const query of queries) {
  await mcp.$call("search", { query });
}

// ✅ Good - batch queries
await mcp.$call("batch_search", { queries });
```

**Increase sensitivity** (if operations are expensive):

Edit registry:
```json
{
  "id": "my-mcp",
  "sensitivity": "medium"  // Reduces limit to 20/min but acceptable for expensive ops
}
```

**Implement caching**:
```typescript
const cache = new Map();

async function cachedCall(tool, args) {
  const key = JSON.stringify({ tool, args });
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await mcp.$call(tool, args);
  cache.set(key, result);
  return result;
}
```

---

### 9. "TypeError: Cannot read property"

#### Symptoms
```
TypeError: Cannot read property '$call' of undefined
→ at execute_mcp_code
```

#### Causes
- MCP client not initialized
- MCP ID not in allowedMcpIds
- Code generation failed

#### Solutions

**Check allowed MCP IDs**:
```typescript
execute_mcp_code({
  code: `
    import * as cloudflare from "mcp-clients/cloudflare";
    // ...
  `,
  allowedMcpIds: ["cloudflare"]  // ← Must include "cloudflare"
})
```

**Verify MCP exists in registry**:
```bash
jq '.servers[].id' mcp.registry.json | grep cloudflare
```

**Check for typos**:
```typescript
// ❌ Typo in import
import * as cf from "mcp-clients/cloudflair";  // Wrong

// ✅ Correct
import * as cf from "mcp-clients/cloudflare";
```

---

### 10. "Process exited with code 1"

#### Symptoms
```
Error: MCP server exited with code 1
```

#### Cause
MCP server crashed on startup.

#### Solutions

**Check MCP server logs**:
```bash
npx mcp-remote https://docs.mcp.cloudflare.com/sse 2>&1
```

Look for:
- Missing dependencies
- Invalid configuration
- Network errors
- Permission issues

**Common fixes**:

**Missing dependency**:
```bash
npm install -g <missing-package>
```

**Invalid node version**:
```bash
# Check required version
cat package.json | jq .engines

# Update node
nvm install 20
nvm use 20
```

**Permission issue**:
```bash
sudo chown -R $USER ~/.npm
```

**Environment variable missing**:
```json
{
  "mcp": {
    "env": {
      "REQUIRED_VAR": "value"  // Add missing env var
    }
  }
}
```

---

## Debugging Techniques

### 1. Enable Debug Logging

**Edit `src/orchestrator.ts`**:
```typescript
const DEBUG = true;  // Enable debug logs

function log(...args: any[]) {
  if (DEBUG) console.log('[orchestrator]', ...args);
}
```

**Output**:
```
[orchestrator] Loading registry...
[orchestrator] Found 16 MCPs
[orchestrator] Starting MCP client: cloudflare
[orchestrator] Sending request: {"jsonrpc":"2.0","id":1,"method":"initialize"}
[orchestrator] Received response: {"jsonrpc":"2.0","id":1,"result":{...}}
```

---

### 2. Test MCP in Isolation

**Create test script** (`test-mcp.js`):
```javascript
import { spawn } from 'node:child_process';

const mcp = spawn('npx', ['mcp-remote', 'https://docs.mcp.cloudflare.com/sse']);

mcp.stdout.on('data', (chunk) => {
  console.log('STDOUT:', chunk.toString());
});

mcp.stderr.on('data', (chunk) => {
  console.error('STDERR:', chunk.toString());
});

// Send initialize
mcp.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {}
}) + '\n');

// Send tools/list
setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  }) + '\n');
}, 1000);
```

**Run**:
```bash
node test-mcp.js
```

---

### 3. Validate Registry Schema

**Create validator** (`validate-registry.js`):
```javascript
import Ajv from 'ajv';
import fs from 'node:fs';

const schema = {
  type: 'object',
  properties: {
    servers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'summary', 'mcp', 'domains', 'tags', 'examples', 'sensitivity', 'visibility', 'priority', 'autoDiscoverTools'],
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9-]+$' },
          title: { type: 'string' },
          summary: { type: 'string' },
          mcp: { type: 'object' },
          domains: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          examples: { type: 'array', items: { type: 'string' } },
          sensitivity: { enum: ['low', 'medium', 'high'] },
          visibility: { enum: ['default', 'opt_in', 'experimental'] },
          priority: { type: 'number', minimum: 1, maximum: 10 },
          autoDiscoverTools: { type: 'boolean' }
        }
      }
    }
  },
  required: ['servers']
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

const registry = JSON.parse(fs.readFileSync('mcp.registry.json', 'utf-8'));

if (validate(registry)) {
  console.log('✅ Registry is valid');
} else {
  console.error('❌ Registry is invalid:', validate.errors);
}
```

**Run**:
```bash
node validate-registry.js
```

---

### 4. Monitor MCP Calls

**Add call logging**:
```typescript
// In src/orchestrator.ts, add to callMcpTool():
console.log(`[${new Date().toISOString()}] Calling ${mcpId}.${toolName}(${JSON.stringify(args)})`);

const result = await client.call(toolName, args);

console.log(`[${new Date().toISOString()}] Result: ${JSON.stringify(result).slice(0, 100)}...`);
```

**Output**:
```
[2025-11-11T10:30:45.123Z] Calling cloudflare.search_cloudflare_documentation({"query":"Workers KV"})
[2025-11-11T10:30:46.456Z] Result: {"content":[{"type":"text","text":"# Workers KV\n\nWorkers KV is a globa...
```

---

## Performance Issues

### Slow Discovery

**Symptoms**: `list_mcp_capabilities` takes >5 seconds

**Causes**:
- Too many MCPs in registry (>50)
- Complex search scoring

**Solutions**:

**Reduce registry size**:
```json
{
  "servers": [
    // Keep only frequently used MCPs
    // Move rarely-used to separate registry file
  ]
}
```

**Implement caching**:
```typescript
// In src/orchestrator.ts
const registryCache = {
  data: null,
  timestamp: 0,
  ttl: 60000  // 1 minute
};

function loadRegistry() {
  const now = Date.now();
  if (registryCache.data && (now - registryCache.timestamp) < registryCache.ttl) {
    return registryCache.data;
  }

  const data = JSON.parse(fs.readFileSync('mcp.registry.json'));
  registryCache.data = data;
  registryCache.timestamp = now;
  return data;
}
```

---

### Slow Tool Calls

**Symptoms**: MCP tool calls take >10 seconds

**Causes**:
- MCP server is slow
- Network latency (HTTP transport)
- Large response payloads

**Solutions**:

**Switch to local MCP**:
```json
{
  "mcp": {
    "transport": "stdio",  // Faster than HTTP
    "command": "npx",
    "args": ["local-mcp-server"]
  }
}
```

**Implement response caching**:
```typescript
const responseCache = new Map();

async function cachedMcpCall(mcpId, tool, args) {
  const key = `${mcpId}:${tool}:${JSON.stringify(args)}`;

  if (responseCache.has(key)) {
    return responseCache.get(key);
  }

  const result = await mcp.call(tool, args);
  responseCache.set(key, result);

  // Expire after 5 minutes
  setTimeout(() => responseCache.delete(key), 300000);

  return result;
}
```

**Paginate large results**:
```typescript
// ❌ Request all results
await mcp.$call("search", { query: "...", limit: 1000 });  // Slow

// ✅ Request in pages
await mcp.$call("search", { query: "...", limit: 10, offset: 0 });  // Fast
```

---

## Getting Help

### 1. Search Existing Issues

https://github.com/secondsky/claude-skills/issues?q=mcp-dynamic-orchestrator

### 2. Create New Issue

**Template**:
```markdown
## Issue

[Brief description]

## Steps to Reproduce

1. Install skill: `./scripts/install-skill.sh mcp-dynamic-orchestrator`
2. Run: `list_mcp_capabilities({ query: "..." })`
3. See error: `...`

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happened]

## Environment

- OS: macOS 14.0
- Node: v20.10.0
- Claude Code: v1.0.0
- Skill version: v1.0.0

## Logs

[Paste relevant logs]

## Registry Configuration

[Paste relevant part of mcp.registry.json]
```

### 3. Join Discord

[Link to Discord server] (if available)

### 4. Email Support

security@example.com (for security issues only)

---

## FAQ

**Q: Can I use multiple registries?**
A: Not yet. Planned for v1.2.

**Q: Can I add MCPs at runtime?**
A: Not yet. Requires restart currently. Planned for v1.2.

**Q: Is the sandbox secure?**
A: No, current implementation (vm.createContext) is NOT secure. See [security-model.md](./security-model.md).

**Q: Can I use TypeScript in execute_mcp_code?**
A: Not yet. Only JavaScript currently supported. TypeScript compilation planned for v1.1.

**Q: How do I update an MCP server?**
A: Clear npx cache: `npx clear-npx-cache`, then re-run.

**Q: Can I run MCPs in parallel?**
A: Yes, use `Promise.all()`:
```typescript
const [result1, result2] = await Promise.all([
  mcp1.$call("tool1", {}),
  mcp2.$call("tool2", {})
]);
```

**Q: How do I see MCP server logs?**
A: Check stderr: `process.stderr` in stdio transport.

**Q: Can I use local MCP servers?**
A: Yes, use absolute path:
```json
{
  "mcp": {
    "command": "/path/to/my-mcp-server"
  }
}
```

---

**Last Updated**: 2025-11-11
**Maintainer**: Claude Skills Maintainers
**Feedback**: https://github.com/secondsky/claude-skills/issues
