# MCP Dynamic Orchestrator

**Status**: Beta - Core features working, sandbox needs improvement
**Last Updated**: 2025-11-11
**License**: MIT

## Auto-Trigger Keywords

This skill automatically activates when conversations mention:

**Core Concepts**:
- MCP orchestration, MCP registry, MCP management
- Dynamic MCP discovery, MCP code-mode execution
- Progressive tool loading, tool discovery, MCP-as-code

**Registry & Configuration**:
- mcp.registry.json, MCP server configuration
- Registry-based MCP management

**Use Cases**:
- Multiple MCP servers, MCP integration
- Context optimization, token efficiency
- Tool bloat prevention, progressive disclosure

**Technical Terms**:
- JSON-RPC MCP client, stdio transport, HTTP transport
- MCP tool metadata, schema discovery
- Virtual modules, code generation

**Related Technologies**:
- Cloudflare MCP, Nuxt MCP, shadcn MCP
- Playwright MCP, Chrome DevTools MCP
- Context7 MCP, Better Auth MCP

---

## What This Skill Does

The **MCP Dynamic Orchestrator** implements a **progressive disclosure pattern** for managing multiple MCP (Model Context Protocol) servers. Instead of loading 100+ tool definitions directly into Claude's context (potentially 50k+ tokens), it provides:

1. **Registry-Based Discovery**: A central `mcp.registry.json` file defines all available MCPs with metadata
2. **Smart Tool Loading**: Only loads tool schemas when needed, keeping metadata in context
3. **Code-Mode Execution**: Generates type-safe client code for calling MCP tools
4. **Safety Controls**: Visibility levels, sensitivity ratings, and execution policies

**Currently configured with 16 MCP servers**: Cloudflare, Nuxt, shadcn, Playwright, Better Auth, Context7, Lucide Icons, Motion, and more.

### The Problem It Solves

**Without this skill**:
- Loading 16 MCPs with ~6 tools each = 96 tool definitions in context
- Each tool definition: ~500 tokens
- **Total: ~48,000 tokens** just for tool metadata
- Context bloat makes conversations expensive and slow

**With this skill**:
- Metadata for 16 MCPs: ~5,000 tokens
- Tool schemas loaded on-demand only when needed
- **Token savings: ~90%** for typical multi-MCP workflows

---

## Quick Start

### 1. Installation

```bash
# Install the skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh mcp-dynamic-orchestrator

# Verify installation
ls -la ~/.claude/skills/mcp-dynamic-orchestrator
```

### 2. Basic Usage Example

**Scenario**: Find and use Cloudflare documentation via MCP

