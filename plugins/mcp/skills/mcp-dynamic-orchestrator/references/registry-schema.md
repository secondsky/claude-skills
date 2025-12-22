# MCP Registry Schema Documentation

**File**: `mcp.registry.json`
**Location**: `skills/mcp-dynamic-orchestrator/mcp.registry.json`
**Format**: JSON
**Last Updated**: 2025-11-11

---

## Overview

The MCP registry is a **single source of truth** for all available MCP (Model Context Protocol) servers. It defines:
- How to connect to each MCP (transport, command, args)
- What domains/topics each MCP covers
- Safety controls (visibility, sensitivity, priority)
- Discovery metadata (tags, examples)

**Design Goal**: Make MCP management **declarative** - add an entry to the registry, and it's immediately discoverable without code changes.

---

## Complete Schema

```typescript
interface McpRegistry {
  servers: McpServer[];
}

interface McpServer {
  // Identity
  id: string;                    // REQUIRED: Unique kebab-case identifier
  title: string;                 // REQUIRED: Human-readable name
  summary: string;               // REQUIRED: One-sentence description

  // Connection
  mcp: McpTransport;             // REQUIRED: How to connect

  // Discovery
  domains: string[];             // REQUIRED: Subject areas (for search scoring)
  tags: string[];                // REQUIRED: Keywords (for search scoring)
  examples: string[];            // REQUIRED: Use case descriptions

  // Safety
  sensitivity: Sensitivity;      // REQUIRED: "low" | "medium" | "high"
  visibility: Visibility;        // REQUIRED: "default" | "opt_in" | "experimental"
  priority: number;              // REQUIRED: 1-10 (10 = highest priority)
  autoDiscoverTools: boolean;    // REQUIRED: Whether to load tools automatically
}

interface McpTransport {
  transport: "stdio" | "http";   // REQUIRED: Connection method
  command: string;               // REQUIRED (stdio): Executable command
  args: string[];                // REQUIRED (stdio): Command arguments
  url?: string;                  // REQUIRED (http): HTTP endpoint
  env?: Record<string, string>;  // OPTIONAL: Environment variables
  alwaysAllow?: string[];        // OPTIONAL: Tools that skip confirmation
}

type Sensitivity = "low" | "medium" | "high";
type Visibility = "default" | "opt_in" | "experimental";
```

---

## Field Descriptions

### Identity Fields

#### `id` (string, required)

**Format**: Kebab-case, lowercase, alphanumeric + hyphens only

**Purpose**: Unique identifier used in code (`mcp-clients/{id}/`)

**Examples**:
```json
"cloudflare"         // ✅ Good
"nuxt-ui"            // ✅ Good
"better-auth"        // ✅ Good
"CloudFlare"         // ❌ Bad - not lowercase
"nuxt_ui"            // ❌ Bad - no underscores
"better auth"        // ❌ Bad - no spaces
```

**Rules**:
- Must be unique across all MCPs in registry
- Must be valid as a filesystem directory name
- Must not contain `/`, `\`, `.`, or special characters
- Recommended: Match the MCP's npm package name (simplified)

---

#### `title` (string, required)

**Format**: Human-readable display name

**Purpose**: Shown in discovery results and documentation

**Examples**:
```json
"Cloudflare platform MCP"    // ✅ Good - descriptive
"Nuxt UI MCP"                // ✅ Good - brand name clear
"Time MCP"                   // ✅ Good - simple and clear
"MCP"                        // ❌ Bad - not descriptive
"The Official Cloudflare..."  // ❌ Bad - too verbose
```

**Rules**:
- Should include "MCP" suffix for clarity
- Keep under 50 characters
- Use proper capitalization for brand names

---

#### `summary` (string, required)

**Format**: One sentence (no period needed)

**Purpose**: Quick description for search results and tool selection

**Examples**:
```json
"Access Cloudflare's MCP endpoint for documentation and platform operations"
// ✅ Good - states what it does

"Interact with the official Nuxt MCP server for modules and documentation"
// ✅ Good - mentions key features

"Use SwiftLens for Swift and Xcode insights via MCP"
// ✅ Good - clear value proposition

"This is an MCP server that lets you do things with Cloudflare."
// ❌ Bad - vague, unhelpful

