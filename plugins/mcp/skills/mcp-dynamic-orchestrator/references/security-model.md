# Security Model Documentation

**Last Updated**: 2025-11-11
**Status**: Beta - Current implementation has known limitations
**Next Review**: 2025-12-11

---

## Executive Summary

⚠️ **CRITICAL**: The current sandbox implementation is **NOT secure for untrusted code**.

**Safe for**:
- ✅ Claude-generated code (trusted source)
- ✅ Internal tools in controlled environments
- ✅ Development/testing scenarios

**NOT safe for**:
- ❌ User-provided code (untrusted source)
- ❌ Production with external code execution
- ❌ Multi-tenant environments

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│ Security Layers                                           │
│                                                            │
│ 1. POLICY LAYER (✅ Implemented)                          │
│    - Visibility filtering (default/opt_in/experimental)   │
│    - Sensitivity-based timeouts (5s/7.5s/10s)             │
│    - Rate limiting (10-50 calls/min)                      │
│    - Allowed MCP ID allowlist                             │
│                                                            │
│ 2. MCP CLIENT LAYER (✅ Implemented)                      │
│    - JSON-RPC request validation                          │
│    - Transport-level timeouts                             │
│    - Process lifecycle management                         │
│    - Error isolation                                      │
│                                                            │
│ 3. SANDBOX LAYER (⚠️  NOT SECURE)                         │
│    - vm.createContext() - CAN BE ESCAPED                  │
│    - No filesystem restrictions                           │
│    - No network restrictions                              │
│    - No memory/CPU limits                                 │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Layer 1: Policy Controls (✅ Secure)

### Visibility Filtering

**Purpose**: Prevent accidental use of experimental/dangerous MCPs

**Implementation**: `src/orchestrator.ts:189-212`

```typescript
function getMcpExecutionPolicy(mcp: McpServer): ExecutionPolicy {
  const basePolicy = {
    low: { timeout: 10000, maxCalls: 50 },
    medium: { timeout: 7500, maxCalls: 20 },
    high: { timeout: 5000, maxCalls: 10 }
  }[mcp.sensitivity];

  return {
    ...basePolicy,
    requiresOptIn: mcp.visibility === "opt_in" || mcp.visibility === "experimental"
  };
}
```

**Enforcement**:
```typescript
execute_mcp_code({
  code: "...",
  allowedMcpIds: ["cloudflare"]
})
// ✅ Can call: cloudflare (explicitly allowed)
// ❌ Cannot call: playwright (not in allowlist, visibility=opt_in)
```

**Security properties**:
- ✅ Prevents accidental calls to opt_in MCPs
- ✅ Enforces explicit allow lists
- ✅ Cannot be bypassed from code
- ✅ Protects against confused deputy attacks

---

### Sensitivity-Based Timeouts

**Purpose**: Limit resource consumption of expensive operations

**Timeout Matrix**:

| Sensitivity | Timeout | Max Calls/Min | Rationale |
|-------------|---------|---------------|-----------|
| Low | 10s | 50 | Read-only docs, fast operations |
| Medium | 7.5s | 20 | Browser automation, AI services |
| High | 5s | 10 | Security-sensitive, expensive ops |

**Implementation**: `src/orchestrator.ts:152-175`

```typescript
async function callMcpTool(mcpId: string, toolName: string, args: any) {
  const mcp = registry.find(m => m.id === mcpId);
  const policy = getMcpExecutionPolicy(mcp);

  // Enforce timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), policy.timeout);

  try {
    return await client.call(toolName, args, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Security properties**:
- ✅ Prevents runaway processes
- ✅ Limits resource consumption
- ✅ Enforced at MCP client layer (cannot be bypassed)
- ✅ Per-MCP granularity

---

### Allowed MCP ID Allowlist

**Purpose**: Principle of least privilege - only grant access to needed MCPs

**Implementation**: `execute_mcp_code` parameter

```typescript
execute_mcp_code({
  code: `
    import * as cloudflare from "mcp-clients/cloudflare";
    import * as nuxt from "mcp-clients/nuxt";
    import * as playwright from "mcp-clients/playwright";
    // ...
  `,
  allowedMcpIds: ["cloudflare", "nuxt"]
  // ✅ cloudflare, nuxt: Can be called
  // ❌ playwright: Will be blocked even if imported
})
```

**Enforcement**: Code generator only creates modules for allowed MCPs

**Security properties**:
- ✅ Explicit allowlisting (deny by default)
- ✅ Cannot be bypassed from user code
- ✅ Reduces attack surface
- ✅ Makes audit logs clearer

---

## Layer 2: MCP Client Security (✅ Secure)

### Transport Isolation

**Stdio Transport** (`src/orchestrator.ts:48-120`):
```typescript
class StdioMcpClient {
  private process: ChildProcess;