```typescript
// Step 1: Discover available MCPs
"What MCPs are available for Cloudflare?"
// Claude calls: list_mcp_capabilities({ query: "Cloudflare" })
// Returns: [{ id: "cloudflare", title: "Cloudflare platform MCP", ... }]

// Step 2: Inspect capabilities
"What can the Cloudflare MCP do?"
// Claude calls: describe_mcp({ id: "cloudflare" })
// Returns: Tool list with search_docs, get_migration_guide, etc.

// Step 3: Execute code to call MCP
"Search Cloudflare docs for Workers KV examples"
// Claude calls: execute_mcp_code({
//   code: `
//     import * as cloudflare from "mcp-clients/cloudflare";
//     async function main() {
//       const result = await cloudflare.$call("search_cloudflare_documentation", {
//         query: "Workers KV examples"
//       });
//       console.log(result);
//     }
//   `,
//   allowedMcpIds: ["cloudflare"]
// })
```

### 3. How It Works

```
┌─────────────────────────────────────────────────────────┐
│ 1. Discovery Phase                                       │
│    list_mcp_capabilities({ query: "Cloudflare" })       │
│    → Returns: MCP metadata (~100 words per MCP)         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Inspection Phase                                      │
│    describe_mcp({ id: "cloudflare" })                   │
│    → Returns: Tool names + descriptions (not schemas)   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Execution Phase                                       │
│    execute_mcp_code({ code: "...", allowedMcpIds: [...] })│
│    → Generates virtual modules: mcp-clients/cloudflare/  │
│    → Runs code in sandbox (currently requires env flag) │
└─────────────────────────────────────────────────────────┘
```

---

## Known Limitations

### 🔴 CRITICAL: Sandbox Security

**Status**: ⚠️ **NOT SECURE FOR UNTRUSTED CODE**

The current sandbox implementation uses Node.js `vm.createContext()`, which is **explicitly not a security boundary** according to Node.js documentation.

**Known Escape Vectors**:
- Prototype pollution attacks
- `require()` manipulation
- Constructor access to global scope
- Promise/async manipulation

**Current Mitigation**:
- Code execution is **disabled by default**
- Requires `MCP_ORCH_ENABLE_SANDBOX=1` environment variable
- `allowedMcpIds` parameter restricts which MCPs can be called

**Recommendation**:
- ✅ **Safe for Claude-generated code** (trusted source)
- ❌ **NOT safe for user-provided code** (untrusted source)
- 🔮 **Future**: Will be replaced with isolated Worker threads (v1.1)

### Other Limitations

1. **No TypeScript Compilation**
   - User code written in `.ts` will fail on syntax
   - Only plain JavaScript currently supported
   - Workaround: Use JavaScript syntax only

2. **No Module Resolution**
   - Imports from `mcp-clients/*` won't resolve
   - Virtual modules generated but not wired to runtime
   - Workaround: Use `$call(toolName, args)` API instead

3. **Static Registry**
   - `mcp.registry.json` is read-only during runtime
   - Adding/removing MCPs requires restart
   - No API for dynamic configuration yet

4. **Limited Error Handling**
   - MCP connection failures return generic errors
   - No retry logic for transient failures
   - Timeout handling is basic (5-10 seconds)

---

## Production Status

### What's Working ✅

- **Discovery**: `list_mcp_capabilities` fully functional
- **Inspection**: `describe_mcp` works for all 16 configured MCPs
- **Registry**: JSON schema with visibility, sensitivity, priority
- **Safety Controls**: Policies enforce timeouts and rate limits
- **MCP Clients**: Both stdio and HTTP transports working
- **Code Generation**: Virtual module creation works

### What's In Progress 🟡

- **Sandbox**: Contract-only implementation (Phase 4)
- **Testing**: Only basic smoke tests (Phase 6)
- **Documentation**: Adding references/ (this PR)

### What's Planned 🔮

- **Secure Sandbox**: Isolated Worker threads (v1.1)
- **TypeScript Support**: Compilation via esbuild (v1.1)
- **Module Resolution**: Custom require hook (v1.1)
- **Dynamic Registry**: Runtime add/remove MCPs (v1.2)
- **Metrics**: Call tracking and latency monitoring (v1.2)

---

## Configuration

### Adding a New MCP

Edit `skills/mcp-dynamic-orchestrator/mcp.registry.json`:

```json
{
  "servers": [
    {
      "id": "your-mcp-id",
      "title": "Your MCP Title",
      "summary": "Short description of what this MCP does.",
      "mcp": {
        "transport": "stdio",
        "command": "npx",
        "args": ["your-mcp-package"]
      },
      "domains": ["domain1", "domain2"],
      "tags": ["tag1", "tag2"],
      "examples": [
        "Example use case 1",
        "Example use case 2"
      ],
      "sensitivity": "low",      // low | medium | high
      "visibility": "default",    // default | opt_in | experimental
      "priority": 7,              // 1-10 (10 = highest priority)
      "autoDiscoverTools": true
    }
  ]
}
```

### Registry Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (kebab-case) |
| `title` | string | ✅ | Human-readable name |
| `summary` | string | ✅ | One-sentence description |
| `mcp.transport` | "stdio" \| "http" | ✅ | Connection method |
| `mcp.command` | string | ✅ | Executable command |
| `mcp.args` | string[] | ✅ | Command arguments |
| `mcp.env` | object | ❌ | Environment variables |
| `domains` | string[] | ✅ | Subject areas (for search) |
| `tags` | string[] | ✅ | Keywords (for search) |
| `examples` | string[] | ✅ | Use case descriptions |
| `sensitivity` | string | ✅ | low/medium/high (affects timeouts) |
| `visibility` | string | ✅ | default/opt_in/experimental |
| `priority` | number | ✅ | 1-10 ranking |
| `autoDiscoverTools` | boolean | ✅ | Load tools automatically |

**See**: `references/registry-schema.md` for complete documentation

---

## Safety & Security

### Visibility Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| `default` | Always available | Stable, well-tested MCPs (Cloudflare, Nuxt) |
| `opt_in` | Requires explicit allow | Experimental or high-resource MCPs (Playwright) |
| `experimental` | Hidden by default | Unstable or testing-only MCPs |

### Sensitivity Ratings

| Rating | Timeout | Max Calls | Example |
|--------|---------|-----------|---------|
| `low` | 10s | 50 | Documentation MCPs (Cloudflare, Nuxt) |
| `medium` | 7.5s | 20 | Browser automation (Playwright, Chrome DevTools) |
| `high` | 5s | 10 | Security-sensitive operations |

### Execution Policies

`execute_mcp_code` enforces:
- ✅ Only MCPs in `allowedMcpIds` can be called
- ✅ Timeouts prevent runaway processes
- ✅ Rate limits prevent abuse
- ✅ Visibility filtering (opt_in requires explicit allow)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Claude Code                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Skill: mcp-dynamic-orchestrator                     │  │
│ │ ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│ │ │ list_mcp_  │  │ describe_  │  │ execute_   │    │  │
│ │ │ capabilities│  │ mcp        │  │ mcp_code   │    │  │
│ │ └────────────┘  └────────────┘  └────────────┘    │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ Orchestrator (src/orchestrator.ts)                       │
│ ┌────────────────┐  ┌─────────────────────────────┐    │
│ │ Registry       │  │ MCP Client Layer             │    │
│ │ (mcp.registry  │→│ - Stdio client (spawn)       │    │
│ │  .json)        │  │ - HTTP client (fetch)        │    │
│ │ 16 MCPs        │  │ - Request/response handling  │    │
│ └────────────────┘  └─────────────────────────────┘    │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Code Generator                                      │  │
│ │ - Creates virtual modules: mcp-clients/{id}/       │  │
│ │ - Type-safe $call(toolName, args) API             │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Sandbox (src/sandbox.ts)                           │  │
│ │ ⚠️  vm.createContext() - NOT SECURE                │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ MCP Servers (external processes)                         │
│ - Cloudflare (npx mcp-remote https://docs.mcp....)      │
│ - Nuxt (npx mcp-remote https://mcp.nuxt.com/sse)        │
│ - shadcn (npx shadcn@canary registry:mcp)               │
│ - Playwright (npx @playwright/mcp@latest)               │
│ - ... 12 more configured MCPs                            │
└──────────────────────────────────────────────────────────┘
```

---

## Related Skills

| Skill | Relationship | Use Together |
|-------|--------------|--------------|
| **typescript-mcp** | Build single MCP servers | Create new MCPs, then orchestrate with this skill |
| **fastmcp** | Python MCP framework | Build Python MCPs, add to registry |
| **cloudflare-mcp-server** | Deploy MCPs to Workers | Deploy custom MCPs, configure in registry |
| **project-planning** | Task management | Use for multi-MCP workflows planning |

---

## Troubleshooting

### Common Issues

**"No MCP servers configured"**
- **Cause**: `mcp.registry.json` is empty or missing
- **Solution**: Add MCP entries to the registry file

**"MCP connection timeout"**
- **Cause**: MCP server not responding within timeout
- **Solution**: Check MCP server is installed (`npx <package>`)
- **Solution**: Increase timeout in registry (edit `sensitivity` field)

**"execute_mcp_code not enabled"**
- **Cause**: Sandbox is disabled by default
- **Solution**: Set `MCP_ORCH_ENABLE_SANDBOX=1` environment variable
- **Warning**: Only enable for trusted code

**"Module import failed"**
- **Cause**: Module resolution not implemented
- **Solution**: Use `$call(toolName, args)` API instead of direct function calls

**See**: `references/troubleshooting.md` for detailed solutions

---

## Examples

### Example 1: Search Cloudflare Documentation

```typescript
// Discover
await list_mcp_capabilities({ query: "Cloudflare Workers" });
// → Returns: { id: "cloudflare", ... }

// Describe
await describe_mcp({ id: "cloudflare" });
// → Returns: [{ tool: "search_cloudflare_documentation", ... }]

// Execute
await execute_mcp_code({
  code: `
    import * as cf from "mcp-clients/cloudflare";
    const docs = await cf.$call("search_cloudflare_documentation", {
      query: "Workers KV API"
    });
    console.log(docs);
  `,
  allowedMcpIds: ["cloudflare"]
});
```

### Example 2: Multi-MCP Workflow

```typescript
// Combine Nuxt + shadcn MCPs
await execute_mcp_code({
  code: `
    import * as nuxt from "mcp-clients/nuxt";
    import * as shadcn from "mcp-clients/shadcn";

    // Get Nuxt modules
    const modules = await nuxt.$call("list_nuxt_modules");

    // Get shadcn components
    const components = await shadcn.$call("search_components", {
      query: "button"
    });

    console.log({ modules, components });
  `,
  allowedMcpIds: ["nuxt", "shadcn"]
});
```

---

## Contributing

This skill follows the [Claude Skills Standards](https://github.com/secondsky/claude-skills/blob/main/planning/claude-code-skill-standards.md).

**To improve this skill**:
1. Check [plan.md](../../plan.md) for open tasks
2. Read [QUICK_WORKFLOW.md](../../QUICK_WORKFLOW.md) for development process
3. Test changes with `./scripts/install-skill.sh mcp-dynamic-orchestrator`
4. Verify against [ONE_PAGE_CHECKLIST.md](../../ONE_PAGE_CHECKLIST.md)

---

## Resources

- **SKILL.md**: Complete skill instructions (for Claude)
- **references/registry-schema.md**: Registry format specification
- **references/security-model.md**: Security architecture and limitations
- **references/mcp-protocol.md**: JSON-RPC MCP protocol basics
- **references/troubleshooting.md**: Detailed problem solving

---

## License

MIT © Claude Skills Maintainers

---

**Last Verified**: 2025-11-11
**Next Review**: 2025-12-11 (Monthly)
**Maintainer**: Claude Skills Maintainers
**Repository**: https://github.com/secondsky/claude-skills