"Cloudflare"
// ❌ Bad - not a sentence
```

**Rules**:
- One sentence, concise (<200 characters)
- Start with a verb ("Access", "Interact with", "Use", "Provide")
- Mention the primary capability
- No period at the end

---

### Connection Fields (`mcp` object)

#### `transport` ("stdio" | "http", required)

**Purpose**: Defines how to communicate with the MCP server

**stdio**: Spawn a child process, communicate via stdin/stdout
```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-time"]
}
```

**http**: Make HTTP requests to a remote endpoint
```json
{
  "transport": "http",
  "url": "https://api.example.com/mcp"
}
```

**When to use stdio**:
- MCP is an npm package or local executable
- Low latency required (local process)
- Most common for development

**When to use http**:
- MCP is a remote service
- MCP is behind authentication/API gateway
- Deploying MCP separately from orchestrator

---

#### `command` (string, required for stdio)

**Purpose**: Executable command to spawn

**Common values**:
```json
"npx"      // Run npm package via npx
"uvx"      // Run Python package via uvx (UV's npx equivalent)
"node"     // Run local Node.js script
"python"   // Run local Python script
"/path/to/binary"  // Absolute path to executable
```

**Examples**:
```json
// npm package (recommended)
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-time"]
}

// Python package
{
  "command": "uvx",
  "args": ["mcp-server-time"]
}

// Local script
{
  "command": "node",
  "args": ["./scripts/my-mcp-server.js"]
}

// Pre-installed binary
{
  "command": "/usr/local/bin/my-mcp",
  "args": ["--mode", "server"]
}
```

**Rules**:
- Must be in PATH or absolute path
- Must be executable
- Use `npx` for npm packages (handles installation)
- Use `uvx` for Python packages (handles installation)

---

#### `args` (string[], required for stdio)

**Purpose**: Command-line arguments passed to the command

**Common patterns**:
```json
// Simple package run
["@modelcontextprotocol/server-time"]

// With npx flags
["-y", "@modelcontextprotocol/server-time"]
// -y = automatically confirm installation

// With canary/pre-release versions
["-y", "shadcn@canary", "registry:mcp"]

// With environment-specific args
["mcp-remote", "https://docs.mcp.cloudflare.com/sse"]

// Multiple flags
["--stdio", "--verbose", "--config", "./config.json"]
```

**Rules**:
- Order matters (flags before positional args)
- Use `-y` with `npx` to avoid interactive prompts
- Avoid shell-specific syntax (no pipes, redirects, etc.)

---

#### `url` (string, required for http)

**Purpose**: HTTP endpoint for MCP server

**Format**: Full URL with protocol

**Examples**:
```json
"https://api.example.com/mcp"             // ✅ Good
"https://mcp.cloudflare.com/sse"         // ✅ Good
"http://localhost:3000/mcp"              // ✅ Good (dev)
"api.example.com/mcp"                    // ❌ Bad - missing protocol
"https://api.example.com"                // ❌ Bad - missing path
```

**Rules**:
- Must include protocol (`https://` or `http://`)
- Must be a valid URL
- Should use HTTPS in production
- Can include port numbers for dev

---

#### `env` (object, optional)

**Purpose**: Environment variables passed to the MCP process

**Format**: Key-value pairs (all values must be strings)

**Examples**:
```json
{
  "env": {
    "REGISTRY_URL": "https://animate-ui.com/r/registry.json",
    "DEFAULT_MINIMUM_TOKENS": "500",
    "DEBUG": "true"
  }
}
```

**Common use cases**:
- API keys (avoid! Use secrets manager instead)
- Configuration URLs
- Feature flags
- Debug settings

**Security Warning**:
- ⚠️ **Do not** store sensitive API keys in the registry
- ⚠️ Use environment variables or secrets manager for credentials
- ⚠️ Registry file may be committed to version control

---

#### `alwaysAllow` (string[], optional)

**Purpose**: List of tool names that skip user confirmation

**Use case**: For read-only, safe operations that don't need approval

**Examples**:
```json
{
  "alwaysAllow": [
    "list_nuxt_modules",      // Safe: just lists modules
    "search_documentation",   // Safe: read-only search
    "get_current_time"        // Safe: no side effects
  ]
}
```

