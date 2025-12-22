## 🚀 Official Cloudflare Templates (Start Here!)

**Before using this skill's templates**, know that Cloudflare provides **official starter templates** via `bunx create` (preferred) or `npm create`.

### Recommended Starting Point

**For most projects, start with Cloudflare's official authless template:**

```bash
bunx create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/remote-mcp-authless
# or
npm create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/remote-mcp-authless

cd my-mcp-server
bun install
bun run dev
# or
npm install
bun run dev
# or
npm run dev
```

**What you get:**
- ✅ Minimal working MCP server (~50 lines)
- ✅ Dual transport support (SSE + Streamable HTTP)
- ✅ Pre-configured wrangler.jsonc
- ✅ Ready to deploy immediately

**Then customize with patterns from this skill** to avoid the 22+ common errors!

---

### All Available Cloudflare Templates

Cloudflare maintains 14+ official MCP templates. Use these as starting points:

#### Basic Templates

| Template Command | Purpose | When to Use |
|-----------------|---------|-------------|
| `--template=cloudflare/ai/demos/remote-mcp-authless` | **Gold standard starter** - No auth, simple tools | New projects, learning, public APIs |
| `--template=cloudflare/ai/demos/remote-mcp-github-oauth` | GitHub OAuth + Workers AI | Developer tools, GitHub integrations |
| `--template=cloudflare/ai/demos/remote-mcp-google-oauth` | Google OAuth | Google Workspace integration |

#### Advanced Authentication Templates

| Template Command | Auth Method | Use Case |
|-----------------|-------------|----------|
| `--template=cloudflare/ai/demos/remote-mcp-auth0` | Auth0 | Enterprise SSO |
| `--template=cloudflare/ai/demos/remote-mcp-authkit` | WorkOS AuthKit | B2B SaaS applications |
| `--template=cloudflare/ai/demos/remote-mcp-logto` | Logto | Open-source auth |
| `--template=cloudflare/ai/demos/remote-mcp-cf-access` | Cloudflare Access | Internal company tools |
| `--template=cloudflare/ai/demos/mcp-server-bearer-auth` | Bearer tokens | Custom auth systems |

#### Integration Examples

| Template Command | Demonstrates | Cloudflare Services |
|-----------------|--------------|---------------------|
| `--template=cloudflare/ai/demos/remote-mcp-server-autorag` | RAG (Retrieval-Augmented Generation) | Workers AI + Vectorize |
| `--template=cloudflare/ai/demos/python-workers-mcp` | Python MCP servers | Python Workers |

---

### When to Use This Skill's Templates

**Use this skill's templates when:**
- Learning how URL paths work (use `mcp-http-fundamentals.ts`)
- Need comprehensive error prevention (all templates include warnings)
- Want detailed comments explaining every decision
- Building complex integrations (Workers AI, D1, Bearer auth)

**This skill's templates are MORE educational** than Cloudflare's (more comments, defensive patterns, error handling).

**Cloudflare's templates are FASTER to start** with (minimal, production-ready).

**Best approach**: Start with Cloudflare's template, then reference this skill to avoid errors!

---

### Production MCP Servers (Study These!)

Cloudflare maintains **15 production MCP servers** showing real-world integration patterns:

**Key servers to study:**
- `workers-bindings` - D1, KV, R2, AI, Durable Objects usage
- `browser-rendering` - Web scraping + screenshot tools
- `autorag` - Vectorize RAG pattern
- `ai-gateway` - Workers AI Gateway analytics
- `docs` - Cloudflare documentation search

**Repository**: https://github.com/cloudflare/mcp-server-cloudflare

**Why study these?** They show production-grade patterns for:
- Error handling
- Rate limiting
- Caching strategies
- Real API integrations
- Security best practices

---

## 🎯 Quick Start Workflow (Your Step-by-Step Guide)

**Follow this workflow for your next MCP server to avoid errors and ship fast.**

---

### Step 1: Choose Your Starting Template

**Decision tree:**