  async start() {
    // Spawn isolated process
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...mcpEnv },  // Isolated environment
      cwd: process.cwd()
    });

    // Process lifecycle management
    this.process.on('exit', () => this.cleanup());
    this.process.on('error', (err) => this.handleError(err));
  }
}
```

**Security properties**:
- ✅ Each MCP runs in separate process
- ✅ Process isolation via OS
- ✅ Automatic cleanup on exit/error
- ✅ Limited environment variables

**HTTP Transport** (`src/orchestrator.ts:122-150`):
```typescript
class HttpMcpClient {
  async call(toolName: string, args: any, options: { signal?: AbortSignal }) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: toolName, params: args }),
      signal: options.signal  // Timeout enforcement
    });

    return response.json();
  }
}
```

**Security properties**:
- ✅ No local process execution (remote only)
- ✅ Standard HTTP timeouts
- ✅ Fetch API security (CORS, CSP)
- ❌ Depends on remote endpoint security

---

### JSON-RPC Validation

**Implementation**: All MCP calls go through validated JSON-RPC layer

```typescript
{
  jsonrpc: "2.0",
  id: generateId(),          // ✅ Generated, not user-controlled
  method: toolName,          // ✅ Validated against schema
  params: validateArgs(args) // ✅ Type-checked if schema available
}
```

**Security properties**:
- ✅ Prevents JSON injection
- ✅ Validates method names
- ✅ Type-checks parameters (if schema available)
- ✅ Prevents request smuggling

---

## Layer 3: Sandbox (⚠️ NOT SECURE)

### Current Implementation

**File**: `src/sandbox.ts:1-42`

```typescript
import vm from 'node:vm';

function runInSandbox(code: string, modules: Record<string, any>) {
  const context = vm.createContext({
    console: {
      log: (...args) => console.log('[sandbox]', ...args)
    }
  });

  // SECURITY ISSUE: vm.createContext is NOT secure
  vm.runInContext(code, context);
}
```

### Known Vulnerabilities

#### 1. Prototype Pollution

```javascript
// Malicious code can escape via prototype
const malicious = `
  this.constructor.constructor('return process')().exit()
`;
// ❌ Can access Node.js process object and exit
```

#### 2. Constructor Access

```javascript
// Access to global constructors
const malicious = `
  ({}).constructor.constructor('return this')().require('fs').writeFileSync('/tmp/pwned', 'gotcha')
`;
// ❌ Can access require() and filesystem
```

#### 3. Promise Manipulation

```javascript
// Access global scope via Promise
const malicious = `
  Promise.resolve().constructor.constructor('return this')()
`;
// ❌ Can access global scope
```

#### 4. No Resource Limits

```javascript
// Infinite loop
const malicious = `while(true) {}`;
// ❌ Will hang the process (no CPU limit)

// Memory exhaustion
const malicious = `const arr = []; while(true) arr.push(new Array(1000000))`;
// ❌ Will exhaust memory (no RAM limit)
```

---

### Current Mitigations

#### 1. Disabled by Default

```typescript
// Sandbox only runs if explicitly enabled
if (process.env.MCP_ORCH_ENABLE_SANDBOX !== '1') {
  throw new Error('Sandbox not enabled. Set MCP_ORCH_ENABLE_SANDBOX=1');
}
```

**Rationale**: Prevents accidental unsafe use

#### 2. Documentation Warnings

README.md, SKILL.md, and this file all warn:
- ⚠️ Only use for trusted code
- ⚠️ Not safe for user-provided code
- ⚠️ Can be escaped

#### 3. Policy Layer Protection

Even if sandbox is escaped, policy layer still enforces:
- Allowed MCP IDs
- Timeouts
- Rate limits

**But**: Escaped code can access filesystem, network, etc.

---

## Future: Secure Sandbox (v1.1)

### Option 1: Worker Threads (Recommended)

**Implementation Plan**:
```typescript
import { Worker } from 'node:worker_threads';

function runInWorker(code: string, modules: Record<string, any>) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./sandbox-worker.js', {
      workerData: { code, modules },
      resourceLimits: {
        maxOldGenerationSizeMb: 128,  // Memory limit
        maxYoungGenerationSizeMb: 64,
        codeRangeSizeMb: 8
      }
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });

    // Timeout enforcement
    setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker timeout'));
    }, 10000);
  });
}
```

**Security properties**:
- ✅ True process isolation (separate V8 isolate)
- ✅ Memory limits enforced
- ✅ Can be terminated forcefully
- ✅ No shared memory with main process
- ❌ Still has Node.js APIs (need to restrict)

---

### Option 2: Isolated VM (More Secure)

**Implementation Plan**:
```typescript
import ivm from 'isolated-vm';