**Rules**:
- Only use for **read-only** operations
- Never use for operations that:
  - Modify data
  - Make external API calls with side effects
  - Execute code
  - Access sensitive information

---

### Discovery Fields

#### `domains` (string[], required)

**Purpose**: Subject areas this MCP covers (used for search scoring)

**Format**: Lowercase, single words or hyphenated phrases

**Examples**:
```json
// Cloudflare MCP
["cloudflare", "workers", "kv", "r2", "queues", "zero_trust", "networking", "security", "observability"]

// Nuxt MCP
["nuxt", "modules", "vue", "framework"]

// Time MCP
["time", "timezone", "datetime"]

// Better Auth MCP
["auth", "better-auth", "security", "authentication"]
```

**How it's used**:
When a user queries `list_mcp_capabilities({ query: "Cloudflare Workers" })`:
1. Orchestrator scores each MCP by matching query words to domains
2. "Cloudflare" matches `domains: ["cloudflare", ...]` → high score
3. "Workers" matches `domains: [..., "workers", ...]` → even higher score
4. MCPs sorted by score, highest first

**Rules**:
- Include the main technology/service name
- Include specific features/subdomains
- Use common search terms (what users would type)
- Avoid overly generic terms ("api", "tool", "service")
- 3-10 domains recommended

---

#### `tags` (string[], required)

**Purpose**: Keywords for search (finer-grained than domains)

**Format**: Lowercase, single words or hyphenated phrases

**Examples**:
```json
// Cloudflare MCP
["cloudflare", "platform", "infra", "docs", "workers", "mcp"]

// shadcn MCP
["shadcn", "ui", "components", "registry", "react"]

// Playwright MCP
["playwright", "testing", "browser", "automation"]
```

**Difference from domains**:
- **Domains**: Broad subject areas ("cloudflare", "workers")
- **Tags**: Specific keywords ("docs", "infra", "testing")

**Rules**:
- Include technology names
- Include use case terms ("testing", "docs", "ui")
- Include framework names if relevant ("react", "vue")
- 3-8 tags recommended

---

#### `examples` (string[], required)

**Purpose**: Natural language use cases (shown in search results)

**Format**: Complete sentences describing when to use this MCP

**Examples**:
```json
// Cloudflare MCP
[
  "Fetch Cloudflare Workers documentation for a specific API.",
  "Search Cloudflare platform docs for queues or KV usage patterns.",
  "Look up configuration guidance for Zero Trust or networking features."
]

// Nuxt MCP
[
  "List Nuxt modules and features.",
  "Fetch documentation for specific Nuxt modules."
]

// Time MCP
[
  "Query current time in specific timezones via MCP."
]
```

**How it's used**:
- Shown in `list_mcp_capabilities` results
- Helps users understand what the MCP can do
- Informs search relevance scoring

**Rules**:
- 1-5 examples (2-3 ideal)
- Start with action verbs ("Fetch", "Search", "Generate")
- Be specific (mention actual features/APIs)
- Complete sentences with periods

---

### Safety Fields

#### `sensitivity` ("low" | "medium" | "high", required)

**Purpose**: Controls timeout and rate limits

**Security Impact**: Higher sensitivity = stricter limits

| Level | Timeout | Max Calls/Min | Use For |
|-------|---------|---------------|---------|
| `low` | 10s | 50 | Read-only docs, simple utilities |
| `medium` | 7.5s | 20 | Browser automation, complex queries |
| `high` | 5s | 10 | Security-sensitive, expensive operations |

**Examples**:
```json
// LOW - Documentation MCP (safe, fast, read-only)
{
  "id": "cloudflare",
  "sensitivity": "low"
}

// MEDIUM - Browser automation (resource-intensive)
{
  "id": "playwright",
  "sensitivity": "medium"
}

// HIGH - Security operations (careful control needed)
{
  "id": "security-scanner",
  "sensitivity": "high"
}
```

**Guidelines**:
- **low**: Default for most MCPs (docs, search, utilities)
- **medium**: Browser automation, AI services, complex processing
- **high**: Operations with security implications or high cost

---

#### `visibility` ("default" | "opt_in" | "experimental", required)

**Purpose**: Controls when MCP appears in discovery

**Security Impact**: Prevents accidental use of unstable/dangerous MCPs