```
What are you building?

├─ 🆓 Public/dev server (no auth needed)
│  └─> Use: remote-mcp-authless ⭐ RECOMMENDED FOR MOST PROJECTS
│
├─ 🔐 GitHub integration
│  └─> Use: remote-mcp-github-oauth (includes Workers AI example)
│
├─ 🔐 Google Workspace integration
│  └─> Use: remote-mcp-google-oauth
│
├─ 🏢 Enterprise SSO (Auth0, Okta, etc.)
│  └─> Use: remote-mcp-auth0 or remote-mcp-authkit
│
├─ 🔑 Custom auth system / API keys
│  └─> Start with authless, then add bearer auth (see Step 3)
│
└─ 🏠 Internal company tool
   └─> Use: remote-mcp-cf-access (Cloudflare Zero Trust)
```

**Not sure?** Start with `remote-mcp-authless` - you can add auth later!

---

### Step 2: Create from Template

```bash
# Replace [TEMPLATE] with your choice from Step 1
bunx create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/[TEMPLATE]
# or
npm create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/[TEMPLATE]

# Example: authless template (most common)
npm create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/remote-mcp-authless

# Navigate and install
cd my-mcp-server
npm install

# Start dev server
npm run dev
```

**Your MCP server is now running at**: `http://localhost:8788/sse`

---

### Step 3: Customize with This Skill's Patterns

**Now add features by copying patterns from this skill:**

#### Need Workers AI (image/text generation)?
```bash
# Copy our Workers AI template
cp ~/.claude/skills/cloudflare-mcp-server/templates/mcp-with-workers-ai.ts src/my-ai-tools.ts

# Add AI binding to wrangler.jsonc:
# { "ai": { "binding": "AI" } }
```

**Tools you get**: `generate_image`, `generate_text`, `list_ai_models`

---

#### Need a database (D1)?
```bash
# Copy our D1 template
cp ~/.claude/skills/cloudflare-mcp-server/templates/mcp-with-d1.ts src/my-db-tools.ts

# Create D1 database:
bunx wrangler d1 create my-database
# or
npx wrangler d1 create my-database

# Add binding to wrangler.jsonc
```

**Tools you get**: `create_user`, `get_user`, `list_users`, `update_user`, `delete_user`, `search_users`

---

#### Need bearer token auth?
```bash
# Copy our bearer auth template
cp ~/.claude/skills/cloudflare-mcp-server/templates/mcp-bearer-auth.ts src/index.ts

# Add token validation (KV, external API, or static)
```

**What you get**: Authorization header middleware, token validation, authenticated tools

---

### Step 4: Deploy to Cloudflare

```bash
# Login (first time only)
bunx wrangler login
# or
npx wrangler login

# Deploy to production
bunx wrangler deploy
# or
npx wrangler deploy
```

**Output shows your deployed URL**:
```
✨ Deployment complete!
https://my-mcp-server.YOUR_ACCOUNT.workers.dev
```

**⚠️ CRITICAL: Note this URL - you'll need it in Step 5!**

---

### Step 5: Test & Configure Client

#### A. Test with curl (PREVENTS 80% OF ERRORS!)

```bash
# Test the exact URL you'll use in client config
curl https://my-mcp-server.YOUR_ACCOUNT.workers.dev/sse
```

**Expected response**:
```json
{
  "name": "My MCP Server",
  "version": "1.0.0",
  "transports": ["/sse", "/mcp"]
}
```

**Got 404?** → Your client URL will be wrong! See "HTTP Transport Fundamentals" below.

---

#### B. Update Claude Desktop Config

**Linux/Mac**: `~/.config/claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**For authless servers**:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp-server.YOUR_ACCOUNT.workers.dev/sse"
    }
  }
}
```

**⚠️ CRITICAL**: URL must match the curl command that worked in Step 5A!