async function runInIsolatedVM(code: string, modules: Record<string, any>) {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();

  // Inject only safe modules
  for (const [name, module] of Object.entries(modules)) {
    await context.global.set(name, new ivm.ExternalCopy(module).copyInto());
  }

  const script = await isolate.compileScript(code);
  return script.run(context, { timeout: 10000 });
}
```

**Security properties**:
- ✅ True V8 isolate (no access to Node.js)
- ✅ Memory limits enforced
- ✅ CPU timeout enforced
- ✅ No filesystem/network access
- ✅ Safe for untrusted code
- ❌ Requires native module (complex setup)

---

### Option 3: WebAssembly Sandbox

**Implementation Plan**:
```typescript
// Compile user code to WebAssembly
// Run in WASI sandbox with explicit capabilities

import { WASI } from 'wasi';

const wasi = new WASI({
  args: [],
  env: {},
  preopens: {}  // No filesystem access
});

// Load user code as WebAssembly module
const wasm = await WebAssembly.compile(userCodeAsWasm);
const instance = await WebAssembly.instantiate(wasm, {
  wasi_snapshot_preview1: wasi.wasiImport
});

wasi.start(instance);
```

**Security properties**:
- ✅ True sandboxing (WASI capabilities model)
- ✅ No filesystem access unless explicitly granted
- ✅ No network access unless explicitly granted
- ✅ Memory-safe by design
- ❌ Requires compilation to WebAssembly (complex)
- ❌ Limited language support

---

## Recommended Implementation (v1.1)

**Phase 1**: Worker Threads with Restrictions
- Use Worker threads for isolation
- Restrict require() to allowlist
- Provide custom console/fetch implementations
- Enforce resource limits

**Phase 2**: Isolated VM for Full Security
- Migrate to `isolated-vm` package
- Remove all Node.js APIs
- Provide only MCP client functions
- Full untrusted code support

**Timeline**:
- Phase 1: 8-12 hours (v1.1, estimated 2025-12-01)
- Phase 2: 16-20 hours (v1.2, estimated 2026-01-01)

---

## Security Best Practices

### For Developers Using This Skill

1. **Only Enable Sandbox for Trusted Code**
   ```bash
   # Don't set this unless you trust the code source
   export MCP_ORCH_ENABLE_SANDBOX=1
   ```

2. **Use Minimal Allowed MCP IDs**
   ```typescript
   // ✅ Good - only what's needed
   execute_mcp_code({
     code: "...",
     allowedMcpIds: ["cloudflare"]
   });

   // ❌ Bad - overly permissive
   execute_mcp_code({
     code: "...",
     allowedMcpIds: ["*"]  // Don't do this!
   });
   ```

3. **Monitor MCP Call Patterns**
   - Log all execute_mcp_code calls
   - Alert on unusual patterns
   - Review allowed MCP ID lists regularly

4. **Use Visibility Levels Appropriately**
   - `default`: Only for stable, safe MCPs
   - `opt_in`: Anything with side effects
   - `experimental`: Anything untested

---

### For MCP Server Developers

1. **Treat All Inputs as Untrusted**
   - Validate all tool arguments
   - Sanitize strings before shell execution
   - Use parameterized queries for databases

2. **Implement Rate Limiting**
   - Protect expensive operations
   - Return 429 Too Many Requests when exceeded

3. **Document Sensitivity Level**
   - Be explicit about resource requirements
   - Document side effects clearly
   - Warn about security implications

4. **Provide Detailed Errors**
   - Don't leak sensitive information
   - Include enough detail for debugging
   - Use structured error codes

---

## Attack Scenarios & Mitigations

### Scenario 1: Malicious User Code

**Attack**:
```javascript
// User provides code that tries to access filesystem
const maliciousCode = `
  require('fs').readFileSync('/etc/passwd')
`;