| Level | Behavior | Use For |
|-------|----------|---------|
| `default` | Always available | Stable, well-tested MCPs |
| `opt_in` | Must explicitly allow | Experimental or high-resource MCPs |
| `experimental` | Hidden unless specifically requested | Unstable, testing-only MCPs |

**Examples**:
```json
// DEFAULT - Stable production MCP
{
  "id": "cloudflare",
  "visibility": "default"  // Always shown
}

// OPT_IN - Resource-intensive MCP
{
  "id": "playwright",
  "visibility": "opt_in"  // Requires allowedMcpIds: ["playwright"]
}

// EXPERIMENTAL - Testing only
{
  "id": "experimental-feature",
  "visibility": "experimental"  // Never shown unless specifically requested
}
```

**How opt_in works**:
```typescript
// Won't appear in general discovery
list_mcp_capabilities({ query: "browser testing" })
// → Returns: [] (playwright hidden)

// Must explicitly allow
execute_mcp_code({
  code: "...",
  allowedMcpIds: ["playwright"]  // ✅ Now playwright can be used
})
```

---

#### `priority` (number 1-10, required)

**Purpose**: Breaks ties when multiple MCPs match a query

**Impact**: Higher priority appears first in results

**Scale**:
- `10`: Critical infrastructure (Cloudflare, primary platform MCPs)
- `8-9`: Important tools (Nuxt, shadcn, Better Auth)
- `6-7`: Useful utilities (Lucide, Context7, Ultracite)
- `4-5`: Specialized tools (Sequential Thinking, grep-mcp)
- `1-3`: Rarely needed or experimental

**Examples**:
```json
// Cloudflare = highest priority (platform-critical)
{ "id": "cloudflare", "priority": 10 }

// Nuxt = high priority (framework docs)
{ "id": "nuxt", "priority": 8 }

// Time = medium priority (utility)
{ "id": "time", "priority": 6 }

// grep-mcp = low priority (niche use case)
{ "id": "grep-mcp", "priority": 5 }
```

**Guidelines**:
- Only one MCP should have priority `10`
- Most MCPs should be 6-8
- Reserve 1-3 for experimental/niche tools

---

#### `autoDiscoverTools` (boolean, required)

**Purpose**: Whether to load tool schemas automatically

**Impact**:
- `true`: Tools loaded when MCP is described
- `false`: Tools only loaded on explicit request

**Current recommendation**: Always use `true`
```json
{
  "autoDiscoverTools": true  // Standard for all MCPs
}
```

**Future use case**: `false` for MCPs with 100+ tools where lazy loading is critical

---

## Complete Example

```json
{
  "id": "cloudflare",
  "title": "Cloudflare platform MCP",
  "summary": "Interact with Cloudflare's MCP endpoint for documentation and platform operations",
  "mcp": {
    "transport": "stdio",
    "command": "npx",
    "args": [
      "mcp-remote",
      "https://docs.mcp.cloudflare.com/sse"
    ]
  },
  "domains": [
    "cloudflare",
    "workers",
    "kv",
    "r2",
    "queues",
    "zero_trust",
    "networking",
    "security",
    "observability"
  ],
  "tags": [
    "cloudflare",
    "platform",
    "infra",
    "docs",
    "workers",
    "mcp"
  ],
  "examples": [
    "Fetch Cloudflare Workers documentation for a specific API.",
    "Search Cloudflare platform docs for queues or KV usage patterns.",
    "Look up configuration guidance for Zero Trust or networking features."
  ],
  "sensitivity": "low",
  "visibility": "default",
  "priority": 10,
  "autoDiscoverTools": true
}
```

---

## Validation Rules

### Required Fields Checklist

- [ ] `id` present and unique
- [ ] `title` present and descriptive
- [ ] `summary` present and one sentence
- [ ] `mcp.transport` is "stdio" or "http"
- [ ] `mcp.command` present (if stdio)
- [ ] `mcp.args` present (if stdio)
- [ ] `mcp.url` present (if http)
- [ ] `domains` array with 3+ entries
- [ ] `tags` array with 3+ entries
- [ ] `examples` array with 1+ entry
- [ ] `sensitivity` is "low", "medium", or "high"
- [ ] `visibility` is "default", "opt_in", or "experimental"
- [ ] `priority` is number between 1-10
- [ ] `autoDiscoverTools` is boolean