**With OAuth**:
```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "https://my-mcp-server.YOUR_ACCOUNT.workers.dev/sse",
      "auth": {
        "type": "oauth",
        "authorizationUrl": "https://my-mcp-server.YOUR_ACCOUNT.workers.dev/authorize",
        "tokenUrl": "https://my-mcp-server.YOUR_ACCOUNT.workers.dev/token"
      }
    }
  }
}
```

**All three URLs must use the same domain!**

---

#### C. Restart Claude Desktop

**Config only loads at startup:**
1. Quit Claude Desktop completely
2. Reopen
3. Check for your MCP server in tools list

---

### Step 6: Verify It Works

**Test a tool call:**
1. Open Claude Desktop
2. Type: "List available MCP tools"
3. Your server's tools should appear
4. Try calling one: "Use the add tool to add 5 + 3"

**If tools don't appear** → See "Debugging Guide" in references/

---

### Post-Deployment Checklist

Before declaring success, verify:

- [ ] `curl https://worker.dev/sse` returns server info (not 404)
- [ ] Client config URL matches curl URL exactly
- [ ] Claude Desktop restarted after config update
- [ ] Tools visible in Claude Desktop
- [ ] Test tool call succeeds
- [ ] (OAuth only) All three URLs use same domain
- [ ] No errors in `npx wrangler tail` logs

**All checked?** 🎉 **Your MCP server is live!**

---

### Common Next Steps

**Want to add more features?**

1. **More tools** - Add to `init()` method in your McpAgent class
2. **Workers AI** - Copy patterns from `mcp-with-workers-ai.ts`
3. **Database** - Copy patterns from `mcp-with-d1.ts`
4. **Authentication** - Copy patterns from `mcp-bearer-auth.ts` or `mcp-oauth-proxy.ts`
5. **Durable Objects state** - Copy patterns from `mcp-stateful-do.ts`

**Want to avoid errors?**
- Read "HTTP Transport Fundamentals" section below (prevents URL path errors)
- Read "22 Known Errors" section (prevents all common mistakes)
- Check `references/debugging-guide.md` when stuck

---

### TL;DR - The 5-Minute Workflow

```bash
# 1. Create from template (30 seconds)
npm create cloudflare@latest -- my-mcp \
  --template=cloudflare/ai/demos/remote-mcp-authless
cd my-mcp && npm install

# 2. Customize (optional, 2 minutes)
# Copy patterns from this skill if needed

# 3. Deploy (30 seconds)
npx wrangler deploy

# 4. Test (30 seconds)
curl https://YOUR-WORKER.workers.dev/sse

# 5. Configure client (1 minute)
# Update claude_desktop_config.json with URL from step 4
# Restart Claude Desktop

# 6. Verify (30 seconds)
# Test a tool call in Claude Desktop
```

**Total time**: ~5 minutes from zero to working MCP server! 🚀

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

## Quick Start (5 Minutes)

Now that you understand URL configuration, let's build your first MCP server.

### Option 1: Copy Minimal Template

Use the `mcp-http-fundamentals.ts` template - the simplest working example.

```bash
# Copy minimal template
cp ~/.claude/skills/cloudflare-mcp-server/templates/mcp-http-fundamentals.ts src/index.ts

# Install dependencies
npm install

# Start dev server
npm run dev

# Test connection
curl http://localhost:8788/sse
# Should return: {"name":"My MCP Server","version":"1.0.0",...}
```

### Option 2: Deploy from Cloudflare Template

```bash
# Create new MCP server from official template
npm create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/remote-mcp-authless

cd my-mcp-server
npm install
npm run dev
```

Your MCP server is now running at `http://localhost:8788/sse`

### Test with MCP Inspector

```bash
# In a new terminal
npx @modelcontextprotocol/inspector@latest

# Open http://localhost:5173
# Enter: http://localhost:8788/sse
# Click "Connect" and test tools
```

### Deploy to Cloudflare

```bash
# Deploy
npx wrangler deploy

# Output shows your URL:
# https://my-mcp-server.YOUR_ACCOUNT.workers.dev

# ⚠️ REMEMBER: Update client config with this URL + /sse!
```

---