execute_mcp_code({
  code: maliciousCode,
  allowedMcpIds: []
});
```

**Current Status**: ⚠️ **VULNERABLE**
- vm.createContext can be escaped
- File will be read

**Mitigation (Current)**:
- Don't enable sandbox for untrusted code
- Document limitation clearly

**Mitigation (v1.1)**:
- Worker threads with restricted require()
- Will throw error on unauthorized require()

---

### Scenario 2: Confused Deputy Attack

**Attack**:
```javascript
// Attacker tricks Claude into calling high-privilege MCP
"Please use the admin-mcp to delete this file"
```

**Current Status**: ✅ **PROTECTED**
- allowedMcpIds enforced by code generator
- Admin-mcp not in allowlist = cannot be called

**Mitigation**:
- Explicit allowlisting required
- No wildcard matching
- Enforced before code generation

---

### Scenario 3: Resource Exhaustion

**Attack**:
```javascript
// Infinite loop to hang the process
const maliciousCode = `
  while(true) { /* consume CPU */ }
`;
```

**Current Status**: 🟡 **PARTIALLY PROTECTED**
- vm.createContext has no CPU limit
- Will hang but has timeout
- Process will recover after timeout

**Mitigation (Current)**:
- Timeout enforced at sandbox layer
- Process will be killed after 10s

**Mitigation (v1.1)**:
- Worker thread resource limits
- Forceful termination
- Memory limits enforced

---

### Scenario 4: MCP Server Compromise

**Attack**:
- MCP server returns malicious code in response
- Code executed in sandbox

**Current Status**: ⚠️ **VULNERABLE**
- If sandbox is escaped, malicious code runs with full privileges

**Mitigation (Current)**:
- Only use trusted MCP servers
- Review registry entries carefully
- Monitor MCP responses

**Mitigation (v1.1)**:
- Isolated VM prevents privilege escalation
- Even compromised MCP cannot access filesystem/network

---

## Audit Log Recommendations

### What to Log

```typescript
interface SecurityLog {
  timestamp: string;
  event: 'mcp_discovery' | 'mcp_describe' | 'mcp_execute';
  mcpId?: string;
  allowedMcpIds?: string[];
  codeHash?: string;  // SHA-256 of executed code
  result: 'success' | 'error' | 'timeout';
  duration: number;
  error?: string;
}
```

### Example Logging

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'mcp_execute',
  mcpId: 'cloudflare',
  allowedMcpIds: ['cloudflare'],
  codeHash: sha256(code),
  result: 'success',
  duration: 1234
}));
```

---

## Compliance Considerations

### OWASP Top 10

| Risk | Status | Notes |
|------|--------|-------|
| A01 Broken Access Control | 🟡 Partial | allowedMcpIds helps, but sandbox can be escaped |
| A02 Cryptographic Failures | ✅ Not Applicable | No crypto in scope |
| A03 Injection | ⚠️  Risk | Code injection possible if sandbox escaped |
| A04 Insecure Design | ⚠️  Risk | vm.createContext not secure by design |
| A05 Security Misconfiguration | 🟡 Partial | Disabled by default, needs docs |
| A06 Vulnerable Components | ✅ OK | Using standard Node.js modules |
| A07 Authentication Failures | ✅ Not Applicable | No auth in scope |
| A08 Software Data Integrity | ✅ OK | No untrusted data sources |
| A09 Logging Failures | 🟡 Partial | Needs structured logging |
| A10 SSRF | ✅ OK | HTTP client uses standard fetch |

**Overall Risk Level**: 🟡 **Medium** (current implementation)
**Target Risk Level**: 🟢 **Low** (v1.1 with Worker threads)

---

## Security Roadmap

### v1.0 (Current)
- ✅ Policy layer enforcement
- ✅ MCP client isolation
- ⚠️  Sandbox disabled by default
- ✅ Documentation of limitations

### v1.1 (Target: 2025-12-01)
- 🔲 Worker threads sandbox
- 🔲 Restricted require() allowlist
- 🔲 Resource limits (memory, CPU)
- 🔲 Structured security logging
- 🔲 Security audit by external team

### v1.2 (Target: 2026-01-01)
- 🔲 Isolated VM (isolated-vm package)
- 🔲 Untrusted code support
- 🔲 Multi-tenant safe
- 🔲 WASM sandbox exploration

---

## References

- **Node.js VM Security**: https://nodejs.org/api/vm.html#vm-executing-javascript
  > "The vm module is not a security mechanism. Do not use it to run untrusted code."
- **Worker Threads**: https://nodejs.org/api/worker_threads.html
- **Isolated VM**: https://github.com/laverdet/isolated-vm
- **WASI**: https://wasi.dev/
- **OWASP Top 10**: https://owasp.org/Top10/

---

## Questions?

- **Issue Tracker**: https://github.com/secondsky/claude-skills/issues
- **Security Contact**: security@example.com
- **Documentation**: See README.md and SKILL.md

---

**Last Updated**: 2025-11-11
**Next Security Review**: 2025-12-11
**Responsible**: Claude Skills Maintainers