### Common Mistakes

❌ **Using underscores in ID**
```json
{ "id": "my_mcp" }  // Bad
{ "id": "my-mcp" }  // Good
```

❌ **Missing transport fields**
```json
{
  "mcp": {
    "transport": "stdio"
    // Missing: command, args
  }
}
```

❌ **Sensitivity/visibility typos**
```json
{ "sensitivity": "Low" }      // Bad - case sensitive
{ "sensitivity": "low" }      // Good

{ "visibility": "default" }   // Good
{ "visibility": "Default" }   // Bad - case sensitive
```

❌ **Priority out of range**
```json
{ "priority": 0 }    // Bad - must be 1-10
{ "priority": 11 }   // Bad - must be 1-10
{ "priority": 7 }    // Good
```

---

## Adding a New MCP (Step-by-Step)

### 1. Find MCP Package

```bash
# Example: Adding @modelcontextprotocol/server-time
npm view @modelcontextprotocol/server-time
```

### 2. Create Entry Template

```json
{
  "id": "time",
  "title": "Time MCP",
  "summary": "Provide time and timezone utilities via MCP",
  "mcp": {
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-time"]
  },
  "domains": ["time", "timezone", "datetime"],
  "tags": ["time", "timezone", "utility"],
  "examples": [
    "Query current time in specific timezones.",
    "Convert between timezones."
  ],
  "sensitivity": "low",
  "visibility": "default",
  "priority": 6,
  "autoDiscoverTools": true
}
```

### 3. Test Connection

```bash
# Test that the MCP starts correctly
npx -y @modelcontextprotocol/server-time

# Should output MCP server initialization messages
# Press Ctrl+C to exit
```

### 4. Add to Registry

Edit `mcp.registry.json`:
```json
{
  "servers": [
    // ... existing MCPs
    {
      "id": "time",
      // ... your new entry
    }
  ]
}
```

### 5. Verify Discovery

```typescript
// Ask Claude Code:
"What MCPs are available for time/timezone operations?"

// Should return your new MCP
```

---

## Migration Guide

### From Old Format

If you have MCPs configured in a different format:

**Old format** (claude.ai desktop):
```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["mcp-remote", "https://docs.mcp.cloudflare.com/sse"]
    }
  }
}
```

**New format** (mcp.registry.json):
```json
{
  "servers": [
    {
      "id": "cloudflare",
      "title": "Cloudflare platform MCP",
      "summary": "Interact with Cloudflare's MCP endpoint for documentation",
      "mcp": {
        "transport": "stdio",
        "command": "npx",
        "args": ["mcp-remote", "https://docs.mcp.cloudflare.com/sse"]
      },
      "domains": ["cloudflare", "workers"],
      "tags": ["cloudflare", "docs"],
      "examples": ["Fetch Cloudflare documentation."],
      "sensitivity": "low",
      "visibility": "default",
      "priority": 10,
      "autoDiscoverTools": true
    }
  ]
}
```

**Key differences**:
1. Nested under `servers` array
2. Requires `id`, `title`, `summary`
3. Requires discovery fields (`domains`, `tags`, `examples`)
4. Requires safety fields (`sensitivity`, `visibility`, `priority`)
5. Connection under `mcp` object with explicit `transport`

---

## Future Schema Extensions

**Planned for v1.1**:
- `version`: Semantic version constraint
- `dependencies`: Required npm packages
- `capabilities`: Structured capability declarations
- `rateLimit`: Per-MCP custom rate limiting
- `caching`: Tool response caching policies

**Planned for v1.2**:
- `authentication`: Auth flow configuration
- `retry`: Custom retry policies
- `fallback`: Fallback MCP if this one fails
- `alias`: Alternative IDs for backwards compatibility

---

## Resources

- **MCP Protocol**: [references/mcp-protocol.md](./mcp-protocol.md)
- **Security Model**: [references/security-model.md](./security-model.md)
- **Troubleshooting**: [references/troubleshooting.md](./troubleshooting.md)
- **Official MCP Docs**: https://modelcontextprotocol.io

---

**Last Updated**: 2025-11-11
**Schema Version**: 1.0.0
**Maintainer**: Claude Skills Maintainers
